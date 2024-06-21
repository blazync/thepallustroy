const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const productQuerySchema = new Schema({
    user_id: { type: Schema.Types.ObjectId, ref: 'User' },
    product_id: { type: Schema.Types.ObjectId, ref: 'Product' },
    query: String,
    status: String,
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

const ProductQuery = mongoose.model('ProductQuery', productQuerySchema);
module.exports = ProductQuery;