const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const relatedProductsSchema = new Schema({
    product_id: { type: Schema.Types.ObjectId, ref: 'Product' },
    related_product_ids: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

const RelatedProduct = mongoose.model('RelatedProduct', relatedProductsSchema);
module.exports = RelatedProduct;