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

var debug = require('./debug')('source-files');

function printCommitsList(list) {
  la(check.array(list), list);
  // console.table(list);
  debug(list);
  debug(list.length, 'commit(s)');
}

function commits(repoFolder) {
  la(check.unemptyString(repoFolder));
  return ggit.commits.all(repoFolder)
    .tap(printCommitsList)
}

// commits(repoFolder).done();

function sourceFiles(repoFolder, fileFilter) {
  la(check.unemptyString(repoFolder));

  var findFiles = R.lPartial(ggit.trackedFiles, repoFolder, fileFilter);

  function printFoundFiles(files) {
    debug('found', files.length, 'tracked source file(s)');
  }

  return folders.to(repoFolder)
    .then(findFiles)
    .tap(printFoundFiles)
    .tap(folders.back);
}

module.exports = check.defend(sourceFiles,
  check.unemptyString, 'missing repo folder',
  check.unemptyString, 'missing file wildcard');
