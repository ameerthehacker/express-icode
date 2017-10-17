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
    // Create directory if not exists
    if(!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir);
    }
    Compiler.findByCode(langCode, (err, compiler) => {
        if(!err && compiler) {
            Compiler.compile(compiler, code, testCase.input, (result) => {
                res.json(result);
            });
        }
        else {
            res.json({ error: true, msg: ['No such language is supported'] });
        }       
    });
});

module.exports = router;