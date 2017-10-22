const express = require('express');
const router = express.Router();
const Group = require('../models/group');
const checkRequest = require('./checkRequest');
const contests = require('./contests');
const assignments = require('./assignments');

router.get('/', (req, res, next) => {
    Group.getAllGroups((err, groups) => {
        if(checkRequest(err, groups, res)) { return; }
        res.send({ error: false, msg: groups });
    });
});
router.get('/:slug', (req, res, next) => {
    const groupSlug = req.params.slug;

    Group.findBySlug(groupSlug, (err, group) => {
        if(checkRequest(err, group, res)) { return; }
        res.send({ err: false, msg: group });
    });
});
function initGroupFromRequest(req) {
    let group = {};
    group.name = req.body.name;
    group.description = req.body.description;
    group.userId = req.user.id;
    return group;
}
router.post('/', (req, res, next) => {
    let newGroup = new Group(initGroupFromRequest(req));
    
    newGroup.save((err) => {
        if(!err) {
            res.send({ error: false });
        }
        else {
            res.send({ error: true, msg: [err] });
        }
    });
});
router.put('/:slug', (req, res, next) => {
    const groupSlug = req.params.slug;
    let updatedGroup = initGroupFromRequest(req);

    Group.findBySlug(groupSlug, (err, group) => {
        if(checkRequest(err, group, res)) { return; }
        if(group.userId == req.user.id) {
            Group.update({ slug: groupSlug }, updatedGroup, (err) => {
                if(!err) {
                    res.send({ error: false });
                }
                else {
                    res.send({ error: true, msg: [err] });
                }
            });
        }
        else {
            // Forbidden access
            res.sendStatus(403);
        }
    });
});
router.delete('/:slug', (req, res, next) => {
    const groupSlug = req.params.slug;    

    Group.findBySlug(groupSlug, (err, group) => {
        if(checkRequest(err, group, res)) { return; }
        if(group.userId == req.user.id) {
            Group.remove({ slug: groupSlug }, (err) => {
                if(!err) {
                    res.send({ error: false });
                }
                else {
                    res.send({ error: true, msg: [err] });
                }
            });
        }
        else {
            // Forbidden access
            res.sendStatus(403);
        }
    });
});
// Nested routes for contests
router.use('/:slug/contests', contests);
router.use('/:slug/assignments', assignments);

module.exports = router;