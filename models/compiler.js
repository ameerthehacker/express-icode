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
    Compiler.find().sort({ language: 1 }).exec(callback);
}
Compiler.findByCode = (code, callback) => {
    Compiler.findOne({ 'code': code }, callback);
}
Compiler.getCompileCmd = (compiler, filename, errorFilename, inputFilename = false, outputFilename = false) => {
    let compileCmd = compiler.compile;
    compileCmd = compileCmd.replace(/:source/g, Compiler.getFullFilename(compiler, filename));
    compileCmd = compileCmd.replace(/:destination/g, path.join("home", path.basename(filename)));
    compileCmd = compileCmd.replace(/:destdir/g, "home");
    compileCmd = compileCmd.replace(/:error/g, errorFilename);
    if(inputFilename) {
        compileCmd = compileCmd.replace(/:input/g, inputFilename);
    }
    if(outputFilename) {
        compileCmd = compileCmd.replace(/:output/g, outputFilename);
    }
    return compileCmd;
}
Compiler.getRunCmd = (compiler, filename, inputFilename, outputFileName) => {
    let runCmd = compiler.run;
    runCmd = runCmd.replace(/:source/g, path.join("home", path.basename(filename)));
    runCmd = runCmd.replace(/:destdir/g, "home");    
    runCmd = runCmd.replace(/:output/g, outputFileName);
    runCmd = runCmd.replace(/:input/g, inputFilename)
    return runCmd;
}
Compiler.getFullFilename = (compiler, filename) => {
    return filename + "." + compiler.extension;
}
Compiler.startContainer = (compiler, callback) => {
    // Set the maximum allowed memory for the container in bytes which is set to 512MB    
    let memoryLimit = 512 * 1024 * 1024;    
    // Unique directory to compile program
    const compileDirectory = path.join(appRootPath.path, 'tmp', uniqid('compile-'));
    // Create directory if not exists
    if(!fs.existsSync(compileDirectory)) {
        fs.mkdirSync(compileDirectory);
    }
    docker.run(compiler.image, [], null, { Tty: true, Volumes: { '/volume': {} }, HostConfig: { 'Binds': [ compileDirectory + ':/volume:rw' ], Memory: memoryLimit } }, (err, data) => {
    }).on('start', (container) => {
        callback(compileDirectory, container);
    });
}
Compiler.compileCode = (container, compiler, compileDirectory, code, callback) => {
    const codeFilename = path.join(compileDirectory, Compiler.getFullFilename(compiler, 'solution'));    
    const errorFilename = uniqid("error-") +  ".compile";    
    let compileCmd = Compiler.getCompileCmd(compiler, Compiler.getVolumeFileName('solution'), Compiler.getVolumeFileName(errorFilename));

    // Write the code file to the compiler directory
    fs.writeFileSync(codeFilename, code);
    Compiler.execContainer(container, compileCmd, () => {
        const errors = fs.readFileSync(path.join(compileDirectory, errorFilename)).toString();
        if(errors.length == 0) {
            callback({ error: false, compiled: true, timeout: false });
        }
        else {
            callback({ error: true, compiled: false, msg: errors });
        }
    });
}
Compiler.runCode = (container, compiler, compileDirectory, code, input, callback, index = 0) => {
    let runCmd = "";
    let inputFilename = uniqid("input-") + ".run";
    let outputFilename = uniqid("output-") + ".run";
    let resultSent = false;
    let errorFilename = uniqid("error-") +  ".compile";    

    // Write the input to file
    fs.writeFileSync(path.join(compileDirectory, inputFilename), input);    
    if(compiler.run.length == 0) {
        // Write the code file to the compiler directory
        const codeFilename = path.join(compileDirectory, Compiler.getFullFilename(compiler, 'solution'));        
        fs.writeFileSync(codeFilename, code);
        // Its a scripting language and only needs interpretation
        runCmd = Compiler.getCompileCmd(compiler, Compiler.getVolumeFileName('solution'), Compiler.getVolumeFileName(errorFilename), Compiler.getVolumeFileName(inputFilename), Compiler.getVolumeFileName(outputFilename));
    }
    else {
        runCmd = Compiler.getRunCmd(compiler, Compiler.getVolumeFileName('solution'), Compiler.getVolumeFileName(inputFilename), Compiler.getVolumeFileName(outputFilename));
    }   
    let timeBeforeRun = Date.now();
    setTimeout(() => {
        if(!resultSent) {
            callback({ error: false, compiled: true, timeout: true, msg: '', timeTaken: '-' });
            resultSent = true;    
        }
    }, compiler.timeout * 1000);
    Compiler.execContainer(container, runCmd, () => {
        if(!resultSent) {
            const output = fs.readFileSync(path.join(compileDirectory, outputFilename)).toString();
            let timeToRun = (Date.now() - timeBeforeRun) / 1000;
            if(compiler.run.length == 0) {
                // Check for compilation error if it is a scripting language
                const errors = fs.readFileSync(path.join(compileDirectory, errorFilename)).toString();
                if(errors.length == 0) {
                    callback({ error: false, compiled: true, timeout: false, msg: output, timeTaken: `${timeToRun}s` });
                }
                else {
                    callback({ error: true, compiled: false, timeout: false, msg: errors });
                }
            }
            else {
                callback({ error: false, compiled: true, timeout: false, msg: output, timeTaken: `${timeToRun}s` });            
            }
            resultSent = true;
        }
    });    
}
Compiler.execContainer = (container, cmd, callback) => {
    container = docker.getContainer(container.id);
    container.exec({ Cmd: ['sh', '-c', cmd], AttachStdin: false, AttachStdout: true, detach: false }, (err, exec) => {
        exec.start({ hijack: true }, (err, stream) => {
            const timer = setInterval(() => {
                exec.inspect((err, data) => {
                    if(!err) {
                        if(!data.Running) {
                            clearInterval(timer);
                            callback(err);
                        }
                    }
                    else {
                        clearInterval(timer);
                        callback(err);
                    }
                });
                docker.modem.demuxStream(stream, process.stdout, process.stderr);                
            }, 10);
        });
    });
}
Compiler.stopContainer = (container, callback) => {
    container.stop()
    .then(() => {
        container.remove(callback);
    });
}
Compiler.compile = (compiler, code, inputs, compiledAllCallback, compiledOneCallback) => {
    // Start the container first
    Compiler.startContainer(compiler, (compileDirectory, container) => {
        // Check if it is a scripting language
        if(compiler.run.length != 0) {
            // Compile the code first
            Compiler.compileCode(container, compiler, compileDirectory, code, (result) => {
                if(result.error && !result.compiled) {
                    compiledAllCallback([result]);
                    rmdir(compileDirectory, (err) => {
                        if(err) {
                            // TODO: Handle errors if needed
                        }
                    });
                }
                else {
                    // Run the code for all the inputs
                    Compiler.runForInputs(container, compiler, compileDirectory, code, inputs,compiledAllCallback, compiledOneCallback);
                }
            });
        }
        else {
            // Just run the code for all the inputs
            Compiler.runForInputs(container, compiler, compileDirectory, code, inputs, compiledAllCallback, compiledOneCallback);            
        }
    });
}
Compiler.runForInputs = (container, compiler, compileDirectory, code, inputs, compiledAllCallback, compiledOneCallback) => {
    let outputs = [];
    let compiledCount = 0;
    let compilationError = false;
    inputs.forEach((input, index) => {
        if(compilationError) {
            return;
        }
        Compiler.runCode(container, compiler, compileDirectory, code, input, (result) => {
            // Check for compilation errors
            if(result.error && !result.compiled) {
                compiledAllCallback([result]);
                compilationError = true;
                return;
            }
            outputs[index] = result;
            compiledCount++;
            if(compiledOneCallback) {
                compiledOneCallback({ index: index, output: result });
            }
            if(inputs.length == compiledCount) {
                compiledAllCallback(outputs);
                container.stop()
                .then(() => {
                    container.remove();
                });
                rmdir(compileDirectory, (err) => {
                    if(err) {
                        // TODO: Handle errors if needed
                    }
                });
            }
        }, index);
    });
}

module.exports = Compiler;
