const express = require('express');
const router = express.Router({ mergeParams: true });
const Challenge = require('../models/challenge');
const Compiler = require('../models/compiler');
const emitter = require('events').EventEmitter;

emitter.defaultMaxListeners = 100;

router.get('/', (req, res, next) => {
    
});
router.post('/', (req, res, next) => {
    // To make sure that express dont discard the current request while compiling
    res.setTimeout(100 * 1000);
    const langCode = req.body.langCode;
    const code = req.body.code;
    const challengeSlug = req.params.slug; 
    Compiler.findByCode(langCode, (err, compiler) => {
        if(!err && compiler) {
            Challenge.findBySlug(challengeSlug, (err, challenge) => {
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
                                        expectedOutput: challenge.testCases[i].output   
                                    }
                                    if(challenge.testCases[i].output == outputs[i].msg) {
                                        testCaseResult.testCasePassed = true;
                                    }
                                    else {
                                        testCaseResult.testCasePassed = false;
                                    }
                                    result.testCaseResults.push(testCaseResult);
                                }     
                                res.json(result);                            
                            });
                        }
                        else {
                            result.sampleTestCasePassed = false; 
                            res.json(result);
                        }
                    }
                    else {
                        res.json(result);                        
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