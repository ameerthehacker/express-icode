const express = require('express');
const router = express.Router({ mergeParams: true });
const Group = require('../models/group');
const Challenge = require('../models/challenge');
const Assignment = require('../models/assignment');
const checkRequest = require('./checkRequest');
const date = require('date-and-time');
const User = require('../models/user');

router.get('/', (req, res, next) => {
    let groupSlug = req.params.slug;

    Group.findBySlug(groupSlug, (err, group) => {
        if(checkRequest(err, group, res)) { return; }
        Assignment.find({ groupId: group.id }, (err, assignments) => {
            if(!err) {
                if(assignments.length == 0) {
                    res.json({ err: false, msg: [] });
                }
                let processedAssignments = 0;
                let assignmentDetails = [];    

                assignments.forEach(function(assignment) {
                    // Covert mongoose model into pojo                
                    let assignmentDetail = assignment.toJSON();
                    // Add fields for assignment is open
                    assignmentDetail.isRunning = Assignment.isRunning(assignment);
                    assignmentDetails.push(assignmentDetail);
                    processedAssignments++;
                    if(processedAssignments == assignments.length) {
                        res.json({ error: false, msg: assignmentDetails });
                    }
                });
            }
            else {
                res.json({ error: true, msg: [err] });                   
            }
        });
    });
});
router.get('/:assignmentSlug', (req, res, next) => {
    let groupSlug = req.params.slug;
    let assignmentSlug = req.params.assignmentSlug;

    Group.findBySlug(groupSlug, (err, group) => {
        if(checkRequest(err, group, res)) { return; }
        Assignment.findBySlug(assignmentSlug, (err, assignment) => {
            if(checkRequest(err, assignment, res)) { return; } 
            // Covert mongoose model into pojo                
            let assignmentDetail = assignment.toJSON();
            // Add fields for assignment is open
            assignmentDetail.isRunning = Assignment.isRunning(assignment);
            assignment.isOpen = 
            res.json({ error: false, msg: assignmentDetail });
        });
    });
});
router.get('/:assignmentSlug/challenges', (req, res, next) => {
    let groupSlug = req.params.slug;
    let assignmentSlug = req.params.assignmentSlug;

    Group.findBySlug(groupSlug, (err, group) => {
        if(checkRequest(err, group, res)) { return; }
        Assignment.findBySlug(assignmentSlug, (err, assignment) => {
            if(checkRequest(err, assignment, res)) { return; }  
            Challenge.find().where('_id').in(assignment.challenges).exec((err, challenges) => {
                if(checkRequest(err, assignment, res)) { return; }  
                res.json({ error: false, msg: challenges });            
            });
        });
    });
});
function initassignmentFromRequest(req, group) {
    let assignment = {};

    assignment.title = req.body.title,
    assignment.description = req.body.description;
    assignment.submissionStartDate = date.parse(req.body.submissionStartDate, 'D/M/YYYY', true);;
    assignment.submissionEndDate = date.parse(req.body.submissionEndDate, 'D/M/YYYY', true);
    // Group is provided only on new creation
    if(group) {
        assignment.userId = req.user.id;    
        assignment.groupId = group.id;
    }
    assignment.challenges = req.body.challenges;
    return assignment;
}
router.post('/', (req, res, next) => {
    User.hasPermission(req.user, 'manage-assignments', (err, status) => {
        if(status) {
            let groupSlug = req.params.slug;
            let assignmentSlug = req.params.assignmentSlug;  
        
            Group.findBySlug(groupSlug, (err, group) => {
                if(checkRequest(err, group, res)) { return; }
                let assignment = new Assignment(initassignmentFromRequest(req, group));
                
                assignment.save((err) => {
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
router.put('/:assignmentSlug', (req, res, next) => {
    let assignmentSlug = req.params.assignmentSlug;     

    Assignment.findBySlug(assignmentSlug, (err, assignment) => {
        if(checkRequest(err, assignment, res)) { return; }   
        if(assignment.userId == req.user.id) {
            let updatedAssignment = initassignmentFromRequest(req);

            Assignment.update({ slug: assignmentSlug }, updatedAssignment, (err) => {
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
router.delete('/:assignmentSlug', (req, res) => {
    let assignmentSlug = req.params.assignmentSlug; 

    Assignment.findBySlug(assignmentSlug, (err, assignment) => {
        if(checkRequest(err, assignment, res)) { return; }   
        if(assignment.userId == req.user.id) {
            Assignment.remove({ slug: assignmentSlug }, (err) => {
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