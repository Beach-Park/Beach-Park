const mongoose = require('mongoose');

// Define the schema for users
const RegisterSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String
});

// Create and export the model for MongoDB collection
const RegisterModel = mongoose.model("logincollection", RegisterSchema);
module.exports = RegisterModel;
