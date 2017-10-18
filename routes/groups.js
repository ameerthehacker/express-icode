const express = require('express');
const router = express.Router();
const Group = require('../models/group');
const checkRequest = require('./checkRequest');
const contests = require('./contests');

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
router.post('/', (req, res, next) => {
    let group = {
        name: req.body.name,
        description: req.body.description,
        userId: req.user.id
    };
    let newGroup = new Group(group);
    
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
    let updatedGroup = {
        name: req.body.name,
        description: req.body.description,
        userId: req.user.id
    };

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

module.exports = router;