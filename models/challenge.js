const mongoose = require('mongoose');
const URLSlugs = require('mongoose-url-slugs');

const TestCaseSchema = new mongoose.Schema({
    input: {
        type: String,
        required: true
    },
    output: {
        type: String,
        required: true
    }
});

const ChallengeSchema = mongoose.Schema({
    'title': {
        type: String,
        rquired: true
    },
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
        required: true
    },
    'testCases': {
        type: Array,
        Schema: TestCaseSchema,
        required: true
    }
});

ChallengeSchema.plugin(URLSlugs('title'));

const Challenge = mongoose.model('Challenge', ChallengeSchema);

Challenge.getAllChallenges = (callback) => {
    Challenge.find(callback);
};

module.exports = Challenge;