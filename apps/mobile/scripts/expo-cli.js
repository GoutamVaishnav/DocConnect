const path = require('node:path');
const Module = require('node:module');

// npm keeps Expo at the workspace root while Expo Router is installed in this
// mobile workspace. Make that workspace visible to Expo's root CLI as well.
const mobileNodeModules = path.resolve(__dirname, '..', 'node_modules');
process.env.NODE_PATH = [mobileNodeModules, process.env.NODE_PATH].filter(Boolean).join(path.delimiter);
Module._initPaths();

require('expo/bin/cli');
