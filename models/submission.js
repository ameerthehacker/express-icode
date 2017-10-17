const mongoose = require('mongoose');

const SubmissionSchema = mongoose.Schema({
    challengeId: {
        type: String, 
        required: true
    },
    userId: {
        type: String,
        required: true
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
    }
});

const Submission = mongoose.model('Submission', SubmissionSchema);

module.exports = Submission;