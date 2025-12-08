// Geocoding utilities for GPS coordinate handling

/**
 * Get GPS coordinates from address using OpenStreetMap Nominatim (FREE!)
 * @param {string} address - Full address or business name + location
 * @returns {Promise<{latitude: number, longitude: number} | null>}
 */
async function getCoordinatesFromAddress(address) {
    if (!address || address.trim() === '') {
        return null;
    }

    try {
        // Using OpenStreetMap Nominatim API (FREE, no API key needed)
        const encodedAddress = encodeURIComponent(address);
        const url = `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'HangoutSpots/1.0' // Required by Nominatim
            }
        });

        if (!response.ok) {
            console.error('Geocoding API error:', response.statusText);
            return null;
        }

        const data = await response.json();

        if (data && data.length > 0) {
            return {
                latitude: parseFloat(data[0].lat),
                longitude: parseFloat(data[0].lon)
            };
        }

        return null;
    } catch (error) {
        console.error('Geocoding error:', error);
        return null;
    }
}

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in meters
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    // Earth's radius in meters
    const R = 6371000;

    // Convert degrees to radians
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    // Haversine formula
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    // Distance in meters
    const distance = R * c;

    return Math.round(distance); // Round to nearest meter
}

/**
 * Check if user is within allowed radius of a location
 * @param {number} userLat - User's latitude
 * @param {number} userLon - User's longitude
 * @param {number} businessLat - Business latitude
 * @param {number} businessLon - Business longitude
 * @param {number} radiusMeters - Allowed radius in meters (default: 500)
 * @returns {boolean} True if within radius
 */
function isWithinRadius(userLat, userLon, businessLat, businessLon, radiusMeters = 500) {
    const distance = calculateDistance(userLat, userLon, businessLat, businessLon);
    return distance <= radiusMeters;
}

/**
 * Format distance for display
 * @param {number} meters - Distance in meters
 * @returns {string} Formatted distance (e.g., "50m" or "1.2km")
 */
function formatDistance(meters) {
    if (meters < 1000) {
        return `${meters}m`;
    } else {
        return `${(meters / 1000).toFixed(1)}km`;
    }
}

module.exports = {
    getCoordinatesFromAddress,
    calculateDistance,
    isWithinRadius,
    formatDistance
};

