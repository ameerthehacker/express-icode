const mongoose = require('mongoose');
const Schema = mongoose.SchemaTypes;
const bcrytjs = require('bcryptjs');
const Role = require('./role');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String
    },
    age: {
        type: Number,
        required: true
    },
    gender: {
        type: String,
        required: true
    },
    roles: {
        type: [Schema.ObjectId],
        required: true
    }
});

const User = mongoose.model('User', UserSchema);

User.findByUserId = (id, callback) => {
    User.findById(id, callback);
}
User.findByUsername = (username, callback) => {
    User.findOne({ 'username': username }, callback);
}
User.comparePassword = (candidatePassword, hash, callback) => {
    bcrytjs.compare(candidatePassword, hash, callback);
}
User.getPermissions = (user, callback) => {
    Role.find().where('_id').in(user.roles).exec((err, roles) => {
       if(!err) {
           let rolesCount = 0;
           let permissionsSet = new Set([]);
           // Return empty array if there are no roles for the user
           if(roles.length == 0) {
               callback(err, []);
           }
           roles.forEach((role) => {
               Role.getPermissions(role, (err, permissions) => {
                   if(!err) {
                       for(let i = 0; i < permissions.length; i++) {
                           permissionsSet.add(permissions[i]);
                       }
                       rolesCount++;
                       if(rolesCount == roles.length) {
                           // Convert set to an array
                           let permissions = [];
                           permissionsSet.forEach((permission) => {
                               permissions.push(permission);
                           });
                           callback(err, permissions);
                       }
                   }
                   else {
                       callback(err, null);
                       return;
                   }
               }); 
           });
       }
       else {
           callback(err, null);
       }
    });
}
User.hasPermission = (user, permissionName, callback) => {
    User.getPermissions(user, (err, permissions) => {
        if(!err) {
            for(let i = 0; i < permissions.length; i++) {
                if(permissions[i].name == permissionName) {
                    callback(err, true);
                    return;
                }
            }
            callback(err, false);
        }
        else {
            callback(err, false);
        }
    });
    return false;
}

module.exports = User;