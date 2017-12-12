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
                if(callback) {
                    callback(err);                
                }
            });
        }
        else {
            submission.code = code;
            submission.points = points;                       
            let newSubmission = new Submission(submission);
            newSubmission.save((err) => {
                if(callback) {
                    callback(err);                
                }
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
    const hasCustomInput = req.body.hasCustomInput;
    const customInput = req.body.customInput;

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
                // Check if it is a custom Input
                if (hasCustomInput) {
                    Compiler.compile(compiler, code, customInput, (result) => {
                        result.input = customInput;
                        socketio.emit(uid, { 'type': 'customInput', result:  result }); 
                        saveSubmission(submission, code, points);
                        res.json(result);                    
                    });
                    return;
                }
                // Test Sample test cases
                let sampleInputs = [];
                challenge.sampleTestCases.forEach((testCase) => {
                    sampleInputs.push(testCase.input);
                });
                Compiler.compileMany(compiler, code, sampleInputs, (results) => {
                    let sampleTestCasesResult = { error: false, msg: [] };
                    for(let i = 0; i < results.length; i++) {
                        sampleTestCasesResult.compiled = results[i].compiled;
                        
                        if(results[i].compiled) {
                            results[i].input = challenge.sampleTestCases[i].input;
                            results[i].expectedOutput = challenge.sampleTestCases[i].output; 
                            sampleTestCasesResult.msg[i] = results[i];
                            if(results[i].msg == challenge.sampleTestCases[i].output) {
                                sampleTestCasesResult.msg[i].passed = true;
                            }
                            else {
                                sampleTestCasesResult.msg[i].passed = false;
                            }
                        }
                        else{                       
                            // Save the submission
                            sampleTestCasesResult.error = true;
                            sampleTestCasesResult.msg = results[i].msg;
                            saveSubmission(submission, code, points);
                            break;
                        }
                    }
                    if(!sampleTestCasesResult.error) {
                        let allSampleTestCasePassed = true;
                        for(let i = 0; i < sampleTestCasesResult.msg.length; i++) {
                            if(!sampleTestCasesResult.msg[i].passed) {
                                allSampleTestCasePassed = false;
                            }
                        }
                        
                        if(allSampleTestCasePassed) {
                            sampleTestCasesResult.passed = true;
                            socketio.emit(uid, { type: 'sampleTestCase', result: sampleTestCasesResult });           
                            // Compile all the test cases and test
                            let testCases = [];
                            let result = { error: false, compiled: true };
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
                                res.json(result); 
                                // Save the submission
                                saveSubmission(submission, code, points);
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
                            sampleTestCasesResult.passed = false;
                            socketio.emit(uid, { type: 'sampleTestCase', result: sampleTestCasesResult });
                            // Save the submission
                            saveSubmission(submission, code, points);        
                            res.json(sampleTestCasesResult);
                        }
                    }
                    else {
                        res.json(sampleTestCasesResult);                    
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