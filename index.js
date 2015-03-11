require('cute-stack')(require('bad-line'));
var check = require('check-more-types');
var survivors = require('./src/survivors');

module.exports = check.defend(survivors,
  check.unemptyString, 'Need git repo folder',
  check.maybe.unemptyString, 'Missing file mask');
