const express = require('express');
const Challenge = require('../models/challenge');
const router = express.Router();
const submissions = require('./submissions');
const checkRequest = require('./checkRequest');
const User = require('../models/user');

router.get('/', (req, res, next) => {
    let page = req.query.page ? req.query.page: 1;
    
    Challenge.getAllChallenges(page, (err, challenges) => {
        if(!err) {
            res.json({ error: false, msg: challenges });
        }
        else {
            res.json({ error: true, msg: err });            
        }
    });
});
function initChallengeFromRequest(req) {
    let challenge = {};

    challenge.title = req.body.title;    
    challenge.problemStatement = req.body.problemStatement;
    challenge.inputFormat = req.body.inputFormat;
    challenge.outputFormat = req.body.outputFormat;
    challenge.constraints = req.body.constraints;    
    challenge.sampleTestCases = req.body.sampleTestCases;    
    challenge.testCases = req.body.testCases;
    challenge.boilerplates = req.body.boilerplates;    
    challenge.userId = req.user.id;
    
    return challenge;
}
router.post('/', (req, res, next) => {
    User.hasPermission(req.user, 'manage-challenges', (err, status) => {
        if(status) {
            newChallenge = new Challenge(initChallengeFromRequest(req));

            newChallenge.save((err) => {
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
            res.send(403);
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
    let challenge = initChallengeFromRequest(req);

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