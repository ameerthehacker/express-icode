const mongoose = require('mongoose');
const URLSlugs = require('mongoose-url-slugs');
const Schema = mongoose.SchemaTypes;

const AssignmentSchema = mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    submissionStartDate: {
        type: Date,
        required: true
    },
    submissionEndDate: {
        type: Date,
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

AssignmentSchema.plugin(URLSlugs('title'));

const Assignment = mongoose.model('Assignment', AssignmentSchema);

function getIndianTime() {
    // ISD is 5h:30m ahead of UTC thus add 5h:30m to the time
    // 5h: 30m = 5 * 60 * 60 + 30 * 60 seconds
    let timeOffset = (5 * 60 * 60 + 30 * 60) * 1000;
    return Date.now() + timeOffset;
}
Assignment.isRunning = (assignment) => {
    let submissionStartDate = new Date(assignment.submissionStartDate).getTime(); 
    let submissionEndDate = new Date(assignment.submissionEndDate).getTime(); 
    if(getIndianTime() >= submissionStartDate && getIndianTime() <= submissionEndDate) {
        return true;
    }
    else {
        return false;
    }
}

module.exports = Assignment;