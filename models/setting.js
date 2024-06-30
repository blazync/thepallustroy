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
    smtp_service: {
        type: String,
        required: true,
        default: 'Gmail'
    },
    smtp_host: {
        type: String,
        required: true,
        default: 'smtp.gmail.com'
    },
    smtp_port: {
        type: Number,
        required: true,
        default: 465
    },
    smtp_secure: {
        type: Boolean,
        required: true,
        default: true
    },
    smtp_user: {
        type: String,
        required: true
    },
    smtp_pass: {
        type: String,
        required: true
    },
    from_email:{
        type: String,
        required: true
    },
    facebook:{
        type: String,
        required: true
    },
    twitter:{
        type: String,
        required: true
    },
    instagram:{
        type: String,
        required: true
    },
    whatsapp:{
        type: String,
        required: true
    },
    email_image_url:{
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Settings', settingsSchema);
