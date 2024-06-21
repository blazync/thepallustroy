const mongoose = require('mongoose');
const { Schema } = mongoose;

const productReviewSchema = new Schema({
    user_id: { type: Schema.Types.ObjectId, ref: 'User' },
    product_id: { type: Schema.Types.ObjectId, ref: 'Product' },
    rating: Number,
    review: String,
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

const ProductReview = mongoose.model('ProductReview', productReviewSchema);
module.exports = ProductReview;
