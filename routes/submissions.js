const express = require('express');
const router = express.Router({ mergeParams: true });
const Challenge = require('../models/challenge');
const Compiler = require('../models/compiler');
const path = require('path');
const appRootPath = require('app-root-path');
const fs = require('fs');

router.get('/', (req, res, next) => {
    
});
router.post('/', (req, res, next) => {
    // Unique user directory
    const userDir = path.join(appRootPath.path, 'tmp', req.user.id);
    const langCode = req.body.langCode;
    const code = req.body.code;
    const challengeSlug = req.params.slug;   
    console.log(challengeSlug);
    // Create directory if not exists
    if(!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir);
    }
    Compiler.findByCode(langCode, (err, compiler) => {
        if(!err && compiler) {
            Challenge.findBySlug(challengeSlug, (err, challenge) => {
                // Test Sample test case
                Compiler.compile(compiler, code, userDir, challenge.sampleInput, (result) => {
                    if(result.compiled) {
                        if(result.msg[0] == challenge.sampleOutput) {
                            result.sampleTestCasePassed = true;
                        }
                        else {
                            result.sampleTestCasePassed = false;  
                        }
                    }
                    res.json(result);                                                       
                });
            });
        }
        else {
            res.json({ error: true, msg: ['No such language is supported'] });
        }       
    });
});

module.exports = router;