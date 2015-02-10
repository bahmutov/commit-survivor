var ggit = require('ggit');
require('console.table');

var repoFolder = __dirname;

ggit.commits.all(repoFolder)
  .then(function (list) {
    console.table(list);
    console.log(list.length + ' commit(s)');
  })
  .done();

// look at the git blame for files at head
// then look at each commit
// and see how many files were modified in the commit K
// compute survival rate for commit K
