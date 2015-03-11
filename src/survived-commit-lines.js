require('lazy-ass');
var check = require('check-more-types');
var d3h = require('d3-helpers');
var folders = require('chdir-promise');
var quote = require('quote');
var R = require('ramda');
var Q = require('q');
var minimatch = require('minimatch');

var getCommits = require('./get-commits');
var ggit = require('ggit');
require('console.table');

var sourceFiles = require('./source-files');
var blameToSurvivedCommit = require('./blame-survivors');
var survivalRate = require('./survival-rate');

function printCommitsList(list) {
  la(check.array(list), list);
  console.table(list);
  console.log(list.length + ' commit(s)');
}

function commits(repoFolder) {
  la(check.unemptyString(repoFolder));
  return ggit.commits.all(repoFolder)
    .tap(printCommitsList)
}

// commits(repoFolder).done();

// compute survived lines for each file and each commit
function survivedCommitLines(folder, filePattern) {
  return sourceFiles(folder, filePattern)
    .then(ggit.commitPerLine)
    // .tap(console.log)
    .then(blameToSurvivedCommit);
}

/*
getChangesPerCommit('758dbd')
  .then(console.log)
  .done();
*/
/*
{ commit: '758dbde11da762348e20bb54011ff723266a17f8',
  author: 'Gleb Bahmutov <gleb.bahmutov@gmail.com>',
  date: 'Sat Mar 7 06:20:16 2015 -0700',
  message: 'grabbig commit info per line',
  changes:
   { 'README.md': { filename: 'README.md', added: 1, deleted: 1 },
     'index.js': { filename: 'index.js', added: 11, deleted: 5 },
     'package.json': { filename: 'package.json', added: 1, deleted: 1 } } }
*/

/*
survivedCommitLines(repoFolder, '*.js')
  .tap(console.log)
  .then()
  .done();
*/
module.exports = survivedCommitLines;
