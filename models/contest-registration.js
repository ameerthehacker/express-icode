const mongoose = require('mongoose');
const Schema = mongoose.SchemaTypes;

const ContestRegistrationSchema = mongoose.Schema({
    contestId: {
        type: Schema.ObjectId,
        required: true
    },
    userId: {
        type: Schema.ObjectId,
        required: true
    }
});

const ContestRegistration = mongoose.model('ContestRegistration', ContestRegistrationSchema);

ContestRegistration.isUserRegistered = (contestId, userId, callback) => {
    ContestRegistration.findOne({ contestId: contestId, userId: userId }, (err, registration) => {
        callback(err, registration);
    });
}

module.exports = ContestRegistration;
