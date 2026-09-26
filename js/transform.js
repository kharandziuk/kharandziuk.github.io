/* global window */
(function (global) {
  'use strict';

  var GROUP_SIZES = [7, 7, 7, 10, 3];
  var EXPECTED_EXERCISE_COUNT = GROUP_SIZES.reduce(function (sum, n) { return sum + n; }, 0);

  function blankId(index) {
    return 'b' + index;
  }

  function assertExerciseArray(exercise, at) {
    if (!Array.isArray(exercise) || !exercise.length) {
      throw new Error(at + ': exercise must be a non-empty array.');
    }
  }

  function transformFillItem(exercise, at) {
    assertExerciseArray(exercise, at);
    if (exercise[0] !== 'fill') {
      throw new Error(at + '[0]: expected tag "fill".');
    }
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

    var problem = [parts[0]];
    var solution = {};
    for (var i = 0; i < answers.length; i++) {
      problem.push({ type: 'missingWord', id: blankId(i) });
      problem.push(parts[i + 1]);
      solution[blankId(i)] = answers[i];
    }
    return { problem: problem, solution: solution };
  }

  function transformOrderItem(exercise, at) {
    assertExerciseArray(exercise, at);
    if (exercise[0] !== 'order') {
      throw new Error(at + '[0]: expected tag "order".');
    }
    if (exercise.length !== 5) {
      throw new Error(at + ': "order" exercise must have exactly five elements.');
    }
    if (typeof exercise[1] !== 'string') {
      throw new Error(at + '[1]: lead must be a string.');
    }
    if (typeof exercise[2] !== 'string') {
      throw new Error(at + '[2]: trail must be a string.');
    }
    var tokenTexts = exercise[3];
    if (!Array.isArray(tokenTexts) || !tokenTexts.length) {
      throw new Error(at + '[3]: tokens must be a non-empty array of strings.');
    }
    tokenTexts.forEach(function (token, j) {
      if (typeof token !== 'string') {
        throw new Error(at + '[3][' + j + ']: must be a string.');
      }
    });
    var indices = exercise[4];
    if (!Array.isArray(indices) || !indices.length) {
      throw new Error(at + '[4]: must be a non-empty array of token indices.');
    }
    if (indices.length === 1) {
      var pick = indices[0];
      if (typeof pick !== 'number' || pick % 1 !== 0) {
        throw new Error(at + '[4][0]: must be an integer index.');
      }
      if (pick < 0 || pick >= tokenTexts.length) {
        throw new Error(at + '[4][0]: index out of range.');
      }
    } else if (indices.length !== tokenTexts.length) {
      throw new Error(at + '[4]: must have length 1 (preposition choice) or ' + tokenTexts.length + ' (full word order).');
    } else {
      var used = {};
      indices.forEach(function (idx, j) {
        if (typeof idx !== 'number' || idx % 1 !== 0) {
          throw new Error(at + '[4][' + j + ']: must be an integer index.');
        }
        if (idx < 0 || idx >= tokenTexts.length) {
          throw new Error(at + '[4][' + j + ']: index out of range.');
        }
        if (used[idx]) {
          throw new Error(at + '[4]: each token index must appear exactly once.');
        }
        used[idx] = true;
      });
    }

    var lead = exercise[1];
    var trail = exercise[2];
    var tokens = tokenTexts.map(function (text, i) {
      return { id: 't' + i, text: text };
    });
    var solution = indices.map(function (idx) {
      return 't' + idx;
    });
    return {
      lead: lead,
      trail: trail,
      tokens: tokens,
      solution: solution
    };
  }

  function transformAssignItem(exercise, at) {
    assertExerciseArray(exercise, at);
    if (exercise[0] !== 'assign') {
      throw new Error(at + '[0]: expected tag "assign".');
    }
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

    var tokens = prepositions.map(function (text, i) {
      return { id: 't' + i, text: text };
    });
    var uiFrames = frames.map(function (pair) {
      return { lead: pair[0], trail: pair[1] };
    });
    var solution = indices.map(function (idx) {
      return 't' + idx;
    });
    return {
      tokens: tokens,
      frames: uiFrames,
      solution: solution
    };
  }

  function transformFill(exercise, at) {
    return {
      type: 'fill-in',
      items: [transformFillItem(exercise, at)]
    };
  }

  function transformOrder(exercise, at) {
    return {
      type: 'word-order',
      items: [transformOrderItem(exercise, at)]
    };
  }

  function transformAssign(exercise, at) {
    return {
      type: 'word-order',
      items: [transformAssignItem(exercise, at)]
    };
  }

  function transformExercise(exercise, at) {
    at = at || 'exercise';
    assertExerciseArray(exercise, at);
    if (exercise[0] === 'fill') {
      return transformFill(exercise, at);
    }
    if (exercise[0] === 'order') {
      return transformOrder(exercise, at);
    }
    if (exercise[0] === 'assign') {
      return transformAssign(exercise, at);
    }
    throw new Error(at + '[0]: unsupported exercise tag "' + exercise[0] + '"; use "fill", "order", or "assign".');
  }

  function groupExercises(exercises) {
    if (exercises.length !== EXPECTED_EXERCISE_COUNT) {
      throw new Error('Expected ' + EXPECTED_EXERCISE_COUNT + ' exercises in fixed block order.');
    }
    var groups = [];
    var offset = 0;
    GROUP_SIZES.forEach(function (size) {
      groups.push(exercises.slice(offset, offset + size));
      offset += size;
    });
    return groups;
  }

  function transformGroup(exercises, groupIndex, exerciseOffset) {
    var tag = exercises[0][0];
    exercises.forEach(function (exercise, i) {
      if (exercise[0] !== tag) {
        throw new Error('groups[' + groupIndex + '][' + i + ']: expected tag "' + tag + '".');
      }
    });
    if (tag === 'fill') {
      return {
        type: 'fill-in',
        items: exercises.map(function (exercise, i) {
          return transformFillItem(exercise, 'exercises[' + (exerciseOffset + i) + ']');
        })
      };
    }
    if (tag === 'order') {
      return {
        type: 'word-order',
        items: exercises.map(function (exercise, i) {
          return transformOrderItem(exercise, 'exercises[' + (exerciseOffset + i) + ']');
        })
      };
    }
    if (tag === 'assign') {
      return {
        type: 'word-order',
        items: exercises.map(function (exercise, i) {
          return transformAssignItem(exercise, 'exercises[' + (exerciseOffset + i) + ']');
        })
      };
    }
    throw new Error('groups[' + groupIndex + ']: unsupported group tag.');
  }

  function transformExercises(exercises) {
    var groups = groupExercises(exercises);
    var offset = 0;
    return groups.map(function (group, i) {
      var page = transformGroup(group, i, offset);
      offset += group.length;
      return page;
    });
  }

  function parseAndTransform(raw) {
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
    return transformExercises(data.exercises);
  }

  global.ExerciseTransform = {
    GROUP_SIZES: GROUP_SIZES,
    transformExercise: transformExercise,
    transformExercises: transformExercises,
    parseAndTransform: parseAndTransform
  };
})(window);
