const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const viewedProductsSchema = new Schema({
    user_id: { type: Schema.Types.ObjectId, ref: 'User' },
    product_ids: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

const ViewedProduct = mongoose.model('ViewedProduct', viewedProductsSchema);
module.exports = ViewedProduct;