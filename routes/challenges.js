const express = require('express');
const Challenge = require('../models/challenge');
const router = express.Router();

router.get('/', (req, res, next) => {
    res.json({ msg: 'TODO:// Challenges yet to be added' });
});
router.post('/create', (req, res, next) => {
    let challenge = {};
    challenge.problemStatement = req.body.problemStatement;
    challenge.inputFormat = req.body.inputFormat;
    challenge.outputFormat = req.body.outputFormat;
    challenge.constraints = req.body.constraints;    
    challenge.sampleInput = req.body.sampleInput;        
    challenge.sampleOutput = req.body.sampleOutput;    
    challenge.explanation = req.body.explanation;

    newChallenge = new Challenge(challenge);
    newChallenge.save((err) => {
        if(!err){
            res.json({ error: false });
        }
        else{
            res.json({ error: true, msg: [err] });            
        }
    });
});

module.exports = router;