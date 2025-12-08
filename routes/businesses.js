const express = require('express');
const router = express.Router();
const { Business, Review } = require('../db.js');
const axios = require('axios');

// ============================================================================
// 🏷️ Helper function to map Google Places types to user-friendly categories
// ============================================================================
function mapPlacesTypeToCategory(types) {
    if (!types || types.length === 0) return null;

    // Priority mapping: check for specific types first
    const categoryMap = {
        // Accommodation
        'lodging': 'Hotel',
        'hotel': 'Hotel',
        'resort': 'Resort',
        'hostel': 'Hostel',
        'bed_and_breakfast': 'Bed & Breakfast',
        
        // Food & Drink
        'restaurant': 'Restaurant',
        'cafe': 'Cafe',
        'bar': 'Bar',
        'night_club': 'Nightclub',
        'bakery': 'Bakery',
        'meal_takeaway': 'Takeaway',
        'meal_delivery': 'Food Delivery',
        
        // Arts & Entertainment
        'art_gallery': 'Arts & Crafts',
        'museum': 'Museum',
        'movie_theater': 'Cinema',
        'theater': 'Theater',
        'amusement_park': 'Amusement Park',
        'zoo': 'Zoo',
        'aquarium': 'Aquarium',
        'stadium': 'Stadium',
        'park': 'Park',
        
        // Shopping
        'shopping_mall': 'Shopping Mall',
        'store': 'Store',
        'clothing_store': 'Fashion',
        'jewelry_store': 'Jewelry',
        'book_store': 'Bookstore',
        'supermarket': 'Supermarket',
        
        // Recreation
        'gym': 'Gym',
        'spa': 'Spa',
        'beauty_salon': 'Beauty Salon',
        'hair_care': 'Hair Salon',
        'bowling_alley': 'Bowling',
        'golf_course': 'Golf Course',
        'swimming_pool': 'Swimming Pool',
        
        // Services
        'bank': 'Bank',
        'atm': 'ATM',
        'hospital': 'Hospital',
        'pharmacy': 'Pharmacy',
        'gas_station': 'Gas Station',
        'car_rental': 'Car Rental',
        'parking': 'Parking',
        
        // Education
        'school': 'School',
        'university': 'University',
        'library': 'Library',
        
        // Religious
        'church': 'Church',
        'mosque': 'Mosque',
        'synagogue': 'Synagogue',
        'hindu_temple': 'Temple',
        
        // Other
        'tourist_attraction': 'Tourist Attraction',
        'point_of_interest': 'Point of Interest',
        'establishment': 'Business'
    };

    // Filter out generic types that should be last priority
    const genericTypes = ['establishment', 'point_of_interest'];
    const specificTypes = types.filter(t => !genericTypes.includes(t));
    const allTypes = [...specificTypes, ...types.filter(t => genericTypes.includes(t))];

    // Check each type in order, prioritizing specific types over generic ones
    for (const type of allTypes) {
        if (categoryMap[type]) {
            return categoryMap[type];
        }
    }

    // If no match, format the first specific type (or first type if no specific types) to be more readable
    const firstType = specificTypes.length > 0 ? specificTypes[0] : types[0];
    if (firstType) {
        // Convert snake_case to Title Case
        return firstType
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    return null;
}

// ============================================================================
// 🔍 GET /businesses/search?q=keyword — Search businesses using Google Places API
// ============================================================================
router.get('/search', async (req, res) => {
    const { q } = req.query;

    if (!q || q.trim() === '') {
        return res.json([]);
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    
    if (!apiKey) {
        console.error('Google Places API key not configured');
        return res.status(500).json({ error: 'Places API not configured' });
    }

    try {
        // Use Google Places Autocomplete API
        const autocompleteUrl = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';
        const autocompleteResponse = await axios.get(autocompleteUrl, {
            params: {
                input: q,
                key: apiKey,
                types: 'establishment', // Filter for businesses/establishments
                components: 'country:ug' // Optional: restrict to Uganda (remove if you want global)
            }
        });

        if (autocompleteResponse.data.status !== 'OK' && autocompleteResponse.data.status !== 'ZERO_RESULTS') {
            console.error('Google Places Autocomplete error:', autocompleteResponse.data.status);
            // Fallback to empty results instead of error
            return res.json([]);
        }

        const predictions = autocompleteResponse.data.predictions || [];

        // Map predictions to our business format
        const results = predictions.map(prediction => ({
            place_id: prediction.place_id,
            name: prediction.structured_formatting?.main_text || prediction.description,
            description: prediction.description,
            // These will be filled when user selects a place
            address: prediction.description,
            category: null,
            division: null,
            location: null,
            contact: null,
            latitude: null,
            longitude: null
        }));

        res.json(results);
    } catch (error) {
        console.error('Google Places API error:', error.message);
        res.status(500).json({ error: 'Search failed', details: error.message });
    }
});

// ============================================================================
// 🔍 GET /businesses/places/:placeId — Get full place details from Google Places
// ============================================================================
router.get('/places/:placeId', async (req, res) => {
    const { placeId } = req.params;
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Places API not configured' });
    }

    try {
        // Use Google Places Details API
        // Request fields: We only fetch business info, NOT ratings (we use our own rating system)
        const detailsUrl = 'https://maps.googleapis.com/maps/api/place/details/json';
        const detailsResponse = await axios.get(detailsUrl, {
            params: {
                place_id: placeId,
                key: apiKey,
                fields: 'name,formatted_address,geometry,formatted_phone_number,types,website,international_phone_number,editorial_summary'
            }
        });

        if (detailsResponse.data.status !== 'OK') {
            return res.status(404).json({ error: 'Place not found' });
        }

        const place = detailsResponse.data.result;

        // Extract address components
        const addressParts = place.formatted_address?.split(',') || [];
        const address = place.formatted_address || '';
        
        // Try to extract location/area from address (usually second-to-last part)
        const location = addressParts.length > 1 ? addressParts[addressParts.length - 2]?.trim() : null;
        const division = addressParts.length > 0 ? addressParts[addressParts.length - 1]?.trim() : null;

        // Extract and map category using our helper function
        const types = place.types || [];
        const category = mapPlacesTypeToCategory(types);

        // Extract description from editorial_summary (Google's curated description)
        // This contains the business overview/slogan/description
        let description = null;
        if (place.editorial_summary && place.editorial_summary.overview) {
            description = place.editorial_summary.overview;
        } else if (place.editorial_summary && place.editorial_summary.description) {
            description = place.editorial_summary.description;
        }
        
        // Fallback: If no editorial summary, create a simple description from name and category
        // Note: We don't use Google's rating here - we have our own rating system
        if (!description && category) {
            description = `${place.name} - ${category}`;
        }

        // Map to our business format
        // Note: We do NOT include Google's rating - we use our own user-submitted rating system
        const businessData = {
            place_id: placeId,
            name: place.name,
            address: address,
            location: location,
            division: division,
            category: category,
            description: description,
            contact: place.formatted_phone_number || place.international_phone_number || null,
            latitude: place.geometry?.location?.lat || null,
            longitude: place.geometry?.location?.lng || null,
            website: place.website || null,
            types: types
        };

        res.json(businessData);
    } catch (error) {
        console.error('Google Places Details API error:', error.message);
        res.status(500).json({ error: 'Failed to fetch place details', details: error.message });
    }
});

// ============================================================================
// 🏢 GET /businesses/:id — Get single business details
// ============================================================================
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const business = await Business.findById(id);

        if (!business) {
            return res.status(404).json({ error: 'Business not found' });
        }

        res.json({
            id: business._id.toString(),
            name: business.name,
            category: business.category,
            division: business.division,
            location: business.location,
            address: business.address,
            contact: business.contact,
            description: business.description,
            latitude: business.latitude,
            longitude: business.longitude,
            created_at: business.createdAt
        });
    } catch (err) {
        console.error('Business lookup error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// ============================================================================
// 🏢 GET /businesses — Get all businesses
// ============================================================================
router.get('/', async (req, res) => {
    try {
        const businesses = await Business.find()
            .select('name category division location address')
            .sort({ name: 1 })
            .limit(100)
            .lean();

        const businessesWithCounts = await Promise.all(businesses.map(async (b) => {
            const review_count = await Review.countDocuments({ business_id: b._id });
            return {
                id: b._id.toString(),
                name: b.name,
                category: b.category,
                division: b.division,
                location: b.location,
                address: b.address,
                review_count
            };
        }));

        res.json(businessesWithCounts);
    } catch (err) {
        console.error('Businesses fetch error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;
