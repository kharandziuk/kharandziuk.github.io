/* global window */
(function (global) {
  'use strict';

  function wordOrderItemHasFrames(item) {
    return Array.isArray(item.frames) && item.frames.length > 0;
  }

  function tokenMap(item) {
    var map = {};
    item.tokens.forEach(function (t) {
      map[t.id] = t.text;
    });
    return map;
  }

  function wordOrderFrameSentence(frame, middleText) {
    return (frame.lead || '') + middleText + (frame.trail || '');
  }

  function userWordOrderLabel(item, userIds) {
    var byId = tokenMap(item);
    return userIds.map(function (id) { return byId[id] || '___'; }).join(' ');
  }

  function wordOrderMistakeText(item, userIds) {
    if (!wordOrderItemHasFrames(item)) {
      return wordOrderSentence(item, userWordOrderLabel(item, userIds));
    }
    var byId = tokenMap(item);
    return item.frames.map(function (frame, i) {
      var id = userIds[i];
      var text = id && byId[id] ? byId[id] : '___';
      return wordOrderFrameSentence(frame, text);
    }).join('\n');
  }

  function expectedWordOrderLabel(item) {
    if (wordOrderItemHasFrames(item) && Array.isArray(item.solution)) {
      return wordOrderMistakeText(item, item.solution);
    }
    if (Array.isArray(item.solution)) {
      var byId = tokenMap(item);
      return item.solution.map(function (id) { return byId[id]; }).join(' ');
    }
    return item.solution;
  }

  function wordOrderIsCorrect(item, userIds) {
    if (Array.isArray(item.solution)) {
      if (userIds.length !== item.solution.length) {
        return false;
      }
      for (var i = 0; i < item.solution.length; i++) {
        if (userIds[i] !== item.solution[i]) {
          return false;
        }
      }
      return true;
    }
    var byId = tokenMap(item);
    var userText = userIds.map(function (id) { return byId[id]; }).join(' ');
    return userText === item.solution;
  }

  function fillInSentence(item, blankValues) {
    var parts = [];
    item.problem.forEach(function (fragment) {
      if (typeof fragment === 'string') {
        parts.push(fragment);
        return;
      }
      parts.push(blankValues[fragment.id]);
    });
    return parts.join('');
  }

  function wordOrderSentence(item, middleText) {
    return (item.lead || '') + middleText + (item.trail || '');
  }

  function gradeFillInItem(item, userBlanks) {
    var units = [];
    var itemCorrect = true;
    item.problem.forEach(function (fragment) {
      if (typeof fragment === 'string') {
        return;
      }
      var user = userBlanks[fragment.id];
      var expected = item.solution[fragment.id];
      var ok = user === expected;
      units.push({ correct: ok });
      if (!ok) {
        itemCorrect = false;
      }
    });
    return {
      units: units,
      mistake: itemCorrect
        ? null
        : {
            given: fillInSentence(item, userBlanks),
            right: fillInSentence(item, item.solution)
          }
    };
  }

  function gradeWordOrderItem(item, userIds) {
    var ok = wordOrderIsCorrect(item, userIds);
    return {
      units: [{ correct: ok }],
      mistake: ok
        ? null
        : {
            given: wordOrderMistakeText(item, userIds),
            right: wordOrderMistakeText(item, item.solution)
          }
    };
  }

  global.ExerciseValidation = {
    wordOrderItemHasFrames: wordOrderItemHasFrames,
    tokenMap: tokenMap,
    expectedWordOrderLabel: expectedWordOrderLabel,
    wordOrderMistakeText: wordOrderMistakeText,
    wordOrderIsCorrect: wordOrderIsCorrect,
    fillInSentence: fillInSentence,
    wordOrderSentence: wordOrderSentence,
    gradeFillInItem: gradeFillInItem,
    gradeWordOrderItem: gradeWordOrderItem
  };
})(window);
