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

function getIndianTime() {
    // ISD is 5h:30m ahead of UTC thus add 5h:30m to the time
    // 5h: 30m = 5 * 60 * 60 + 30 * 60 seconds
    let timeOffset = (5 * 60 * 60 + 30 * 60) * 1000;
    return Date.now() + timeOffset;
}

Contest.isOpen = (contest) => {
    let registrationStartDate = new Date(contest.registrationStartDate);
    let registrationEndDate = new Date(contest.registrationEndDate);
    if(getIndianTime() <= registrationEndDate.getTime() && getIndianTime() >= registrationStartDate.getTime()) {
        return true;
    }  
    else {
        return false;
    }  
}
Contest.isRunning = (contest) => {
    let contestStartDate = new Date(contest.contestStartDate).getTime();   
    // Convert the hour to miliseconds
    let contestDuration = contest.duration * 60 * 60 * 1000;
    let contestEndDate = contestStartDate + contestDuration;
    if(getIndianTime() >= contestStartDate && getIndianTime() <= contestEndDate) {
        return true;
    }
    else {
        return false;
    }
}

module.exports = Contest;