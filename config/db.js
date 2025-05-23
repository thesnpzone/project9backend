const mongoose = require('mongoose');

const connectDB = async() => {
    try {

        const mongoURI = 'mongodb://localhost:27017/SkillHuntDB';

        await mongoose.connect(mongoURI);

        console.log('MongoDB connected successfully');
    } catch (err) {
        console.error('MongoDB connection error:', err.message);
        process.exit(1);
    }
};

module.exports = connectDB;