const mongoose = require('mongoose');
const URLSlugs = require('mongoose-url-slugs');
const pagination = require('mongoose-paginate');
const config = require('../config/env');
const Schema = mongoose.SchemaTypes;

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
    title: {
        type: String,
        rquired: true
    },
    problemStatement: {
        type: String,
        required: true
    },
    inputFormat: {
        type: String,
        required: true
    },
    outputFormat: {
        type: String,
        required: true
    }, 
    constraints: {
        type: String,
        required: true
    },
    sampleInput: {
        type: String,
        required: true
    },
    sampleOutput: {
        type: String,
        required: true
    },
    explanation: {
        type: String,
        required: true
    },
    testCases: {
        type: Array,
        Schema: TestCaseSchema,
        required: true
    },
    userId: {
        type: Schema.ObjectId,
        ref: 'User'
    }
});

ChallengeSchema.plugin(URLSlugs('title'));
ChallengeSchema.plugin(pagination);

const Challenge = mongoose.model('Challenge', ChallengeSchema);

Challenge.getAllChallenges = (page, callback) => {
    Challenge.paginate({}, { limit: config.pagintation.perPage, page: page }, callback);
};

module.exports = Challenge;