const { User, UserAchievement, Review, Media, Checkin } = require('../db.js');

// ============================================================================
// 🎮 GAMIFICATION UTILITIES
// ============================================================================

/**
 * Calculate user level based on total points
 * @param {number} points - User's total points
 * @returns {object} Level info { number, title, icon, nextLevel, progress }
 */
function getUserLevel(points) {
    let level, title, icon, nextLevel;

    if (points >= 1000) {
        level = 5;
        title = "Elite Reviewer";
        icon = "🌟";
        nextLevel = null; // Max level
    } else if (points >= 500) {
        level = 4;
        title = "Community Star";
        icon = "⭐";
        nextLevel = 1000;
    } else if (points >= 200) {
        level = 3;
        title = "Local Guide";
        icon = "🗺️";
        nextLevel = 500;
    } else if (points >= 50) {
        level = 2;
        title = "City Scout";
        icon = "🔍";
        nextLevel = 200;
    } else {
        level = 1;
        title = "New Explorer";
        icon = "🌱";
        nextLevel = 50;
    }

    const progress = nextLevel ? Math.round((points / nextLevel) * 100) : 100;

    return { level, title, icon, nextLevel, progress };
}

/**
 * Award points to a user with daily limit guard
 * @param {string} userId - User ID (MongoDB ObjectId as string)
 * @param {number} points - Points to award
 * @param {function} callback - Callback (err, actualPointsAwarded)
 */
function awardPoints(userId, points, callback) {
    // Step 1: Check/reset daily points tracker
    User.findById(userId).then(user => {
        if (!user) return callback(new Error('User not found'), 0);

        let { points_today, points_reset_date, points: totalPoints } = user;
        const today = new Date().toISOString().split('T')[0];
        const resetDateStr = points_reset_date 
            ? new Date(points_reset_date).toISOString().split('T')[0] 
            : null;

        // Reset daily counter if it's a new day
        if (resetDateStr !== today) {
            points_today = 0;
            points_reset_date = new Date(today);
        }

        // Step 2: Apply daily cap (500 points/day)
        const DAILY_CAP = 500;
        const remainingCap = DAILY_CAP - points_today;

        if (remainingCap <= 0) {
            return callback(null, 0); // Daily limit reached
        }

        // Award only what's allowed under the cap
        const pointsToAward = Math.min(points, remainingCap);

        // Step 3: Update user points
        const newTotalPoints = totalPoints + pointsToAward;
        const levelInfo = getUserLevel(newTotalPoints);

        user.points = newTotalPoints;
        user.points_today = points_today + pointsToAward;
        user.points_reset_date = points_reset_date;
        user.level = levelInfo.level;

        user.save().then(() => {
            callback(null, pointsToAward);
        }).catch(err => {
            callback(err, 0);
        });
    }).catch(err => {
        callback(err, 0);
    });
}

/**
 * Deduct points from a user (no daily limit check)
 * @param {string} userId - User ID (MongoDB ObjectId as string)
 * @param {number} points - Points to deduct
 * @param {function} callback - Callback (err, actualPointsDeducted)
 */
function deductPoints(userId, points, callback) {
    User.findById(userId).then(user => {
        if (!user) return callback(new Error('User not found'), 0);

        const newPoints = Math.max(0, user.points - points);
        const levelInfo = getUserLevel(newPoints);

        user.points = newPoints;
        user.level = levelInfo.level;

        user.save().then(() => {
            callback(null, points);
        }).catch(err => {
            callback(err, 0);
        });
    }).catch(err => {
        callback(err, 0);
    });
}

/**
 * Check if user has already earned an achievement
 * @param {string} userId - User ID (MongoDB ObjectId as string)
 * @param {string} achievementType - Achievement identifier
 * @param {function} callback - Callback (err, hasAchievement)
 */
function hasAchievement(userId, achievementType, callback) {
    UserAchievement.findOne({ user_id: userId, achievement_type: achievementType })
        .then(achievement => {
            callback(null, !!achievement);
        })
        .catch(err => {
            callback(err, false);
        });
}

/**
 * Award an achievement badge to a user (one-time only)
 * @param {string} userId - User ID (MongoDB ObjectId as string)
 * @param {string} achievementType - Achievement identifier
 * @param {number} bonusPoints - Bonus points to award
 * @param {function} callback - Callback (err, awarded)
 */
