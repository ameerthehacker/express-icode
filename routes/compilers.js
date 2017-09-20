const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const appRootPath = require('app-root-path');
const Compiler = require('../models/compiler');


router.get('/', (req, res, next) => {
    Compiler.getAllCompilers((err, compilers) => {
        if(!err) {
            res.json({ error: false, msg: compilers });
        }
        else {
            res.json({ error: true, msg: [err] });
        }
    });
});
router.post('/:langCode', (req, res, next) => {
    // Unique user directory
    const userDir = path.join(appRootPath.path, 'tmp', req.user.id);
    const langCode = req.params.langCode;
    const code = req.body.code;
    const testCase = req.body.testCase;    
    // Create directory if not exists
    if(!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir);
    }
    Compiler.findByCode(langCode, (err, compiler) => {
        if(!err && compiler) {
            Compiler.compile(compiler, code, userDir, testCase.input, (result) => {
                res.json(result);
            });
        }
        else {
            res.json({ error: true, msg: ['No such language is supported'] });
        }       
    });
});

module.exports = router;