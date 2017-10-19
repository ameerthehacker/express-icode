const mongoose = require('mongoose');
const Schema = mongoose.SchemaTypes;

const SubmissionSchema = mongoose.Schema({
    challengeId: {
        type: Schema.ObjectId,
        ref: 'Challenge'
    },
    userId: {
        type: Schema.ObjectId,
        ref: 'User'
    },
    langCode: {
        type: String,
        required: true
    },
    code: {
        type: String
    },
    points: {
        type: Number,
        default: 0
    },
    timeOfSubmission: {
        type: Date,
        default: Date.now()
    },
    typeOfSubmission: {
        type: String,
        required: true
    },
    submittedForId: {
        type: String
    }
});

const Submission = mongoose.model('Submission', SubmissionSchema);

module.exports = Submission;