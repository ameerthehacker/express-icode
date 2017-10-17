const express = require('express');
const Challenge = require('../models/challenge');
const router = express.Router();
const submissions = require('./submissions');
const checkRequest = require('./checkRequest');

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
router.post('/', (req, res, next) => {
    let challenge = {};
    challenge.title = req.body.title;    
    challenge.problemStatement = req.body.problemStatement;
    challenge.inputFormat = req.body.inputFormat;
    challenge.outputFormat = req.body.outputFormat;
    challenge.constraints = req.body.constraints;    
    challenge.sampleInput = req.body.sampleInput;        
    challenge.sampleOutput = req.body.sampleOutput;    
    challenge.explanation = req.body.explanation;
    challenge.testCases = req.body.testCases;
    challenge.userId = req.user.id;

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
router.get('/:slug', (req, res, next) => {
    let slug = req.params.slug;
    Challenge.findBySlug(slug, (err, challenge) => {
        if(checkRequest(err, challenge, res)) { return; }
        res.json({ error: false, msg: challenge });        
    });
});
router.put('/:slug', (req, res, next) => {
    let slug = req.params.slug;
    let challenge = {};
    challenge.title = req.body.title;    
    challenge.problemStatement = req.body.problemStatement;
    challenge.inputFormat = req.body.inputFormat;
    challenge.outputFormat = req.body.outputFormat;
    challenge.constraints = req.body.constraints;    
    challenge.sampleInput = req.body.sampleInput;        
    challenge.sampleOutput = req.body.sampleOutput;    
    challenge.explanation = req.body.explanation;
    challenge.testCases = req.body.testCases;
    Challenge.update({ slug: slug }, challenge, (err) => {
        if(!err){
            res.json({ error: false });
        }
        else{
            res.json({ error: true, msg: [err] });            
        }
    });
});
router.delete('/:slug', (req, res, next) => {
    let slug = req.params.slug;
    Challenge.findBySlug(slug, (err, challenge) => {
        if(checkRequest(err, challenge, res)) { return; }
        if(challenge.userId == req.user.id) {
            Challenge.remove({ slug: slug }, (err) => {
                if(!err){
                    res.json({ error: false });
                }
                else{
                    res.json({ error: true, msg: [err] });                        
                }
            });
        }
        else {
            // Forbidden access
            res.sendStatus(403);
        }
    });
    
});

// Nested routes for code submissions

router.use('/:slug/submissions', submissions);

module.exports = router;