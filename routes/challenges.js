const express = require('express');
const router = express.Router();

router.get('/', (req, res, next) => {
    res.json({ msg: 'TODO:// Challenges yet to be added' });
});

module.exports = router;