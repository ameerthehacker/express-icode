const express = require('express');
const router = express.Router();
const Submission = require('../models/submission');
const Types = require('mongoose').Types;

router.get('/:for', (req, res, next) => {
    const submittedForId = req.params.for;
    const type = req.query.type;
    let match;    

    // The leaderboard is to be found for a challenge
    if(type && type == 'practice') {
        match = {  
            challengeId: Types.ObjectId(submittedForId),
            typeOfSubmission: type
        };        
    }
    else {
        // The leaderboard is to be found for contest or assignment or lab work
        match = { submittedForId: Types.ObjectId(submittedForId) };        
    }
    Submission.aggregate([
        {
            $match: match
        },
        {
            $group: {
                _id: "$userId",
                points: {
                  $sum: "$points"
                }
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "userDetails"
            }
        },
        {
            $project: {
                points: 1,
                userDetails: { firstName: 1, lastName: 1 } 
            }
        },
        {
            $sort: {
                points: -1,
                "userDetails.firstName": 1
            }
        }
    ])
    .then((leaders) => {
        res.json({ error: false, msg: leaders });            
    });

});
 
module.exports = router;