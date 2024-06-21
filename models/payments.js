const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const paymentSchema = new Schema({
    order_id: { type: String, required: true },
    user_id: { type: Schema.Types.ObjectId, ref: 'User' },
    amount: Number,
    payment_method: String,
    payment_status: String,
    transaction_id: String,
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

const Payment = mongoose.model('Payment', paymentSchema);
module.exports = Payment;