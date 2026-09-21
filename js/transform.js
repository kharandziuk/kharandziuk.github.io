/* global window, ExerciseValidation */
(function (global) {
  'use strict';

  function blankId(index) {
    return 'b' + index;
  }

  function transformFillItem(exercise) {
    var parts = exercise[1];
    var answers = exercise[2];
    var problem = [parts[0]];
    var solution = {};
    for (var i = 0; i < answers.length; i++) {
      problem.push({ type: 'missingWord', id: blankId(i) });
      problem.push(parts[i + 1]);
      solution[blankId(i)] = answers[i];
    }
    return { problem: problem, solution: solution };
  }

  function transformFill(exercise) {
    return {
      type: 'fill-in',
      items: [transformFillItem(exercise)]
    };
  }

  function transformOrderItem(exercise) {
    var lead = exercise[1];
    var trail = exercise[2];
    var tokenTexts = exercise[3];
    var indices = exercise[4];
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

  function transformOrder(exercise) {
    return {
      type: 'word-order',
      items: [transformOrderItem(exercise)]
    };
  }

  function transformAssignItem(exercise) {
    var frames = exercise[1];
    var prepositions = exercise[2];
    var indices = exercise[3];
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

  function transformAssign(exercise) {
    return {
      type: 'word-order',
      items: [transformAssignItem(exercise)]
    };
  }

  function transformExercise(exercise) {
    if (exercise[0] === 'fill') {
      return transformFill(exercise);
    }
    if (exercise[0] === 'order') {
      return transformOrder(exercise);
    }
    if (exercise[0] === 'assign') {
      return transformAssign(exercise);
    }
    throw new Error('Unsupported exercise tag.');
  }

  function transformGroup(group, groupIndex) {
    var tag = group[0][0];
    group.forEach(function (exercise, i) {
      if (exercise[0] !== tag) {
        throw new Error('groups[' + groupIndex + '][' + i + ']: expected tag "' + tag + '".');
      }
    });
    var at = 'groups[' + groupIndex + ']';
    if (tag === 'fill') {
      var fillPage = {
        type: 'fill-in',
        items: group.map(transformFillItem)
      };
      ExerciseValidation.validateUiPage(fillPage, at);
      return fillPage;
    }
    if (tag === 'order') {
      var orderPage = {
        type: 'word-order',
        items: group.map(transformOrderItem)
      };
      ExerciseValidation.validateUiPage(orderPage, at);
      return orderPage;
    }
    if (tag === 'assign') {
      var assignPage = {
        type: 'word-order',
        items: group.map(transformAssignItem)
      };
      ExerciseValidation.validateUiPage(assignPage, at);
      return assignPage;
    }
    throw new Error(at + ': unsupported group tag.');
  }

  function transformExercises(exercises) {
    var groups = ExerciseValidation.groupExercises(exercises);
    return groups.map(function (group, i) {
      return transformGroup(group, i);
    });
  }

  global.ExerciseTransform = {
    transformExercise: transformExercise,
    transformExercises: transformExercises
  };
})(window);
