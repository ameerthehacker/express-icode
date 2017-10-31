const mongoose = require('mongoose');
const Permission = require('./permission');
const Schema = mongoose.SchemaTypes;

const RoleSchema = mongoose.Schema({
    name: {
        type: String,
        reuqired: true
    },
    permissions: {
        type: [Schema.ObjectId],
        required: true
    }
});

const Role = mongoose.model('Role', RoleSchema);

Role.getPermissions = (role, callback) => {
    Permission.find().where('_id').in(role.permissions).exec((err, permissions) => callback(err, permissions));
};

module.exports = Role;