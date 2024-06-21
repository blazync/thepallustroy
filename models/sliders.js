const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const sliderSchema = new Schema({
    image_url: String,
    caption: String,
    status: String,
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

const Slider = mongoose.model('Slider', sliderSchema);
module.exports = Slider;