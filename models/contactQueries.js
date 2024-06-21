const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const contactInquirySchema = new Schema({
    name: String,
    email: String,
    message: String,
    status: String,
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

const ContactInquiry = mongoose.model('ContactInquiry', contactInquirySchema);
module.exports = ContactInquiry;