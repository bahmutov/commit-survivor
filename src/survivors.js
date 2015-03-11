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

function commitStats(id) {
  return ggit.numstat(id);
}

function getChangesPerCommit(id) {
  la(check.unemptyString(id), 'missing id');
  return commitStats(id)
    .then(R.prop('changes'));
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

function removeOtherFiles(fileMask, commitStats) {
  la(check.string(fileMask));
  la(check.array(commitStats));

  /* removes files from commit stats list that is like
  all commits stats
  [ { 'index.js': { filename: 'index.js', added: 18, deleted: 0 } },
    { 'index.js': { filename: 'index.js', added: 21, deleted: 1 },
      'package.json': { filename: 'package.json', added: 1, deleted: 1 } },
    { 'README.md': { filename: 'README.md', added: 1, deleted: 1 }]
  */
  // fileMask is something like *.js
  return commitStats.map(function (commitStat) {
    // console.log(commitStat);
    R.keys(commitStat).forEach(function (filename) {
      if (!minimatch(filename, fileMask)) {
        delete commitStat[filename];
      }
    })
    return commitStat;
  });
}

/*
console.log(removeOtherFiles('*.js', [{
  'index.js': { foo: 'bar' } }, {
  'index.txt': { foo: 'bar' }
}]));
*/

function survivors(repoFolder, fileMask) {

  var listOfCommits = getCommits(repoFolder);
  var survivingCommits = survivedCommitLines(repoFolder, fileMask);

  Q.all([
    listOfCommits, survivingCommits
  ]).spread(function (commits, survived) {
      // console.log(commits);
      var ids = R.keys(commits);
      var numstats = ids.map(getChangesPerCommit);
      return Q.all(numstats).then(function (stats) {
        return [ids, stats, survived];
      });
    })
    .spread(function (ids, allCommitsStats, survived) {
      // console.log('all commits stats');
      // console.log(allCommitsStats);
      var sourceFilesOnly = removeOtherFiles(fileMask, allCommitsStats);
      // console.log('source files only');
      // console.log(sourceFilesOnly);
      return Q.all([ids, sourceFilesOnly, survived]);
    })
    .spread(survivalRate)
    .done();

  // look at the git blame for files at head
  // then look at each commit
  // and see how many files were modified in the commit K
  // compute survival rate for commit K
}

module.exports = survivors;
