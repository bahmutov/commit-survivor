require('lazy-ass');
var check = require('check-more-types');
var ggit = require('ggit');
var R = require('ramda');

function commitStats(id) {
  return ggit.numstat(id);
}

function getChangesPerCommit(id) {
  la(check.unemptyString(id), 'missing id');
  return commitStats(id)
    .then(R.prop('changes'));
}

module.exports = getChangesPerCommit;
