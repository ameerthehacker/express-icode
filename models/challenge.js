const mongoose = require('mongoose');
const URLSlugs = require('mongoose-url-slugs');
const pagination = require('mongoose-paginate');
const config = require('../config/env');
const Schema = mongoose.SchemaTypes;

const SampleTestCaseSchema = new mongoose.Schema({
    input: {
        type: String,
        required: true
    },
    output: {
        type: String,
        required: true
    },
    explanation: {
        type: String,
        required: true
    }
});

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

const BoilerplateSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true
    },
    boilerplate: {
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
    sampleTestCases: {
        type: Array,
        Schema: SampleTestCaseSchema,
        required: true
    },
    testCases: {
        type: Array,
        Schema: TestCaseSchema,
        required: true
    },
    boilerplates: {
        type: Array,
        Schema: BoilerplateSchema
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
    Challenge.paginate({}, { limit: config.pagination.perPage, page: page }, callback);
};

module.exports = Challenge;