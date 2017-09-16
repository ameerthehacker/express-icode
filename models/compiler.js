const mongoose = require('mongoose');
const path = require('path');

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

Compiler.findByCode = (code, callback) => {
    Compiler.findOne({ 'code': code }, callback);
}
Compiler.getCompileCmd = (compiler, filename, errorFilename, inputFile = false, outputFilename = false) => {
    let compileCmd = compiler.compile;
    compileCmd = compileCmd.replace(":source", Compiler.getFullFilename(compiler, filename));
    compileCmd = compileCmd.replace(":destination", path.join("home", path.basename(filename)));   
    compileCmd = compileCmd.replace(":error", errorFilename);     
    if(inputFile) {
        compileCmd = compileCmd.replace(":input", inputFile);            
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

module.exports = Compiler;