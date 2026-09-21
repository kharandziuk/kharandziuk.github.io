/* global window */
(function (global) {
  'use strict';

  function emptySession() {
    return {
      pages: [],
      pageIndex: 0,
      reviewed: false,
      sessionStartedAt: 0,
      gradedUnits: [],
      mistakes: []
    };
  }

  var state = emptySession();

  function getState() {
    return state;
  }

  function initSession(uiPages) {
    state = {
      pages: uiPages,
      pageIndex: 0,
      reviewed: false,
      sessionStartedAt: 0,
      gradedUnits: [],
      mistakes: []
    };
  }

  function dispatch(action) {
    switch (action.type) {
      case 'GOTO_PAGE':
        state.pageIndex = action.index;
        state.reviewed = false;
        break;
      case 'CHECK_EXERCISE':
        state.gradedUnits = state.gradedUnits.concat(action.units);
        state.mistakes = state.mistakes.concat(action.mistakes);
        state.reviewed = true;
        break;
      default:
        break;
    }
  }

  function markSessionStarted() {
    state.sessionStartedAt = Date.now();
  }

  global.AppState = {
    getState: getState,
    initSession: initSession,
    markSessionStarted: markSessionStarted,
    dispatch: dispatch
  };
})(window);
