const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const productSchema = new Schema({
    name: String,
    description: String,
    price: Number,
    discountedPrice: Number,
    sku: String,
    no_of_components: Number,
    color: String,
    material: String,
    fit: String,
    artisan: String,
    categories: String,
    occasion: [String],
    collection: String,
    brand: String,
    place_of_manufacture: String,
    caution: String,
    contents: String,
    images: [String],
    stock: Number,
    status: String,
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    views: Number,
    bestseller: Boolean
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;