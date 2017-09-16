const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const Docker = require('dockerode');
const appRootPath = require('app-root-path');
const Compiler = require('../models/compiler');
const docker = new Docker();

// Keep a global mount point in the container
function getVolumeFileName(filename) {
    return "/volume/" + filename;
}

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
            // Command to be executed inside the container
            let containerCmd = "";            
            let codeFilename = path.join(userDir, Compiler.getFullFilename(compiler, 'solution'));
            let errorFileName = "error.txt";
            let inputFileName = "input.txt";
            let outputFileName = "output.txt";
            fs.writeFileSync(path.join(userDir, inputFileName), testCase.input);
            fs.writeFileSync(codeFilename, code);            
            if(compiler.run.length == 0) {
                // Its a scripting language and only needs interpretation
                const compileCmd = Compiler.getCompileCmd(compiler, getVolumeFileName('solution'),getVolumeFileName(errorFileName), getVolumeFileName(inputFileName), getVolumeFileName(outputFileName));
                // Run only the interpretation code
                containerCmd = compileCmd;         
                console.log(containerCmd);
            }
            else {
                const compileCmd = Compiler.getCompileCmd(compiler, getVolumeFileName('solution'),getVolumeFileName(errorFileName));
                const runCmd = Compiler.getRunCmd(compiler, getVolumeFileName('solution'), getVolumeFileName(outputFileName));
                // Run the compilation and interpretation code
                containerCmd = compileCmd + ";" + runCmd;
            }
            // Start the container to compile and run the code safely
            docker.run(compiler.image, ['sh', '-c', containerCmd], process.stdout, { Volumes: { '/volume': {} }, 'Binds': [ userDir + ':/volume:rw' ] }).then(function(container) {});            

            // Check if the testcase was satisfied
            let errors = fs.readFileSync(path.join(userDir, errorFileName)).toString();            
            if(errors.length > 0) {
                res.json({ error: true, compiled: false, testCasePassed: false, msg: [errors] });
            }
            else{
                const output = fs.readFileSync(path.join(userDir, outputFileName)).toString();
                console.log(output);
                if(output == testCase.output) {
                    res.json({ error: false, compiled: true, testCasePassed: true, msg: [output] });      
                }
                else {
                    res.json({ error: false, compiled: true, testCasePassed: false, msg: [output] });           
                }
            }
        }
        else {
            res.json({ error: true, msg: ['No such language is supported'] });
        }
    });
});

module.exports = router;