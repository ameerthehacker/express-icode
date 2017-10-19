const express = require('express');
const router = express.Router({ mergeParams: true });
const Group = require('../models/group');
const Challenge = require('../models/challenge');
const Contest = require('../models/contest');
const checkRequest = require('./checkRequest');
const date = require('date-and-time');

router.get('/', (req, res, next) => {
    let groupSlug = req.params.slug;
    Group.findBySlug(groupSlug, (err, group) => {
        if(checkRequest(err, group, res)) { return; }
        Contest.find({ groupId: group.id }, (err, contests) => {
            if(!err) {
                res.json({ error: false, msg: contests });
            }
            else {
                res.json({ error: true, msg: [err] });                
            }
        });
    });
});
router.get('/:contestSlug', (req, res, next) => {
    let groupSlug = req.params.slug;
    let contestSlug = req.params.contestSlug;
    Group.findBySlug(groupSlug, (err, group) => {
        if(checkRequest(err, group, res)) { return; }
        Contest.findBySlug(contestSlug, (err, contest) => {
            if(checkRequest(err, contest, res)) { return; }        
            res.json({ error: false, msg: contest });
        });
    });
});
router.get('/:contestSlug/challenges', (req, res, next) => {
    let groupSlug = req.params.slug;
    let contestSlug = req.params.contestSlug;
    Group.findBySlug(groupSlug, (err, group) => {
        if(checkRequest(err, group, res)) { return; }
        Contest.findBySlug(contestSlug, (err, contest) => {
            if(checkRequest(err, contest, res)) { return; }   
            Challenge.find().where('_id').in(contest.challenges).exec((err, challenges) => {
                if(checkRequest(err, contest, res)) { return; }  
                res.json({ error: false, msg: challenges });            
            });
        });
    });
});
function initContestFromRequest(req, group) {
    let contest = {};
    contest.title = req.body.title,
    contest.description = req.body.description;
    contest.registrationStartDate = date.parse(req.body.registrationStartDate, 'D/M/YYYY', true);;
    contest.registrationEndDate = date.parse(req.body.registrationEndDate, 'D/M/YYYY', true);
    contest.contestStartDate = date.parse(req.body.contestStartDate, 'D/M/YYYY h:m A', true);
    contest.duration = req.body.duration;
    // Group is provided only on new creation
    if(group) {
        contest.userId = req.user.id;    
        contest.groupId = group.id;
    }
    contest.challenges = req.body.challenges;
    return contest;
}
router.post('/', (req, res, next) => {
    let groupSlug = req.params.slug;
    let contestSlug = req.params.contestSlug;    
    Group.findBySlug(groupSlug, (err, group) => {
        if(checkRequest(err, group, res)) { return; }
        let contest = new Contest(initContestFromRequest(req, group));
        contest.save((err) => {
            if(!err) {
                res.json({ error: false });
            }
            else {
                res.json({ error: true, msg: [err] });
            }
        });
    });
});
router.put('/:contestSlug', (req, res, next) => {
    let contestSlug = req.params.contestSlug;        
    Contest.findBySlug(contestSlug, (err, contest) => {
        if(checkRequest(err, contest, res)) { return; }   
        if(contest.userId == req.user.id) {
            let updatedContest = initContestFromRequest(req);
            Contest.update({ slug: contestSlug }, updatedContest, (err) => {
                if(!err) {
                    res.json({ error: false });
                }
                else {
                    res.json({ error: true, msg: [err] });
                }
            });   
        }  
        else {
            res.sendStatus(403);
        }
    });
});
router.delete('/:contestSlug', (req, res) => {
    let contestSlug = req.params.contestSlug;        
    Contest.findBySlug(contestSlug, (err, contest) => {
        if(checkRequest(err, contest, res)) { return; }   
        if(contest.userId == req.user.id) {
            Contest.remove({ slug: contestSlug }, (err) => {
                if(!err) {
                    res.json({ error: false });
                }
                else {
                    res.json({ error: true, msg: [err] });
                }
            });   
        }  
        else {
            res.sendStatus(403);
        }
    });
});


module.exports = router;