const mongoose = require('mongoose');
const URLSlugs = require('mongoose-url-slugs');
const Schema = mongoose.SchemaTypes;

const GroupSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    userId: {
        type: Schema.ObjectId,
        ref: 'User'
    }
});

GroupSchema.plugin(URLSlugs('name'));

const Group = mongoose.model('Group', GroupSchema);

Group.getAllGroups = (callback) => {
    Group.find((err, groups) => {
        callback(err, groups);
    });
}

module.exports = Group;