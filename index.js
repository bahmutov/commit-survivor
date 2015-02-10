var ggit = require('ggit');
require('console.table');

var repoFolder = __dirname;

ggit.commits.all(repoFolder)
  .then(function (list) {
    console.table(list);
    console.log(list.length + ' commit(s)');
  })
  .done();
