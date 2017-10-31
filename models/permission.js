const mongoose = require('mongoose');

const PermissionSchema = mongoose.Schema({
    name: {
        type: String,
        requrired: true
    },
    rank: {
        type: Number,
        required: true
    }
});

const Permission = mongoose.model('permission', PermissionSchema);

module.exports = Permission;