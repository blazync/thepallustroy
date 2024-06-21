const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    applicationName: {
        type: String,
        required: true
    },
    contactNumber: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    serviceFee: {
        type: Number,
        required: true,
        default: 0
    },
    deliveryCharges: {
        type: Number,
        required: true,
        default: 0
    },
    service: {
        type: String,
        required: true,
        default: 'Gmail'
    },
    host: {
        type: String,
        required: true,
        default: 'smtp.gmail.com'
    },
    port: {
        type: Number,
        required: true,
        default: 465
    },
    secure: {
        type: Boolean,
        required: true,
        default: true
    },
    user: {
        type: String,
        required: true
    },
    pass: {
        type: String,
        required: true
    },
    facebook: String,
    instagram: String,
    twitter: String,
    linkedin: String,
    threads: String,
    whatsapp: String
});

module.exports = mongoose.model('Settings', settingsSchema);
