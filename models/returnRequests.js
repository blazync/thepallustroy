const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const returnRequestSchema = new Schema({
    order_id: { type: Schema.Types.ObjectId, ref: 'Order' },
    user_id: { type: Schema.Types.ObjectId, ref: 'User' },
    reason: String,
    status: String,
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

const ReturnRequest = mongoose.model('ReturnRequest', returnRequestSchema);
module.exports = ReturnRequest;