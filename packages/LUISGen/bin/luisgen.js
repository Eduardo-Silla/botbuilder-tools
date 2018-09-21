#!/usr/bin/env node
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const pkg = require('../package.json');
let args = '';

process.argv.forEach((val, index) => {
    if (index > 1) {
        args = args + ' ' + val;
    }
});

args = args.trim();

if (args == '-v' || args == '--version') {
    return process.stdout.write(pkg.version);
}

// set the cmdline
process.argv = [process.argv[0], process.argv[1], __dirname + '/netcoreapp2.1/LUISGen.dll', ...process.argv.slice(2)]

// use the loader via require
require("dotnet-2.1")
