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

Contest.isOpen = (contest) => {
    let registrationStartDate = new Date(contest.registrationStartDate);
    let registrationEndDate = new Date(contest.registrationEndDate);
    let contestStartDate = new Date(contest.contestStartDate);    
    if(Date.now() <= registrationEndDate.getTime() && Date.now() >= registrationStartDate.getTime()) {
        return true;
    }  
    else {
        return false;
    }  
}

module.exports = Contest;