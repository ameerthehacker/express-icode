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

module.exports = router;
