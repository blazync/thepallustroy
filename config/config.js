const mongoose = require('mongoose');
require('dotenv').config(); // Load environment variables

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            dbName: process.env.DB_NAME // Use process.env.DB_NAME instead of env.DBNAME
        });

        console.log('Connected to MongoDB');
        // console.log("Pinged your deployment. You successfully connected to MongoDB!");

        // You can perform additional operations here after connecting successfully
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        // Exit process on failure
        process.exit(1);
    }
};

module.exports = connectDB;
