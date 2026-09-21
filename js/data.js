/* global window, $ */
(function (global) {
  'use strict';

  function loadExercisesJson() {
    return $.getJSON('data/exercises.json');
  }

  function loadCheatsheetMarkdown() {
    return $.ajax({
      url: 'data/cheetsheet.md',
      dataType: 'text'
    });
  }

  global.ExerciseData = {
    loadExercisesJson: loadExercisesJson,
    loadCheatsheetMarkdown: loadCheatsheetMarkdown
  };
})(window);
