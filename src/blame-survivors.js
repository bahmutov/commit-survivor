require('lazy-ass');
var check = require('check-more-types');
var d3h = require('d3-helpers');
var folders = require('chdir-promise');
var quote = require('quote');
var R = require('ramda');
var Q = require('q');
var minimatch = require('minimatch');

var ggit = require('ggit');
require('console.table');

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

module.exports = blameToSurvivedCommit;
