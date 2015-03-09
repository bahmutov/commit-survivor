#!/usr/bin/env node

var updateNotifier = require('update-notifier');
var pkg = require('../package.json');
updateNotifier({pkg: pkg}).notify();

var argv = require('yargs').argv;

var survivor = require('../index');

// main parameters
var repoFolder = process.cwd();
var fileMask = '*.js';

survivor(repoFolder, fileMask);

