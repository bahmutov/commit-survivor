require('cute-stack')(require('bad-line'));

require('lazy-ass');
var check = require('check-more-types');
var d3h = require('d3-helpers');
var folders = require('chdir-promise');

var ggit = require('ggit');
require('console.table');

var repoFolder = __dirname;

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

function findTrackedFiles(folder) {
  console.log('finding source files in folder', folder);
  return ggit.trackedFiles(folder, '*.js');
}

function sourceFiles(repoFolder, fileFilter) {
  la(check.unemptyString(repoFolder));

  var findFiles = findTrackedFiles.bind(null, repoFolder);

  return folders.to(repoFolder)
    .then(findFiles)
    .tap(function (files) {
      console.log('files in folder', files);
    })
    .tap(folders.back);
}

sourceFiles(repoFolder).done();

// look at the git blame for files at head
// then look at each commit
// and see how many files were modified in the commit K
// compute survival rate for commit K
