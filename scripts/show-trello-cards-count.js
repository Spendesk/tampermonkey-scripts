// ==UserScript==
// @name         Show Trello cards count
// @namespace    http://tampermonkey.net/
// @updateURL    https://raw.githubusercontent.com/Spendesk/tampermonkey-scripts/master/scripts/show-trello-cards-count.js
// @downloadURL  https://raw.githubusercontent.com/Spendesk/tampermonkey-scripts/master/scripts/show-trello-cards-count.js
// @version      0.2
// @description  Trello keeps counters of cards per column but its hidden unless you have an active filter. This script makes these counters always visible.
// @author       Spendesk
// @match        https://trello.com/b/*
// @grant        none
// @icon         https://www.spendesk.com/favicon-32x32.png
// ==/UserScript==

(async function () {
  'use strict';

  const boardSelector = '#board';
  const listSelector = '.js-list';
  const counterSelector = '.js-num-cards';
  const counterHideClass = 'hide';
  const counterObserverMap = new Map();

  // Wait for counter element to be in the DOM by querying the DOM every second.
  while (!document.querySelectorAll(counterSelector).length > 0) {
    await new Promise((r) => setTimeout(r, 1000));
  }

  const initialCounters = document.querySelectorAll(counterSelector);
  const board = document.querySelector(boardSelector);

  // Set up MutationObserver on the board to watch for added/removed columns.
  // This is mostly useful because Trello lazy loads the columns that aren't
  // in the initial viewport.
  const observer = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
      for (const node of mutation.addedNodes) {
        // Set-up a MutationObserver on the counter of added lists.
        if (node.matches(listSelector)) {
          const counter = node.querySelector(counterSelector);
          attachCounterObserver(counter);
        }
      }

      for (const node of mutation.removedNodes) {
        // Remove existing MutationObserver on thee counter of removed lists.
        if (node.matches(listSelector)) {
          const counter = node.querySelector(counterSelector);
          detachCounterObserver(counter);
        }
      }
    }
  });
  // Only observer for addition/removal of direct child nodes
  observer.observe(board, {
    childList: true,
  });

  // Attach a MutationObserver to each counter that is initially present in the
  // page.
  for (const counter of initialCounters) {
    attachCounterObserver(counter);
  }

  function attachCounterObserver(counter) {
    // Skip silently if we already attached an observer for the target counter.
    if (counterObserverMap.has(counter)) {
      return;
    }

    // Remove the hide class in case it's already there (not sure we need it
    // but it's cheap).
    counter.classList.remove(counterHideClass);

    // Set-up the MutationObserver
    const observer = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        // Because we only observe for changes of the "class" attribute we don't
        // need to further filter the mutations types here as we should only
        // receive those we are looking for.
        // Remove the hide class only if it's there. We need this check
        // otherwise we would keep mutating the DOM and trigger an infinite
        // loop.
        if (mutation.target.classList.contains(counterHideClass)) {
          mutation.target.classList.remove(counterHideClass);
        }
      }
    });
    // Only observe for changes on the "class" attribute of the counter element.
    observer.observe(counter, {
      attributes: true,
      attributeFilter: ['class'],
    });

    // Store the observer's reference so we know later that we already set it up
    // and we can access it for removal.
    counterObserverMap.set(counter, observer);
  }

  function detachCounterObserver(counter) {
    // Skip silently if we can't find the target.
    if (!counterObserverMap.has(counter)) {
      return;
    }

    // Remove the reference to free-up memory.
    counterObserverMap.get(counter).disconnect();
    counterObserverMap.delete(counter);
  }
})();
