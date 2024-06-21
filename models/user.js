const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const addressSchema = new Schema({
    address_line1: String,
    address_line2: String,
    city: String,
    state: String,
    zip_code: String,
    country: String
});

const paymentMethodSchema = new Schema({
    method_name: String,
    details: String
});

const cartItemSchema = new Schema({
    product_id: { type: Schema.Types.ObjectId, ref: 'Product' },
    quantity: Number,
    total_value: Number,
    timestamp: { type: Date, default: Date.now }
});

const userSchema = new Schema({
    name: String,
    email: String,
    contactNumber: String,
    password: String,
    is_verified: Boolean,
    status: String,
    role: String,
    wishlist: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    cart: [cartItemSchema],
    addresses: [addressSchema],
    reviews: [{ type: Schema.Types.ObjectId, ref: 'ProductReview' }],
    payment_methods: [paymentMethodSchema],
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

// Check if the model already exists before defining it
const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;
