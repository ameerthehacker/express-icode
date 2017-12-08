const express = require('express');
const router = express.Router({ mergeParams: true });
const Group = require('../models/group');
const Challenge = require('../models/challenge');
const LabWork = require('../models/lab-work');
const checkRequest = require('./checkRequest');
const date = require('date-and-time');
const User = require('../models/user');
const config = require('../config/env');


router.get('/', (req, res, next) => {
    let groupSlug = req.params.slug;
    let page = req.query.page ? req.query.page: 1;

    Group.findBySlug(groupSlug, (err, group) => {
        if(checkRequest(err, group, res)) { return; }
        let labWorkDetails = { docs: [] };         
        LabWork.paginate({ groupId: group.id }, { page: page, limit: config.pagination.perPage },  (err, labWorks) => {
            if(!err) {
                if(labWorks.length == 0) {
                    res.json({ err: false, msg: [] });
                }
                let processedLabWorks = 0;
                labWorkDetails.page = labWorks.page;                
                labWorkDetails.limit = labWorks.limit;
                labWorkDetails.total = labWorks.total;  

                labWorks.docs.forEach(function(labWork) {
                    // Covert mongoose model into pojo                
                    let labWorkDetail = labWork.toJSON();
                    // Add fields for labWork is open
                    labWorkDetail.isRunning = LabWork.isRunning(labWork);
                    labWorkDetails.docs.push(labWorkDetail);
                    processedLabWorks++;
                    if(processedLabWorks == labWorks.docs.length) {
                        res.json({ error: false, msg: labWorkDetails });
                    }
                });
            }
            else {
                res.json({ error: true, msg: [err] });                   
            }
        });
    });
});
router.get('/:labWorkSlug', (req, res, next) => {
    let groupSlug = req.params.slug;
    let labWorkSlug = req.params.labWorkSlug;

    Group.findBySlug(groupSlug, (err, group) => {
        if(checkRequest(err, group, res)) { return; }
        LabWork.findBySlug(labWorkSlug, (err, labWork) => {
            if(checkRequest(err, labWork, res)) { return; } 
            // Covert mongoose model into pojo                
            let labWorkDetail = labWork.toJSON();
            // Add fields for labWork is open
            labWorkDetail.isRunning = LabWork.isRunning(labWork);
            labWork.isOpen = 
            res.json({ error: false, msg: labWorkDetail });
        });
    });
});
router.get('/:labWorkSlug/challenges', (req, res, next) => {
    let groupSlug = req.params.slug;
    let labWorkSlug = req.params.labWorkSlug;

    Group.findBySlug(groupSlug, (err, group) => {
        if(checkRequest(err, group, res)) { return; }
        LabWork.findBySlug(labWorkSlug, (err, labWork) => {
            if(checkRequest(err, labWork, res)) { return; }  
            Challenge.find().where('_id').in(labWork.challenges).exec((err, challenges) => {
                if(checkRequest(err, labWork, res)) { return; }  
                res.json({ error: false, msg: challenges });            
            });
        });
    });
});
function initlabWorkFromRequest(req, group) {
    let labWork = {};

    labWork.title = req.body.title,
    labWork.description = req.body.description;
    labWork.submissionStartDate = date.parse(req.body.submissionStartDate, 'D/M/YYYY', true);;
    labWork.submissionEndDate = date.parse(req.body.submissionEndDate, 'D/M/YYYY', true);
    // Group is provided only on new creation
    if(group) {
        labWork.userId = req.user.id;    
        labWork.groupId = group.id;
    }
    labWork.challenges = req.body.challenges;
    return labWork;
}
router.post('/', (req, res, next) => {
    User.hasPermission(req.user, 'manage-lab-works', (err, status) => {
        if(status) {
            let groupSlug = req.params.slug;
            let labWorkSlug = req.params.labWorkSlug;  

            Group.findBySlug(groupSlug, (err, group) => {
                if(checkRequest(err, group, res)) { return; }
                let labWork = new LabWork(initlabWorkFromRequest(req, group));

                labWork.save((err) => {
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
router.put('/:labWorkSlug', (req, res, next) => {
    let labWorkSlug = req.params.labWorkSlug;      

    LabWork.findBySlug(labWorkSlug, (err, labWork) => {
        if(checkRequest(err, labWork, res)) { return; }   
        if(labWork.userId == req.user.id) {
            let updatedlabWork = initlabWorkFromRequest(req);
            LabWork.update({ slug: labWorkSlug }, updatedlabWork, (err) => {
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
router.delete('/:labWorkSlug', (req, res) => {
    let labWorkSlug = req.params.labWorkSlug;  
          
    LabWork.findBySlug(labWorkSlug, (err, labWork) => {
        if(checkRequest(err, labWork, res)) { return; }   
        if(labWork.userId == req.user.id) {
            LabWork.remove({ slug: labWorkSlug }, (err) => {
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