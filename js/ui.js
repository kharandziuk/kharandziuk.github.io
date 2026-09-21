/* global window, $, AppState, ExerciseValidation, ExerciseData, marked */
(function (global) {
  'use strict';

  var V = ExerciseValidation;

  function padTwo(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function formatDuration(ms) {
    var totalSec = Math.floor(ms / 1000);
    var h = Math.floor(totalSec / 3600);
    var m = Math.floor((totalSec % 3600) / 60);
    var s = totalSec % 60;
    if (h > 0) {
      return h + ':' + padTwo(m) + ':' + padTwo(s);
    }
    return m + ':' + padTwo(s);
  }

  function shuffleArray(list) {
    var copy = list.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  function createTokenChip(tokenId, text) {
    return $('<button>', {
      type: 'button',
      class: 'token-chip cursor-grab rounded-md border border-slate-300 bg-white px-2 py-0.5 text-xl leading-relaxed shadow-sm hover:border-slate-500 active:cursor-grabbing',
      'data-token-id': tokenId,
      draggable: true,
      text: text
    });
  }

  function placeTokenInSlot($slot, $item, $chip) {
    var tokenId = $chip.attr('data-token-id');
    $item.find('.answer-slots .token-chip').each(function () {
      var $placed = $(this);
      if ($placed.attr('data-token-id') === tokenId && this !== $chip[0]) {
        $placed.detach().appendTo($item.find('.token-bank'));
      }
    });
    var $existing = $slot.find('.token-chip');
    if ($existing.length && $existing[0] !== $chip[0]) {
      returnTokenToBank($item, $existing);
    }
    $chip.detach();
    $slot.append($chip);
  }

  function placeTokenInFirstEmptySlot($item, $chip) {
    var $target = null;
    $item.find('.answer-slots').each(function () {
      if (!$(this).find('.token-chip').length) {
        $target = $(this);
        return false;
      }
    });
    if ($target) {
      placeTokenInSlot($target, $item, $chip);
    }
  }

  function placeTokenInAnswer($item, $chip) {
    if ($item.find('.word-order-frame').length) {
      placeTokenInFirstEmptySlot($item, $chip);
      return;
    }
    $item.find('.answer-slots').first().append($chip.detach());
  }

  function returnTokenToBank($item, $chip) {
    $chip.detach().appendTo($item.find('.token-bank'));
  }

  function userWordOrderSequence($item) {
    var ids = [];
    if ($item.find('.word-order-frame').length) {
      $item.find('.answer-slots').each(function () {
        var $chip = $(this).find('.token-chip').first();
        ids.push($chip.length ? $chip.attr('data-token-id') : '');
      });
      return ids;
    }
    $item.find('.answer-slots .token-chip').each(function () {
      ids.push($(this).attr('data-token-id'));
    });
    return ids;
  }

  function bindWordOrderInteractions($app) {
    $app.on('click', '.word-order-item .token-bank .token-chip', function () {
      if (AppState.getState().reviewed) {
        return;
      }
      var $chip = $(this);
      var $item = $chip.closest('.word-order-item');
      placeTokenInAnswer($item, $chip);
    });

    $app.on('click', '.word-order-item .answer-slots .token-chip', function () {
      if (AppState.getState().reviewed) {
        return;
      }
      var $chip = $(this);
      var $item = $chip.closest('.word-order-item');
      returnTokenToBank($item, $chip);
    });

    $app.on('dragstart', '.token-chip', function (e) {
      if (AppState.getState().reviewed) {
        e.preventDefault();
        return;
      }
      var $chip = $(this);
      e.originalEvent.dataTransfer.setData('text/plain', $chip.attr('data-token-id'));
      e.originalEvent.dataTransfer.effectAllowed = 'move';
      $chip.addClass('opacity-50');
    });

    $app.on('dragend', '.token-chip', function () {
      $(this).removeClass('opacity-50');
    });

    $app.on('dragover', '.answer-slots, .token-bank', function (e) {
      if (AppState.getState().reviewed) {
        return;
      }
      e.preventDefault();
      e.originalEvent.dataTransfer.dropEffect = 'move';
    });

    $app.on('drop', '.answer-slots', function (e) {
      if (AppState.getState().reviewed) {
        return;
      }
      e.preventDefault();
      var tokenId = e.originalEvent.dataTransfer.getData('text/plain');
      if (!tokenId) {
        return;
      }
      var $item = $(this).closest('.word-order-item');
      var $chip = $item.find('.token-chip[data-token-id="' + tokenId + '"]').first();
      if (!$chip.length) {
        return;
      }
      placeTokenInSlot($(this), $item, $chip);
    });

    $app.on('drop', '.token-bank', function (e) {
      if (AppState.getState().reviewed) {
        return;
      }
      e.preventDefault();
      var tokenId = e.originalEvent.dataTransfer.getData('text/plain');
      if (!tokenId) {
        return;
      }
      var $item = $(this).closest('.word-order-item');
      var $chip = $item.find('.token-chip[data-token-id="' + tokenId + '"]').first();
      if (!$chip.length) {
        return;
      }
      returnTokenToBank($item, $chip);
    });
  }

  var PAGE_INSTRUCTIONS = {
    'fill-in': 'Ergänze die fehlenden Wörter.',
    'word-order': 'Setze die Wörter in die richtige Reihenfolge.'
  };

  function appendPageInstruction(page, $app) {
    var text = page.instruction || PAGE_INSTRUCTIONS[page.type];
    if (text) {
      $app.append($('<p>', { class: 'mb-8 text-base text-slate-700', text: text }));
    }
  }

  function renderFillInItems(items, $app) {
    items.forEach(function (item, itemIndex) {
      var $line = $('<p>', { class: 'text-xl leading-relaxed', 'data-item-index': String(itemIndex) });
      item.problem.forEach(function (fragment) {
        if (typeof fragment === 'string') {
          $line.append($('<span>').text(fragment));
          return;
        }
        var $wrap = $('<span>', { class: 'inline-flex items-baseline gap-1' });
        $wrap.append($('<input>', {
          type: 'text',
          autocomplete: 'off',
          autocapitalize: 'off',
          spellcheck: false,
          'data-blank-id': fragment.id,
          class: 'blank w-24 min-w-[3rem] max-w-[12rem] border-b-2 border-slate-400 bg-transparent px-1 py-0 text-xl leading-relaxed focus:border-slate-900 focus:outline-none'
        }));
        $wrap.append($('<span>', {
          class: 'correction hidden text-base text-emerald-700',
          'aria-live': 'polite'
        }));
        $line.append($wrap);
      });
      $app.append($line);
    });
  }

  function renderWordOrderItems(items, $app) {
    items.forEach(function (item, itemIndex) {
      var $block = $('<div>', { class: 'word-order-item space-y-3', 'data-item-index': String(itemIndex) });

      if (V.wordOrderItemHasFrames(item)) {
        item.frames.forEach(function (frame) {
          var $line = $('<div>', {
            class: 'word-order-frame flex flex-wrap items-baseline gap-x-1 gap-y-2 text-xl leading-relaxed'
          });
          if (frame.lead) {
            $line.append($('<span>').text(frame.lead));
          }
          $line.append($('<div>', {
            class: 'answer-slots inline-flex min-h-[2.25rem] min-w-[4rem] flex-wrap items-center gap-1 border-b-2 border-dashed border-slate-300 px-1'
          }));
          if (frame.trail) {
            $line.append($('<span>').text(frame.trail));
          }
          $block.append($line);
        });
      } else {
        var $line = $('<div>', { class: 'flex flex-wrap items-baseline gap-x-1 gap-y-2 text-xl leading-relaxed' });
        if (item.lead) {
          $line.append($('<span>').text(item.lead));
        }
        $line.append($('<div>', {
          class: 'answer-slots inline-flex min-h-[2.25rem] min-w-[8rem] flex-wrap items-center gap-1 border-b-2 border-dashed border-slate-300 px-1'
        }));
        if (item.trail) {
          $line.append($('<span>').text(item.trail));
        }
        $block.append($line);
      }

      var $bank = $('<div>', {
        class: 'token-bank flex min-h-[2.75rem] flex-wrap gap-2 rounded-lg border border-slate-200 bg-slate-100 p-3'
      });
      shuffleArray(item.tokens).forEach(function (token) {
        $bank.append(createTokenChip(token.id, token.text));
      });
      $block.append($bank);

      $block.append($('<p>', {
        class: 'correction hidden text-base',
        'aria-live': 'polite'
      }));

      $app.append($block);
    });
  }

  function renderPage(uiPage) {
    var $app = $('#app').empty();
    appendPageInstruction(uiPage, $app);
    if (uiPage.type === 'fill-in') {
      renderFillInItems(uiPage.items, $app);
    } else if (uiPage.type === 'word-order') {
      renderWordOrderItems(uiPage.items, $app);
    } else {
      $app.append($('<p>', { class: 'text-rose-600' }).text('Unsupported page type.'));
    }
  }

  function gradeFillInDom(page) {
    var items = page.items;
    $('#app .blank').each(function () {
      var $input = $(this);
      var $wrap = $input.parent();
      var $correction = $wrap.find('.correction');
      var itemIndex = parseInt($input.closest('[data-item-index]').attr('data-item-index'), 10);
      var blankId = $input.attr('data-blank-id');
      var item = items[itemIndex];
      var expected = item.solution[blankId];
      var user = $input.val();
      var ok = user === expected;

      $input.removeClass('border-emerald-600 border-rose-600 border-slate-400');
      $correction.removeClass('hidden text-emerald-700 text-rose-600').empty();

      if (ok) {
        $input.addClass('border-emerald-600');
        $correction.addClass('text-emerald-700').removeClass('hidden').text('✓');
      } else {
        $input.addClass('border-rose-600');
        $correction
          .addClass('text-rose-600')
          .removeClass('hidden')
          .text('→ ' + expected);
      }
    });
  }

  function gradeWordOrderDom(page) {
    var items = page.items;
    $('#app .word-order-item').each(function () {
      var $item = $(this);
      var itemIndex = parseInt($item.attr('data-item-index'), 10);
      var item = items[itemIndex];
      var userIds = userWordOrderSequence($item);
      var ok = V.wordOrderIsCorrect(item, userIds);
      var $slots = $item.find('.answer-slots');
      var $correction = $item.find('.correction');

      $slots.removeClass('border-emerald-600 border-rose-600 border-slate-300');
      $correction.removeClass('hidden text-emerald-700 text-rose-600').empty();

      if (V.wordOrderItemHasFrames(item)) {
        item.solution.forEach(function (expectedId, i) {
          var slotOk = userIds[i] === expectedId;
          var $slot = $slots.eq(i);
          $slot.addClass(slotOk ? 'border-emerald-600' : 'border-rose-600');
        });
        ok = item.solution.every(function (expectedId, i) {
          return userIds[i] === expectedId;
        });
      }

      if (ok) {
        if (!V.wordOrderItemHasFrames(item)) {
          $slots.addClass('border-emerald-600');
        }
        $correction.addClass('text-emerald-700').removeClass('hidden').text('✓');
      } else {
        if (!V.wordOrderItemHasFrames(item)) {
          $slots.addClass('border-rose-600');
        }
        if (V.wordOrderItemHasFrames(item)) {
          $correction
            .addClass('text-rose-600 whitespace-pre-line')
            .removeClass('hidden')
            .text(V.wordOrderMistakeText(item, userIds) + '\n→ ' + V.expectedWordOrderLabel(item));
        } else {
          $correction
            .addClass('text-rose-600')
            .removeClass('hidden')
            .text('→ ' + V.expectedWordOrderLabel(item));
        }
      }
    });
  }

  function collectFillInGrades(page) {
    var units = [];
    var mistakes = [];
    page.items.forEach(function (item, itemIndex) {
      var userBlanks = {};
      item.problem.forEach(function (fragment) {
        if (typeof fragment === 'string') {
          return;
        }
        var $input = $('#app [data-item-index="' + itemIndex + '"] input.blank[data-blank-id="' + fragment.id + '"]');
        userBlanks[fragment.id] = $input.val();
      });
      var graded = V.gradeFillInItem(item, userBlanks);
      units = units.concat(graded.units);
      if (graded.mistake) {
        mistakes.push(graded.mistake);
      }
    });
    return { units: units, mistakes: mistakes };
  }

  function collectWordOrderGrades(page) {
    var units = [];
    var mistakes = [];
    page.items.forEach(function (item, itemIndex) {
      var $item = $('#app .word-order-item[data-item-index="' + itemIndex + '"]');
      var userIds = userWordOrderSequence($item);
      var graded = V.gradeWordOrderItem(item, userIds);
      units = units.concat(graded.units);
      if (graded.mistake) {
        mistakes.push(graded.mistake);
      }
    });
    return { units: units, mistakes: mistakes };
  }

  function collectPageGrades(page) {
    if (page.type === 'fill-in') {
      return collectFillInGrades(page);
    }
    if (page.type === 'word-order') {
      return collectWordOrderGrades(page);
    }
    return { units: [], mistakes: [] };
  }

  function showSummary(completedAt) {
    var state = AppState.getState();
    var elapsedMs = completedAt - state.sessionStartedAt;
    var units = state.gradedUnits;
    var correctCount = units.filter(function (u) { return u.correct; }).length;
    var pct = units.length
      ? Math.round((correctCount / units.length) * 100)
      : 0;
    var elapsedText = formatDuration(elapsedMs);
    var pctText = pct + '%';
    var completedText = new Date(completedAt).toLocaleString();

    var $stats = $('#summary-stats').empty();
    $stats.append(
      $('<div>').append(
        $('<dt>', { class: 'text-slate-500', text: 'Elapsed time' }),
        $('<dd>', { class: 'mt-1 text-base font-medium tabular-nums', text: elapsedText })
      ),
      $('<div>').append(
        $('<dt>', { class: 'text-slate-500', text: 'Correct' }),
        $('<dd>', { class: 'mt-1 text-base font-medium tabular-nums', text: pctText })
      ),
      $('<div>').append(
        $('<dt>', { class: 'text-slate-500', text: 'Completed at' }),
        $('<dd>', { class: 'mt-1 text-base font-medium', text: completedText })
      )
    );
    $('#summary-copy-elapsed').text(elapsedText);
    $('#summary-copy-pct').text(pctText);
    $('#summary-copy-completed').text(completedText);

    var mistakes = state.mistakes;
    var $list = $('#summary-mistakes').empty();
    mistakes.forEach(function (entry) {
      $list.append($('<li>', { class: 'space-y-1' }).append(
        $('<p>', { class: 'text-rose-700 whitespace-pre-line', text: entry.given }),
        $('<p>', { class: 'text-slate-600 whitespace-pre-line', text: '→ ' + entry.right })
      ));
    });
    $('#summary-no-mistakes').toggleClass('hidden', mistakes.length > 0);

    $('#session-body').addClass('hidden');
    $('#summary').removeClass('hidden');
    window.scrollTo(0, 0);
  }

  function updatePageIndicator() {
    var state = AppState.getState();
    var n = state.pages.length;
    var current = state.pageIndex + 1;
    $('#page-indicator').text('Page ' + current + ' of ' + n);
  }

  function resetPrimaryButton() {
    $('#check').text('Check answers');
  }

  function showPage(index) {
    var state = AppState.getState();
    var page = state.pages[index];
    AppState.dispatch({ type: 'GOTO_PAGE', index: index });
    resetPrimaryButton();
    updatePageIndicator();
    renderPage(page);
    window.scrollTo(0, 0);
  }

  function gradeAll() {
    var state = AppState.getState();
    var page = state.pages[state.pageIndex];
    if (page.type === 'fill-in') {
      gradeFillInDom(page);
    } else if (page.type === 'word-order') {
      gradeWordOrderDom(page);
    }
    var collected = collectPageGrades(page);
    AppState.dispatch({
      type: 'CHECK_EXERCISE',
      units: collected.units,
      mistakes: collected.mistakes
    });
  }

  function showCheatsheet() {
    $('#loader').addClass('hidden');
    $('#cheatsheet').removeClass('hidden');
    $('#session').addClass('hidden');
    $('#cheatsheet-content').empty();
    $('#cheatsheet-error').addClass('hidden').text('');
    ExerciseData.loadCheatsheetMarkdown()
      .done(function (md) {
        $('#cheatsheet-content').html(marked.parse(md));
      })
      .fail(function () {
        $('#cheatsheet-error').removeClass('hidden').text('Could not load cheat sheet.');
      });
    window.scrollTo(0, 0);
  }

  function beginDrills() {
    $('#cheatsheet').addClass('hidden');
    $('#session').removeClass('hidden');
    $('#session-body').removeClass('hidden');
    $('#summary').addClass('hidden');
    AppState.markSessionStarted();
    showPage(0);
  }

  function bindEvents() {
    bindWordOrderInteractions($('#app'));

    $('#load').on('click', function () {
      var exercises;
      try {
        exercises = ExerciseValidation.parsePayload($('#json').val());
      } catch (e) {
        $('#error').text(e.message);
        return;
      }
      $('#error').text('');
      var uiPages = ExerciseTransform.transformExercises(exercises);
      AppState.initSession(uiPages);
      showCheatsheet();
    });

    $('#start-drills').on('click', function () {
      beginDrills();
    });

    $('#check').on('click', function () {
      var state = AppState.getState();
      var label = $('#check').text();
      if (label === 'Next') {
        showPage(state.pageIndex + 1);
        return;
      }
      if (label === 'Summary') {
        showSummary(Date.now());
        return;
      }
      gradeAll();
      if (state.pageIndex < state.pages.length - 1) {
        $('#check').text('Next');
      } else {
        $('#check').text('Summary');
      }
    });
  }

  global.ExerciseUI = {
    bindEvents: bindEvents,
    renderPage: renderPage,
    showPage: showPage
  };
})(window);
