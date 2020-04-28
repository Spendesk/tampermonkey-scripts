// ==UserScript==
// @name         Show Trello cards count
// @namespace    http://tampermonkey.net/
// @updateURL    https://raw.githubusercontent.com/Spendesk/tampermonkey-scripts/master/scripts/show-trello-cards-count.js
// @downloadURL  https://raw.githubusercontent.com/Spendesk/tampermonkey-scripts/master/scripts/show-trello-cards-count.js
// @version      0.1
// @description  Trello keeps counters of cards per column but its hidden unless you have an active filter. This script makes these counters always visible.
// @author       Spendesk
// @match        https://trello.com/b/*
// @grant        none
// @icon         https://www.spendesk.com/favicon-32x32.png
// ==/UserScript==

(async function () {
  'use strict';

  const counterSelector = '.js-num-cards';
  const counterHideClass = 'hide';

  // Wait for counter element to be in the DOM by querying the DOM every second
  while (!document.querySelectorAll(counterSelector).length > 0) {
    await new Promise((r) => setTimeout(r, 1000));
  }

  const counters = document.querySelectorAll(counterSelector);

  const observerCallback = (mutationsList, observer) => {
    for (const mutation of mutationsList) {
      // Because we only observe for changes of the "class" attribute we don't
      // need to further filter the mutations types here as we should only
      // receive those we are looking for.
      // Remove the hide class only if it's there. We need this check otherwise
      // we would keep mutating the DOM and trigger an infinite loop.
      if (mutation.target.classList.contains(counterHideClass)) {
        mutation.target.classList.remove(counterHideClass);
      }
    }
  };

  for (const counter of counters) {
    // Remove the hide class in case it's already there (not sure we need it but it's cheap)
    counter.classList.remove(counterHideClass);

    const observer = new MutationObserver(observerCallback);
    // Only observe for changes on the "class" attribute of the counter element
    const options = {
      attributes: true,
      attributeFilter: ['class'],
    };

    observer.observe(counter, options);
  }
})();
