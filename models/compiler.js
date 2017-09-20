const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const Docker = require('dockerode');
const docker = new Docker();

const CompilerSchema = mongoose.Schema({
    language: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    compile: {
        type: String,
        required: true
    },
    run: {
        type: String,
        required: true
    },
    extension: {
        type: String,
        required: true
    }
});

const Compiler = mongoose.model('Compiler', CompilerSchema);


// Keep a global mount point in the container
Compiler.getVolumeFileName = (filename) => {
    return "/volume/" + filename;
}
Compiler.getAllCompilers = (callback) => {
    Compiler.find(callback);
}
Compiler.findByCode = (code, callback) => {
    Compiler.findOne({ 'code': code }, callback);
}
Compiler.getCompileCmd = (compiler, filename, errorFilename, inputFilename = false, outputFilename = false) => {
    let compileCmd = compiler.compile;
    compileCmd = compileCmd.replace(":source", Compiler.getFullFilename(compiler, filename));
    compileCmd = compileCmd.replace(":destination", path.join("home", path.basename(filename)));   
    compileCmd = compileCmd.replace(":error", errorFilename);     
    if(inputFilename) {
        compileCmd = compileCmd.replace(":input", inputFilename);            
    }   
    if(outputFilename) {
        compileCmd = compileCmd.replace(":output", outputFilename);            
    }
    return compileCmd;
}
Compiler.getRunCmd = (compiler, filename, inputFilename, outputFileName) => {
    let runCmd = compiler.run;
    runCmd = runCmd.replace(":source", path.join("home", path.basename(filename)));
    runCmd = runCmd.replace(":output", outputFileName); 
    runCmd = runCmd.replace(":input", inputFilename)       
    return runCmd;
}
Compiler.getFullFilename = (compiler, filename) => {
    return filename + "." + compiler.extension;
}

Compiler.compile = (compiler, code, compileDirectory, input, callback) => {
    // Command to be executed inside the container
    let containerCmd = "";            
    let codeFilename = path.join(compileDirectory, Compiler.getFullFilename(compiler, 'solution'));
    let errorFilename = "error.txt";
    let inputFilename = "input.txt";
    let outputFilename = "output.txt";
    fs.writeFileSync(path.join(compileDirectory, inputFilename), input);
    fs.writeFileSync(codeFilename, code);            
    if(compiler.run.length == 0) {
        // Its a scripting language and only needs interpretation
        const compileCmd = Compiler.getCompileCmd(compiler, Compiler.getVolumeFileName('solution'), Compiler.getVolumeFileName(errorFilename), Compiler.getVolumeFileName(inputFilename), Compiler.getVolumeFileName(outputFilename));
        // Run only the interpretation code
        containerCmd = compileCmd;         
    }
    else {
        const compileCmd = Compiler.getCompileCmd(compiler, Compiler.getVolumeFileName('solution'),Compiler.getVolumeFileName(errorFilename), Compiler.getVolumeFileName(inputFilename));
        const runCmd = Compiler.getRunCmd(compiler, Compiler.getVolumeFileName('solution'), Compiler.getVolumeFileName(inputFilename), Compiler.getVolumeFileName(outputFilename));
        // Run the compilation and interpretation code
        containerCmd = compileCmd + ";" + runCmd;
    }
    // Start the container to compile and run the code safely
    docker.run(compiler.image, ['sh', '-c', containerCmd], process.stdout, { Volumes: { '/volume': {} }, 'Binds': [ compileDirectory + ':/volume:rw' ] }).then(function(container) {
        // Check if the testcase was satisfied
        let errors = fs.readFileSync(path.join(compileDirectory, errorFilename)).toString();            
        if(errors.length > 0) {
            callback({ error: true, compiled: false, msg: [errors] });
        }
        else{
            let output = fs.readFileSync(path.join(compileDirectory, outputFilename)).toString();                        
            callback({ error: false, compiled: true, msg: [output] });
        }
    }); 
}

module.exports = Compiler;