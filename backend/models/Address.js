const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fullAddress: String,
    city: String,
    state: String,
    country: String,
    zipCode: String,
    // GeoJSON for calculations
    location: {
        type: { type: String, default: 'Point' },
        coordinates: [Number] // [longitude, latitude]
    }
});

module.exports = mongoose.model('Address', addressSchema);