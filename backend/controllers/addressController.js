const NodeGeocoder = require('node-geocoder');
const Address = require('../models/Address');

const geocoder = NodeGeocoder({ provider: 'openstreetmap' });

// --- CONFIGURATION ---
const WAREHOUSE_COORDS = { lat: 9.9312, lng: 76.2673 }; // Example: Kochi, Kerala
const BASE_SHIPPING_LOCAL = 50;  // Flat fee up to 10km
const PER_KM_CHARGE = 5;         // Extra per KM after 10km
const STATE_FLAT_RATE = 150;     // Different state but same country
const GLOBAL_FLAT_RATE = 1500;   // International shipping

// --- HELPER: CALCULATE RADIUS (Haversine Formula) ---
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in KM
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in KM
};

// --- CONTROLLER: SAVE GEO-LOCATION & CALCULATE SHIPPING ---
const saveLocationAndGetShipping = async (req, res) => {
    try {
        const { latitude, longitude } = req.body;
        const userId = req.user.id;

        // 1. Reverse Geocode using OpenStreetMap
        const geoResponse = await geocoder.reverse({ lat: latitude, lon: longitude });
        if (!geoResponse.length) return res.status(400).json({ message: "Address not found" });

        const data = geoResponse[0];
        
        // 2. Determine Shipping Charge Logic
        let shippingCharge = 0;
        const distance = calculateDistance(WAREHOUSE_COORDS.lat, WAREHOUSE_COORDS.lng, latitude, longitude);

        if (data.country !== "India") {
            // GLOBAL TIER
            shippingCharge = GLOBAL_FLAT_RATE;
        } else if (data.state !== "Kerala") {
            // INTER-STATE TIER
            shippingCharge = STATE_FLAT_RATE;
        } else {
            // LOCAL RADIUS TIER (Within Kerala)
            if (distance <= 10) {
                shippingCharge = BASE_SHIPPING_LOCAL;
            } else {
                shippingCharge = BASE_SHIPPING_LOCAL + (Math.round(distance - 10) * PER_KM_CHARGE);
            }
        }

        // 3. Save Address to DB
        const addressData = {
            user: userId,
            fullAddress: data.formattedAddress,
            city: data.city,
            state: data.state,
            country: data.country,
            zipCode: data.zipcode,
            location: { coordinates: [longitude, latitude] }
        };

        const savedAddress = await Address.findOneAndUpdate(
            { user: userId }, 
            addressData, 
            { upsert: true, new: true }
        );

        res.status(200).json({
            address: savedAddress,
            distance: distance.toFixed(2) + " KM",
            shippingCharge
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { saveLocationAndGetShipping };