function awardAchievement(userId, achievementType, bonusPoints, callback) {
    hasAchievement(userId, achievementType, (err, alreadyHas) => {
        if (err) return callback(err, false);
        if (alreadyHas) return callback(null, false); // Already has this achievement

        // Insert achievement
        const achievement = new UserAchievement({
            user_id: userId,
            achievement_type: achievementType
        });

        achievement.save().then(() => {
            // Award bonus points
            if (bonusPoints > 0) {
                awardPoints(userId, bonusPoints, (err3) => {
                    if (err3) console.error('Achievement bonus points error:', err3);
                    callback(null, true);
                });
            } else {
                callback(null, true);
            }
        }).catch(err2 => {
            // Handle duplicate key error (race condition)
            if (err2.code === 11000) {
                return callback(null, false); // Already awarded
            }
            callback(err2, false);
        });
    });
}

/**
 * Check and award milestone achievements based on user stats
 * @param {string} userId - User ID (MongoDB ObjectId as string)
 * @param {function} callback - Callback (err, newAchievements[])
 */
function checkMilestones(userId, callback) {
    const newAchievements = [];

    // Get user stats
    Promise.all([
        Review.countDocuments({ user_id: userId }),
        Review.distinct('business_id', { user_id: userId }).then(businessIds => {
            return Media.countDocuments({ business_id: { $in: businessIds } });
        }),
        Checkin.countDocuments({ user_id: userId })
    ]).then(([review_count, media_count, checkin_count]) => {
        // Check milestones
        const milestones = [
            { type: 'first_review', count: review_count, threshold: 1, points: 10 },
            { type: 'first_photo', count: media_count, threshold: 1, points: 5 },
            { type: 'milestone_10_reviews', count: review_count, threshold: 10, points: 50 },
            { type: 'milestone_50_reviews', count: review_count, threshold: 50, points: 200 },
            { type: 'milestone_100_reviews', count: review_count, threshold: 100, points: 500 },
            { type: 'checkin_champion', count: checkin_count, threshold: 10, points: 30 }
        ];

        let completed = 0;

        milestones.forEach((milestone) => {
            if (milestone.count >= milestone.threshold) {
                awardAchievement(userId, milestone.type, milestone.points, (err2, awarded) => {
                    if (awarded) {
                        newAchievements.push(milestone.type);
                    }
                    completed++;
                    if (completed === milestones.length) {
                        callback(null, newAchievements);
                    }
                });
            } else {
                completed++;
                if (completed === milestones.length) {
                    callback(null, newAchievements);
                }
            }
        });
    }).catch(err => {
        callback(err, []);
    });
}

/**
 * Get all achievements for a user
 * @param {string} userId - User ID (MongoDB ObjectId as string)
 * @param {function} callback - Callback (err, achievements[])
 */
function getUserAchievements(userId, callback) {
    UserAchievement.find({ user_id: userId })
        .sort({ awarded_at: -1 })
        .lean()
        .then(results => {
            // Map to friendly names
            const achievementNames = {
                'first_review': { name: 'First Step', icon: '🌱', description: 'Posted your first review' },
                'first_photo': { name: 'Shutterbug', icon: '📸', description: 'Uploaded your first photo' },
                'milestone_10_reviews': { name: '10 Reviews', icon: '🔥', description: 'Posted 10 reviews' },
                'milestone_50_reviews': { name: '50 Reviews', icon: '💯', description: 'Posted 50 reviews' },
                'milestone_100_reviews': { name: '100 Reviews', icon: '🏆', description: 'Posted 100 reviews' },
                'checkin_champion': { name: 'Check-in Champion', icon: '📍', description: 'Checked in 10 times' }
            };

            const achievements = results.map(row => ({
                ...achievementNames[row.achievement_type],
                type: row.achievement_type,
                awarded_at: row.awarded_at
            }));

            callback(null, achievements);
        })
        .catch(err => {
            callback(err, []);
        });
}

module.exports = {
    getUserLevel,
    awardPoints,
    deductPoints,
    hasAchievement,
    awardAchievement,
    checkMilestones,
    getUserAchievements
};
