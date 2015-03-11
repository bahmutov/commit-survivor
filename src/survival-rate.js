require('lazy-ass');
var check = require('check-more-types');
var R = require('ramda');
var quote = require('quote');
var debug = require('./debug')('survival-rate');

function survivalRate(ids, history, survived) {
  la(check.arrayOfStrings(ids));
  la(check.array(history));
  la(ids.length === history.length);

  debug('computing survival rate');
  debug('--- ids\n', ids);
  debug('--- history\n', history);
  debug('--- survived\n', survived);

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
  debug('--- survivalStats\n', survivalStats);
  return survivalStats;
}

module.exports = check.defend(survivalRate,
  check.arrayOfStrings, 'missing commit ids',
  check.array, 'missing history');
