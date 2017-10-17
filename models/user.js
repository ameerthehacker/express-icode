const mongoose = require('mongoose');
const bcrytjs = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String
    },
    age: {
        type: Number,
        required: true
    },
    gender: {
        type: String,
        required: true
    }
});

const User = mongoose.model('User', UserSchema);

User.findByUserId = (id, callback) => {
    User.findById(id, callback);
}
User.findByUsername = (username, callback) => {
    User.findOne({ 'username': username }, callback);
}
User.comparePassword = (candidatePassword, hash, callback) => {
    bcrytjs.compare(candidatePassword, hash, callback);
}

module.exports = User;