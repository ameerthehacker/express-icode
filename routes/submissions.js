const express = require('express');
const router = express.Router({ mergeParams: true });
const Challenge = require('../models/challenge');
const Compiler = require('../models/compiler');
const Submission = require('../models/submission');
const emitter = require('events').EventEmitter;
const checkRequest = require('./checkRequest');

emitter.defaultMaxListeners = 100;

function saveSubmission(submission, code, points, callback) {
    // Save the submission
    Submission.findOne(submission, (err, oldSubmission) => {
        if(!err && oldSubmission) {           
            let updatedSubmission = Object.create(oldSubmission);
            updatedSubmission.code = code;
            updatedSubmission.points = points;
            updatedSubmission.timeOfSubmission = Date.now();
            Submission.update(submission, updatedSubmission, (err) => {
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

router.get('/:langCode', (req, res, next) => {
   const langCode = req.params.langCode; 
   const challengeSlug = req.params.slug;
   const typeOfSubmission = req.query.type != 'undefined' ? req.query.type: 'practice';
   const submittedForId = req.query.for != 'undefined' ? req.query.for: false;
   Challenge.findBySlug(challengeSlug, (err, challenge) => {
       if(checkRequest(err, challenge, res)) { return; }    
       let query = { langCode: langCode, challengeId: challenge.id, userId: req.user.id, typeOfSubmission: typeOfSubmission };
       if(submittedForId) {
           query.submittedForId = submittedForId;
       }
       Submission.findOne(query, (err, submission) => {
           if(!err && submission) {
               let result = { submissionFound: true }
               result.submission = submission;
               res.json(result);
           }
           else {
               let result = { submissionFound: false }
               res.json(result);
           }
       });
   });
});
router.post('/', (req, res, next) => {
    // To make sure that express dont discard the current request while compiling
    res.setTimeout(100 * 1000);
    // Get the socket
    const socketio = req.app.get('socketio');    
    let points = 0;
    const langCode = req.body.langCode;
    const code = req.body.code;
    const challengeSlug = req.params.slug; 
    const typeOfSubmission = req.body.typeOfSubmission;
    const submittedForId = req.body.submittedForId;
    const uid = req.body.uid;

    Compiler.findByCode(langCode, (err, compiler) => {
        if(!err && compiler) {
            Challenge.findBySlug(challengeSlug, (err, challenge) => {
                if(checkRequest(err, challenge, res)) { return; }
                let submission = {
                    challengeId: challenge.id,
                    userId: req.user.id,
                    langCode: langCode,
                    typeOfSubmission: typeOfSubmission,
                    submittedForId: submittedForId
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
                            // Send the sample testcase success result to socket
                            socketio.emit(uid, { 'type': 'sampleTestCase', result:  result });                    
                            Compiler.compileMany(compiler, code, testCases, (outputs) => {
                                for(let i = 0 ; i < challenge.testCases.length ; i++) {
                                    let testCaseResult = {
                                        input: challenge.testCases[i].input,
                                        output: outputs[i].msg,
                                        timeout: outputs[i].timeout,
                                        expectedOutput: challenge.testCases[i].output,
                                        timeTaken: outputs[i].timeTaken  
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
                            }, (result) => {
                                if(challenge.testCases[result.index].output == result.output.msg) {
                                    result.output.testCasePassed = true;
                                }
                                else {
                                    result.output.testCasePassed = false;
                                }
                                socketio.emit(uid, { type: 'testCase', index: result.index, result: result.output });
                            });
                        }
                        else {
                            result.sampleTestCasePassed = false;
                            // Send the sample testcase failure result to socket
                            socketio.emit(uid, { 'type': 'sampleTestCase', result:  result });   
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