const express = require('express');
const router = express.Router({ mergeParams: true });
const Group = require('../models/group');
const Challenge = require('../models/challenge');
const Contest = require('../models/contest');
const ContestRegistration = require('../models/contest-registration');
const checkRequest = require('./checkRequest');
const date = require('date-and-time');
const User = require('../models/user');
const config = require('../config/env');

router.get('/', (req, res, next) => {
    let groupSlug = req.params.slug;
    let page = req.query.page ? req.query.page: 1;

    Group.findBySlug(groupSlug, (err, group) => {
        if(checkRequest(err, group, res)) { return; }
        let contestDetails = { docs: [] };

        Contest.paginate({ groupId: group.id }, { page: page, limit: config.pagination.perPage }, (err, contests) => {
            if(!err) {
                if(contests.docs.length == 0) {
                    res.json({ err: false, msg: [] });
                }
                let processedContests = 0;
                contestDetails.page = contests.page;                
                contestDetails.limit = contests.limit;
                contestDetails.total = contests.total;

                contests.docs.forEach(function(contest) {
                    // Covert mongoose model into pojo                
                    let contestDetail = contest.toJSON();
                    // Add fields for contest is open and whether user can participating
                    contestDetail.isRunning = Contest.isRunning(contest);
                    contestDetail.isOpen = Contest.isOpen(contest);
                    ContestRegistration.isUserRegistered(contest._id, req.user.id, (err, registration) => {
                        if(!err && registration) {
                            contestDetail.userRegistered = true;
                        }
                        else {
                            contestDetail.userRegistered = false;
                        }
                        contestDetails.docs.push(contestDetail);
                        processedContests++;
                        if(processedContests == contests.docs.length) {
                            res.json({ error: false, msg: contestDetails });
                        }
                    });
                });
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
            ContestRegistration.isUserRegistered(contest._id, req.user.id, (err, registration) => {
                let contestDetail = contest.toJSON();

                contestDetail.isOpen = Contest.isOpen(contest);
                contestDetail.isRunning = Contest.isRunning(contest);
                if(!err && registration) {
                    contestDetail.userRegistered = true;
                }
                else {
                    contestDetail.userRegistered = false;
                }
                res.json({ error: false, msg: contestDetail });            
            });
        });
    });
});
router.get('/:contestSlug/register', (req, res, next) => {
    let contestSlug = req.params.contestSlug;

    Contest.findBySlug(contestSlug, (err, contest) => {
        if(checkRequest(err, contest)) { return; }
        // Allow registration only if its open
        if(Contest.isOpen(contest)) {
            ContestRegistration.isUserRegistered(contest._id, req.user.id, (err, registration) => {
                if(!err) {
                    if(registration) {
                        res.json({ error: true, msg: 'You have already registered for this contest' });
                    }
                    else {
                        let contestRegistration = new ContestRegistration();
                        
                        contestRegistration.userId = req.user.id;
                        contestRegistration.contestId = contest._id;
                        contestRegistration.save((err, contestRegistration) => {
                            if(!err) {
                                res.json({ error: false });
                            }
                            else {
                                res.json({ error: true, msg: [err] });
                            }
                        });
                    }
                }
                else {
                    res.sendStatus(500);
                }
            });
        }
        else {
            res.json({ error: true, msg: 'Registrations are closed' });
        }
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
    User.hasPermission(req.user, 'manage-contests', (err, status) => {
        if(status) {
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
        }
        else {
            // Forbidden access
            res.send(403);
        }
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