const mongoose = require('mongoose');

const ChallengeSchema = mongoose.Schema({
    'problemStatement': {
        type: String,
        required: true
    },
    'inputFormat': {
        type: String,
        required: true
    },
    'outputFormat': {
        type: String,
        required: true
    }, 
    'constraints': {
        type: String,
        required: true
    },
    'sampleInput': {
        type: String,
        required: true
    },
    'sampleOutput': {
        type: String,
        required: true
    },
    'explanation': {
        type: String,
        rquired: true
    }
});

module.exports = mongoose.model('Challenge', ChallengeSchema);