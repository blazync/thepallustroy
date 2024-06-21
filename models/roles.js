const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const roleSchema = new Schema({
    role_name: String,
    permissions: [String], // e.g., ['view_orders', 'manage_users']
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

const Role = mongoose.model('Role', roleSchema);
module.exports = Role;