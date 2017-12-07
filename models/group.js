const mongoose = require('mongoose');
const URLSlugs = require('mongoose-url-slugs');
const Schema = mongoose.SchemaTypes;
const pagination = require('mongoose-paginate');
const config = require('../config/env');

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
GroupSchema.plugin(pagination);

const Group = mongoose.model('Group', GroupSchema);

Group.getAllGroups = (page, callback) => {
    Group.paginate({}, { page: page, limit: config.pagination.perPage }, (err, groups) => {
        callback(err, groups);
    });
}

module.exports = Group;