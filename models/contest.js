const mongoose = require('mongoose');
const URLSlugs = require('mongoose-url-slugs');
const Schema = mongoose.SchemaTypes;

const ContestSchema = mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    registrationStartDate: {
        type: Date,
        required: true
    },
    registrationEndDate: {
        type: Date,
        required: true
    },
    contestStartDate: {
        type: Date,
        required: true
    },
    duration: {
        type: Number,
        required: true
    },
    userId: {
        type: Schema.ObjectId,
        required: true
    },
    groupId: {
        type: Schema.ObjectId,
        required: true
    },
    challenges: {
        type: [Schema.ObjectId],
        required: true
    }
});

ContestSchema.plugin(URLSlugs('title'));

const Contest = mongoose.model('Contest', ContestSchema);

module.exports = Contest;