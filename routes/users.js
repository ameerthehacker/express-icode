const express = require('express');
const router = express.Router();
const User = require('../models/user');

router.get('/', function(req, res, next) {
  let page = req.query.page ? req.query.page: 1;  

  User.getAllUsers(page, (err, users) => {
    if(!err) {
        res.json({ error: false, msg: users });
    }
    else {
        res.json({ error: true, msg: err });            
    }
  });
});
function initChallengeFromRequest(req) {
  let user = {};
  user.firstName = req.body.firstName;
  user.lastName = req.body.lastName;
  user.email = req.body.email;
  user.gender = req.body.gender;
  return user;
}
router.get('/:username', (req, res, next) => {
  const username = req.params.username;

  User.findByUsername(username, (err, user) => {
    if(!err) {
      res.json({ error: false, msg: user });
    }
    else {
      res.json({ error: true, msg: err });
    }
  });
});
router.put('/:username', (req, res, next) => {
  const username = req.params.username;
  let user = initChallengeFromRequest(req);

  User.update({ username: username }, user, (err, user) => {
    if(!err) {
      res.json({ error: false, msg: user });
    }
    else {
      res.json({ error: true, msg: err });
    }
  });
});

module.exports = router;
