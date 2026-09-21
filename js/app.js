/* global $, ExerciseData, ExerciseUI */
$(function () {
  ExerciseUI.bindEvents();

  ExerciseData.loadExercisesJson()
    .done(function (data) {
      if ($('#json').val().trim()) {
        return;
      }
      if (data && Array.isArray(data.exercises) && data.exercises.length) {
        $('#json').val(JSON.stringify(data, null, 2));
      }
    })
    .fail(function () {
      /* optional sample file; paste JSON still works */
    });
});
