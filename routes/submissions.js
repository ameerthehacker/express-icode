const express = require('express');
const router = express.Router({ mergeParams: true });
const Challenge = require('../models/challenge');
const Compiler = require('../models/compiler');
const Submission = require('../models/submission');
const emitter = require('events').EventEmitter;

emitter.defaultMaxListeners = 100;

function saveSubmission(submission, code, points, callback) {
    // Save the submission
    Submission.findOne(submission, (err, oldSubmission) => {
        if(!err && oldSubmission) {           
            let newSubmission = Object.create(submission);
            newSubmission.code = code;
            newSubmission.points = points;
            newSubmission.timeOfSubmission = Date.now();
            Submission.update(submission, newSubmission, (err) => {
                callback(err);
            });
        }
        else {
            submission.code = code;
            submission.points = points;                       
            let newSubmission = new Submission(submission);
            newSubmission.save((err) => {
                callback(err);
            });
        }
    });
}

router.get('/', (req, res, next) => {
    
});
router.post('/', (req, res, next) => {
    // To make sure that express dont discard the current request while compiling
    res.setTimeout(100 * 1000);
    let points = 0;
    const langCode = req.body.langCode;
    const code = req.body.code;
    const challengeSlug = req.params.slug; 
    Compiler.findByCode(langCode, (err, compiler) => {
        if(!err && compiler) {
            Challenge.findBySlug(challengeSlug, (err, challenge) => {
                // Submission details
                let submission = {
                    challengeId: challenge.id,
                    userId: req.user.id,
                    langCode: langCode
                };
                let pointsPerTestCase = 100.0 / challenge.testCases.length;
                // Test Sample test case
                Compiler.compile(compiler, code, challenge.sampleInput, (result) => {
                    if(result.compiled) {
                        if(result.msg == challenge.sampleOutput) {
                            result.sampleTestCasePassed = true;
                            // Compile all the test cases and test
                            let testCases = [];
                            result.testCaseResults = [];
                            for(let i = 0 ; i < challenge.testCases.length ; i++) {
                                testCases.push(challenge.testCases[i].input);
                            }   
                            Compiler.compileMany(compiler, code, testCases, (outputs) => {
                                for(let i = 0 ; i < challenge.testCases.length ; i++) {
                                    let testCaseResult = {
                                        input: challenge.testCases[i].input,
                                        output: outputs[i].msg,
                                        timeout: outputs[i].timeout,
                                        expectedOutput: challenge.testCases[i].output   
                                    }
                                    if(challenge.testCases[i].output == outputs[i].msg) {
                                        // Increase the points for each passes testcase
                                        points += pointsPerTestCase;
                                        testCaseResult.testCasePassed = true;
                                    }
                                    else {
                                        testCaseResult.testCasePassed = false;
                                    }
                                    result.testCaseResults.push(testCaseResult);
                                } 
                                // Save the submission
                                saveSubmission(submission, code, points, (err) => {
                                    if(err) {
                                        result.submissionSaved = false;
                                    }
                                    else {
                                        result.submissionSaved = true;
                                    }
                                    res.json(result);             
                                });
                            });
                        }
                        else {
                            result.sampleTestCasePassed = false;
                            // Save the submission
                            saveSubmission(submission, code, points, (err) => {
                                if(err) {
                                    result.submissionSaved = false;
                                }
                                else {
                                    result.submissionSaved = true;
                                }
                                res.json(result);             
                            });
                        }
                    }
                    else{
                        // Save the submission
                        saveSubmission(submission, code, points, (err) => {
                            if(err) {
                                result.submissionSaved = false;
                            }
                            else {
                                result.submissionSaved = true;
                            }
                            res.json(result);             
                        });
                    }
                    
                });
            });
        }
        else {
            res.json({ error: true, msg: ['No such language is supported'] });
        }  
    });
});

module.exports = router;