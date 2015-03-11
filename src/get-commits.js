require('lazy-ass');
var check = require('check-more-types');
var ggit = require('ggit');
var debug = require('debug')('get-commits');
var R = require('ramda');
var j = R.rPartial(JSON.stringify, null, 2);

function getCommits(folder) {
  la(check.unemptyString(folder), 'missing folder');
  return ggit.commits.all(folder)
    .then(ggit.commits.byId)
    .tap(R.compose(debug, j));
}

module.exports = check.defend(getCommits,
  check.unemptyString, 'missing git repo folder');
