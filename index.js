require('cute-stack')(require('bad-line'));

require('lazy-ass');
var check = require('check-more-types');

var ggit = require('ggit');
require('console.table');

var repoFolder = __dirname;

function printCommitsList(list) {
  la(check.array(list), list);
  console.table(list);
  console.log(list.length + ' commit(s)');
}

ggit.commits.all(repoFolder)
  .then(printCommitsList)
  .done();

// look at the git blame for files at head
// then look at each commit
// and see how many files were modified in the commit K
// compute survival rate for commit K
