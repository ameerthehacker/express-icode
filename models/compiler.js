const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const uniqid = require('uniqid');
const Docker = require('dockerode');
const rmdir = require('rimraf');
const appRootPath = require('app-root-path');
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
        type: String
    },
    timeout: {
        type: Number,
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
    compileCmd = compileCmd.replace(":destdir", "home");
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
    runCmd = runCmd.replace(":destdir", "home");    
    runCmd = runCmd.replace(":output", outputFileName);
    runCmd = runCmd.replace(":input", inputFilename)
    return runCmd;
}
Compiler.getFullFilename = (compiler, filename) => {
    return filename + "." + compiler.extension;
}

Compiler.compile = (compiler, code, input, callback, uid = 0) => {
    // Unique directory to compile program
    const compileDirectory = path.join(appRootPath.path, 'tmp', uniqid('compile-'));
    // Create directory if not exists
    if(!fs.existsSync(compileDirectory)) {
        fs.mkdirSync(compileDirectory);
    }
    // Command to be executed inside the container
    let containerCmd = "";
    let codeFilename = path.join(compileDirectory, Compiler.getFullFilename(compiler, 'solution'));
    // Flag to avoid sending results after timeout
    let resultSent = false;
    // To make sure all the filenames are unique
    let errorFilename = uniqid("error-") +  ".compile";
    let inputFilename = uniqid("input-") + ".run";
    let outputFilename = uniqid("output-") + ".run";
    // Set the maximum allowed memory for the container in bytes which is set to 20MB
    let memoryLimit = 50 * 1024 * 1024;
    let containerStartTime;
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
    docker.run(compiler.image, ['sh', '-c', containerCmd], process.stdout, { Volumes: { '/volume': {} }, HostConfig: { 'Binds': [ compileDirectory + ':/volume:rw' ], Memory: memoryLimit } }, (err, data) => {
    })
    .on('start', (container) => {
        containerStartTime = Date.now();
        setTimeout(() => {
            container.inspect((err, data) => {
                if(data.State.Running) {
                    if(!resultSent) {
                        resultSent = true;
                        // Close the container
                        container.stop((err, data) => {});
                        callback({ error: false, compiled: true, timeout: true, msg: '', timeTaken: '-' });                        
                    }
                }
            });
        }, compiler.timeout * 1000);
    })
    .on('data', (data) => {
        // Find the time taken in seconds
        let timeTaken = (Date.now() - containerStartTime) /1000;
        // Send data only if container not closed forcefully
        if(data.StatusCode != 137) {
            if(!resultSent) {
                resultSent = true;
                // Check if the testcase was satisfied
                let errors = fs.readFileSync(path.join(compileDirectory, errorFilename)).toString();
                if(errors.length > 0) {
                    callback({ error: true, compiled: false, timeout: false, msg: errors });
                }
                else{
                    let output = fs.readFileSync(path.join(compileDirectory, outputFilename)).toString();
                    callback({ error: false, compiled: true, timeout: false, msg: output, timeTaken: `${timeTaken}s` });
                }
            }
        }
        // Delete the created compiling folder
        rmdir(compileDirectory, (err) => {
            if(err) {
                // TODO: Handle errors if needed
            }
        });
    });
}
Compiler.compileMany = (compiler, code, inputs, compiledAllCallback, compiledOneCallback) => {
    let outputs = [];
    let compiledCount = 0;
    inputs.forEach((input, index) => {
        Compiler.compile(compiler, code, input, (output) => {
            outputs[index] = output;
            compiledCount++;
            if(compiledOneCallback) {
                compiledOneCallback({ index: index, output: output});
            }
            if(inputs.length == compiledCount) {
                compiledAllCallback(outputs);
            }
        }, index);
    });
}

module.exports = Compiler;
