/* global window */
(function (global) {
  'use strict';

  var SUPPORTED_PAGE_TYPES = { 'fill-in': true, 'word-order': true };

  function validateFillInItems(items, at) {
    items.forEach(function (item, i) {
      var itemAt = at + '.items[' + i + ']';
      if (!Array.isArray(item.problem) || !item.problem.length) {
        throw new Error(itemAt + ': "problem" must be a non-empty array.');
      }
      if (!item.solution || typeof item.solution !== 'object' || Array.isArray(item.solution)) {
        throw new Error(itemAt + ': "solution" must be an object.');
      }

      var blankIds = {};
      item.problem.forEach(function (fragment, j) {
        var fragAt = itemAt + '.problem[' + j + ']';
        if (typeof fragment === 'string') {
          return;
        }
        if (!fragment || typeof fragment !== 'object' || Array.isArray(fragment)) {
          throw new Error(fragAt + ': must be a string or missingWord placeholder.');
        }
        if (fragment.type !== 'missingWord') {
          throw new Error(fragAt + ': unknown placeholder type.');
        }
        if (typeof fragment.id !== 'string' || !fragment.id.trim()) {
          throw new Error(fragAt + ': missingWord "id" must be a non-empty string.');
        }
        if (blankIds[fragment.id]) {
          throw new Error(fragAt + ': duplicate blank id "' + fragment.id + '" within item.');
        }
        blankIds[fragment.id] = true;
      });

      Object.keys(item.solution).forEach(function (blankId) {
        if (!blankIds[blankId]) {
          throw new Error(itemAt + ': solution key "' + blankId + '" has no matching blank in problem.');
        }
        if (typeof item.solution[blankId] !== 'string') {
          throw new Error(itemAt + ': solution["' + blankId + '"] must be a string.');
        }
      });

      Object.keys(blankIds).forEach(function (blankId) {
        if (!(blankId in item.solution)) {
          throw new Error(itemAt + ': blank "' + blankId + '" has no entry in solution.');
        }
      });
    });
  }

  function wordOrderItemHasFrames(item) {
    return Array.isArray(item.frames) && item.frames.length > 0;
  }

  function validateWordOrderTokenList(tokens, itemAt, requireDistinctText) {
    if (!Array.isArray(tokens) || !tokens.length) {
      throw new Error(itemAt + ': "tokens" must be a non-empty array.');
    }
    var tokenIds = {};
    var tokenTexts = {};
    tokens.forEach(function (token, j) {
      var tokAt = itemAt + '.tokens[' + j + ']';
      if (!token || typeof token !== 'object' || Array.isArray(token)) {
        throw new Error(tokAt + ': must be an object.');
      }
      if (typeof token.id !== 'string' || !token.id.trim()) {
        throw new Error(tokAt + ': "id" must be a non-empty string.');
      }
      if (typeof token.text !== 'string') {
        throw new Error(tokAt + ': "text" must be a string.');
      }
      if (tokenIds[token.id]) {
        throw new Error(tokAt + ': duplicate token id "' + token.id + '" within item.');
      }
      tokenIds[token.id] = true;
      if (requireDistinctText) {
        if (tokenTexts[token.text]) {
          throw new Error(tokAt + ': duplicate token text "' + token.text + '" within item.');
        }
        tokenTexts[token.text] = true;
      }
    });
    return tokenIds;
  }

  function validateWordOrderFrame(frame, frameAt) {
    if (!frame || typeof frame !== 'object' || Array.isArray(frame)) {
      throw new Error(frameAt + ': must be an object.');
    }
    if (frame.lead !== undefined && typeof frame.lead !== 'string') {
      throw new Error(frameAt + ': "lead" must be a string when present.');
    }
    if (frame.trail !== undefined && typeof frame.trail !== 'string') {
      throw new Error(frameAt + ': "trail" must be a string when present.');
    }
    if (frame.lead === undefined && frame.trail === undefined) {
      throw new Error(frameAt + ': at least one of "lead" or "trail" is required.');
    }
  }

  function validateWordOrderItems(items, at) {
    items.forEach(function (item, i) {
      var itemAt = at + '.items[' + i + ']';
      if (item.prompt !== undefined && typeof item.prompt !== 'string') {
        throw new Error(itemAt + ': "prompt" must be a string when present.');
      }
      var hasFrames = wordOrderItemHasFrames(item);
      if (hasFrames && (item.lead !== undefined || item.trail !== undefined)) {
        throw new Error(itemAt + ': use "frames" or item-level "lead"/"trail", not both.');
      }
      if (!hasFrames) {
        if (item.lead !== undefined && typeof item.lead !== 'string') {
          throw new Error(itemAt + ': "lead" must be a string when present.');
        }
        if (item.trail !== undefined && typeof item.trail !== 'string') {
          throw new Error(itemAt + ': "trail" must be a string when present.');
        }
      }

      var tokenIds = validateWordOrderTokenList(item.tokens, itemAt, hasFrames);

      if (hasFrames) {
        if (item.frames.length !== 5) {
          throw new Error(itemAt + ': "frames" must contain exactly five entries.');
        }
        if (item.tokens.length !== 5) {
          throw new Error(itemAt + ': "tokens" must contain exactly five entries when using "frames".');
        }
        item.frames.forEach(function (frame, j) {
          validateWordOrderFrame(frame, itemAt + '.frames[' + j + ']');
        });
        if (!Array.isArray(item.solution)) {
          throw new Error(itemAt + ': "solution" must be an array of token ids when using "frames".');
        }
        if (item.solution.length !== item.frames.length) {
          throw new Error(itemAt + ': "solution" length must match "frames" length.');
        }
        var usedInSolution = {};
        item.solution.forEach(function (tokenId, j) {
          if (typeof tokenId !== 'string' || !tokenId.trim()) {
            throw new Error(itemAt + ': solution[' + j + '] must be a non-empty string.');
          }
          if (!tokenIds[tokenId]) {
            throw new Error(itemAt + ': solution references unknown token id "' + tokenId + '".');
          }
          if (usedInSolution[tokenId]) {
            throw new Error(itemAt + ': solution must use each token id exactly once.');
          }
          usedInSolution[tokenId] = true;
        });
        if (Object.keys(usedInSolution).length !== item.tokens.length) {
          throw new Error(itemAt + ': solution must use each token id exactly once.');
        }
        return;
      }

      if (Array.isArray(item.solution)) {
        if (!item.solution.length) {
          throw new Error(itemAt + ': "solution" array must be non-empty.');
        }
        item.solution.forEach(function (tokenId, j) {
          if (typeof tokenId !== 'string' || !tokenId.trim()) {
            throw new Error(itemAt + ': solution[' + j + '] must be a non-empty string.');
          }
          if (!tokenIds[tokenId]) {
            throw new Error(itemAt + ': solution references unknown token id "' + tokenId + '".');
          }
        });
      } else if (typeof item.solution === 'string') {
        if (!item.solution.length) {
          throw new Error(itemAt + ': "solution" string must be non-empty.');
        }
      } else {
        throw new Error(itemAt + ': "solution" must be an array of token ids or a string.');
      }
    });
  }

  function validateItems(pageType, items, at) {
    if (!Array.isArray(items) || !items.length) {
      throw new Error(at + ': "items" must be a non-empty array.');
    }
    items.forEach(function (item, i) {
      var itemAt = at + '.items[' + i + ']';
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        throw new Error(itemAt + ': must be an object.');
      }
      if (Object.prototype.hasOwnProperty.call(item, 'id')) {
        throw new Error(itemAt + ': "id" is not allowed; item order is defined by the items array.');
      }
    });
    if (pageType === 'fill-in') {
      validateFillInItems(items, at);
    } else if (pageType === 'word-order') {
      validateWordOrderItems(items, at);
    }
  }

  function validateCompactFill(exercise, at) {
    if (exercise.length !== 3) {
      throw new Error(at + ': "fill" exercise must have exactly three elements.');
    }
    var parts = exercise[1];
    var answers = exercise[2];
    if (!Array.isArray(parts) || parts.length < 2) {
      throw new Error(at + '[1]: must be an array of at least two text fragments.');
    }
    parts.forEach(function (part, j) {
      if (typeof part !== 'string') {
        throw new Error(at + '[1][' + j + ']: must be a string.');
      }
    });
    if (!Array.isArray(answers) || answers.length !== parts.length - 1) {
      throw new Error(at + '[2]: must be an array with one answer per blank (' + (parts.length - 1) + ' expected).');
    }
    answers.forEach(function (answer, j) {
      if (typeof answer !== 'string') {
        throw new Error(at + '[2][' + j + ']: must be a string.');
      }
    });
  }

  function validateCompactOrder(exercise, at) {
    if (exercise.length !== 5) {
      throw new Error(at + ': "order" exercise must have exactly five elements.');
    }
    if (typeof exercise[1] !== 'string') {
      throw new Error(at + '[1]: lead must be a string.');
    }
    if (typeof exercise[2] !== 'string') {
      throw new Error(at + '[2]: trail must be a string.');
    }
    var tokens = exercise[3];
    if (!Array.isArray(tokens) || !tokens.length) {
      throw new Error(at + '[3]: tokens must be a non-empty array of strings.');
    }
    tokens.forEach(function (token, j) {
      if (typeof token !== 'string') {
        throw new Error(at + '[3][' + j + ']: must be a string.');
      }
    });
    var solution = exercise[4];
    if (!Array.isArray(solution) || !solution.length) {
      throw new Error(at + '[4]: must be a non-empty array of token indices.');
    }
    if (solution.length === 1) {
      var pick = solution[0];
      if (typeof pick !== 'number' || pick % 1 !== 0) {
        throw new Error(at + '[4][0]: must be an integer index.');
      }
      if (pick < 0 || pick >= tokens.length) {
        throw new Error(at + '[4][0]: index out of range.');
      }
      return;
    }
    if (solution.length !== tokens.length) {
      throw new Error(at + '[4]: must have length 1 (preposition choice) or ' + tokens.length + ' (full word order).');
    }
    var used = {};
    solution.forEach(function (idx, j) {
      if (typeof idx !== 'number' || idx % 1 !== 0) {
        throw new Error(at + '[4][' + j + ']: must be an integer index.');
      }
      if (idx < 0 || idx >= tokens.length) {
        throw new Error(at + '[4][' + j + ']: index out of range.');
      }
      if (used[idx]) {
        throw new Error(at + '[4]: each token index must appear exactly once.');
      }
      used[idx] = true;
    });
  }

  function validateCompactAssign(exercise, at) {
    if (exercise.length !== 4) {
      throw new Error(at + ': "assign" exercise must have exactly four elements.');
    }
    var frames = exercise[1];
    if (!Array.isArray(frames) || frames.length !== 5) {
      throw new Error(at + '[1]: must be an array of exactly five [lead, trail] pairs.');
    }
    frames.forEach(function (frame, j) {
      var frameAt = at + '[1][' + j + ']';
      if (!Array.isArray(frame) || frame.length !== 2) {
        throw new Error(frameAt + ': must be a two-element [lead, trail] array.');
      }
      if (typeof frame[0] !== 'string' || typeof frame[1] !== 'string') {
        throw new Error(frameAt + ': lead and trail must be strings.');
      }
    });
    var prepositions = exercise[2];
    if (!Array.isArray(prepositions) || prepositions.length !== 5) {
      throw new Error(at + '[2]: must be an array of exactly five preposition strings.');
    }
    var prepTexts = {};
    prepositions.forEach(function (prep, j) {
      if (typeof prep !== 'string' || !prep.length) {
        throw new Error(at + '[2][' + j + ']: must be a non-empty string.');
      }
      if (prepTexts[prep]) {
        throw new Error(at + '[2]: prepositions must be distinct.');
      }
      prepTexts[prep] = true;
    });
    var indices = exercise[3];
    if (!Array.isArray(indices) || indices.length !== 5) {
      throw new Error(at + '[3]: must be an array of exactly five indices.');
    }
    var usedIdx = {};
    indices.forEach(function (idx, j) {
      if (typeof idx !== 'number' || idx % 1 !== 0) {
        throw new Error(at + '[3][' + j + ']: must be an integer index.');
      }
      if (idx < 0 || idx >= prepositions.length) {
        throw new Error(at + '[3][' + j + ']: index out of range.');
      }
      if (usedIdx[idx]) {
        throw new Error(at + '[3]: each preposition index must appear exactly once.');
      }
      usedIdx[idx] = true;
    });
  }

  function validateCompactExercise(exercise, at) {
    if (!Array.isArray(exercise) || !exercise.length) {
      throw new Error(at + ': exercise must be a non-empty array.');
    }
    if (exercise[0] === 'fill') {
      validateCompactFill(exercise, at);
      return;
    }
    if (exercise[0] === 'order') {
      validateCompactOrder(exercise, at);
      return;
    }
    if (exercise[0] === 'assign') {
      validateCompactAssign(exercise, at);
      return;
    }
    throw new Error(at + '[0]: unsupported exercise tag "' + exercise[0] + '"; use "fill", "order", or "assign".');
  }

  function validateUiPage(page, at) {
    if (!page || typeof page !== 'object' || Array.isArray(page)) {
      throw new Error(at + ': transformed page must be an object.');
    }
    if (typeof page.type !== 'string' || !SUPPORTED_PAGE_TYPES[page.type]) {
      throw new Error(at + ': unsupported page type.');
    }
    validateItems(page.type, page.items, at);
  }

  var GROUP_SIZES = [7, 7, 7, 10, 3];

  function groupExercises(exercises) {
    if (exercises.length !== GROUP_SIZES.reduce(function (sum, n) { return sum + n; }, 0)) {
      throw new Error('Expected ' + GROUP_SIZES.reduce(function (sum, n) { return sum + n; }, 0) + ' exercises in fixed block order.');
    }
    var groups = [];
    var offset = 0;
    GROUP_SIZES.forEach(function (size) {
      groups.push(exercises.slice(offset, offset + size));
      offset += size;
    });
    return groups;
  }

  function parsePayload(raw) {
    var data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      throw new Error('Invalid JSON: ' + e.message);
    }
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new Error('Expected a JSON object with an "exercises" array.');
    }
    if (!Array.isArray(data.exercises) || !data.exercises.length) {
      throw new Error('Expected a non-empty "exercises" array.');
    }
    data.exercises.forEach(function (exercise, i) {
      validateCompactExercise(exercise, 'exercises[' + i + ']');
    });
    return data.exercises;
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
    SUPPORTED_PAGE_TYPES: SUPPORTED_PAGE_TYPES,
    GROUP_SIZES: GROUP_SIZES,
    groupExercises: groupExercises,
    parsePayload: parsePayload,
    validateUiPage: validateUiPage,
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
