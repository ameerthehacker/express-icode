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
    const code = req.body.code;
    const langCode = req.params.langCode;
    const input = req.body.input;

    Compiler.findByCode(langCode, (err, compiler) => {
        if(!err && compiler) {
            Compiler.compile(compiler, code, input, (result) => {
                res.json(result);
            });
        }
        else {
            res.json({ error: true, msg: ['No such language is supported'] });
        }       
    });
});

module.exports = router;