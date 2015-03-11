var debug = require('debug');
module.exports = function debugIt(label) {
  var log = debug(label);
  var R = require('ramda');
  var j = R.rPartial(JSON.stringify, null, 2);

  function toString(x) {
    return typeof x === 'object' ? j(x) : x;
  }

  return function debugLog() {
    var args = Array.prototype.slice.call(arguments, 0);
    log.call(null, args.map(toString).join(' '));
  };
};
