const express = require('express');
const Challenge = require('../models/challenge');
const router = express.Router();

router.get('/', (req, res, next) => {
    Challenge.getAllChallenges((err, challenges) => {
        if(!err) {
            res.json({ error: false, msg: challenges });
        }
        else {
            res.json({ error: true, msg: err });            
        }
    });
});
router.get('/:slug', (req, res, next) => {
    let slug = req.params.slug;
    Challenge.findBySlug(slug, (err, challenge) => {
        if(!err) {
            res.json({ error: false, msg: challenge });
        }
        else {
            res.json({ error: true, msg: err });            
        }
    });
});
router.post('/create', (req, res, next) => {
    let challenge = {};
    challenge.title = req.body.title;    
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