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

function removeUncommittedId(ids) {
  la(check.arrayOfStrings(ids), 'expected list of ids', ids);
  // modified lines that were not committed yet will get id 0
  return R.reject(R.match(/^0+$/), ids);
}

// count number of survived lines per file for each commit
function blameToSurvivedCommit(blame) {
  la(check.object(blame), 'expected blame objects');
  var survivors = {};
  Object.keys(blame).forEach(function (filename) {
    la(check.array(blame[filename]), 'expected list of blame per line for', filename);
    var commitIds = R.uniq(R.map(R.prop('commit'), blame[filename]));
    var survivedCommits =  removeUncommittedId(commitIds);
    // console.log('for file', quote(filename), 'survived commits', survivedCommits);

    // init survive line counters per file
    survivors[filename] = {};
    survivedCommits.forEach(function (id) {
      survivors[filename][id] = {
        survived: 0
      };
    });

    // count number of lines per commit still in the file
    blame[filename].forEach(function (lineBlame) {
      la(check.unemptyString(lineBlame.commit), 'missing commit', lineBlame);
      if (survivors[filename][lineBlame.commit]) {
        la(check.number(survivors[filename][lineBlame.commit].survived));
        survivors[filename][lineBlame.commit].survived += 1;
      }
    });
  });
  return survivors;
}

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

var j = R.rPartial(JSON.stringify, null, 2);
function survivalRate(ids, history, survived) {
  la(check.arrayOfStrings(ids));
  la(check.array(history));
  la(ids.length === history.length);

  console.log('computing survival rate');
  console.log('--- ids\n' + j(ids));
  console.log('--- history\n' + j(history));
  console.log('--- survived\n' + j(survived));

  var survivalRates = ids.map(function (id, k) {
    if (check.empty(history[k])) {
      console.log('commit', quote(id), 'is empty');
      return;
    }

    var files = R.keys(history[k]);
    console.log('looking at files', files);
    var totalWrittenLines = 0;
    var totalSurvivedLines = 0;

    files.forEach(function (filename) {
      var fileWrittenLines = history[k][filename].added;
      la(check.number(fileWrittenLines), fileWrittenLines);
      totalWrittenLines += fileWrittenLines;

      if (survived[filename] && survived[filename][id]) {
        var fileSurvivedLines = survived[filename][id].survived;
        la(check.number(fileSurvivedLines), 'expected survived number', survived[filename][id]);
        totalSurvivedLines += fileSurvivedLines;
      }
    });

    console.log('commit', quote(id), 'written', totalWrittenLines, 'survived', totalSurvivedLines);
    la(totalWrittenLines >= totalSurvivedLines, 'wrong written', totalWrittenLines,
      'vs survived lines', totalSurvivedLines, 'for commit', id);
    if (totalWrittenLines > 0) {
      return totalSurvivedLines / totalWrittenLines;
    }
  });

  var survivalStats = R.zipObj(ids, survivalRates);
  console.log('--- survivalStats\n' + j(survivalStats));
  return survivalStats;
}

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
