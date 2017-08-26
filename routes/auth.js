const express = require('express');
const router = express.Router();
const User = require('../models/user');

// Route for user login
router.post('/login', (req, res, next) => {
    let username = req.body.username;
    let password = req.body.password;

    // Get the user
    User.findByUsername(username, (err, user) => {
        if(!err){
            if(user){
                User.comparePassword(password, user.password, (err, isMatch) => {
                    if(!err){
                        if(isMatch){
                            res.json({ 'error': false, 'msg': 'Welcome' });                       
                        }
                        else{
                            res.json({ 'error': true, 'msg': 'Your password is incorrect!' });
                        }
                    }
                    else{
                        res.json({ 'error': true, 'msg': 'Internal Error:' + err });            
                    }
                });
            }
            else{
                res.json({ 'error': true, 'msg': 'Could not find your account!' });
            }
        }
        else{
            res.json({ 'error': true, 'msg': 'Internal Error:' + err });
        }
    });
});

module.exports = router;