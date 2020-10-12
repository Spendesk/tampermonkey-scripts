// ==UserScript==
// @name         Add filter on forest
// @namespace    https://spendesk.com
// @updateURL    https://raw.githubusercontent.com/Spendesk/tampermonkey-scripts/master/scripts/filter-on-forest.js
// @downloadURL  https://raw.githubusercontent.com/Spendesk/tampermonkey-scripts/master/scripts/filter-on-forest.js
// @version      0.1
// @description  Add a filter on forest for the sidebar
// @author       Spendesk
// @match        *://app.forestadmin.com/*
// @icon         https://www.spendesk.com/favicon-32x32.png

// ==/UserScript==

const wait = (timeout) =>
  new Promise((resolve, reject) => {
    setTimeout(() => resolve(), timeout);
  });

const filter = () => {
  const filterSearchBar = document.querySelector('#filterSearchBar');
  const searchTerm = filterSearchBar.value.toLowerCase();

  const sideMenuItems = document.querySelectorAll('.c-side-menu-item');
  for (const sideMenuItem of sideMenuItems) {
    const sideMenuItemName = sideMenuItem.innerText.toLowerCase();
    const sideMenuDiv = sideMenuItem.parentElement;
    if (sideMenuItemName.includes(searchTerm)) {
      sideMenuDiv.style.display = 'block';
    } else {
      sideMenuDiv.style.display = 'none';
    }
  }
};

const addSidebarSearch = (sidebar) => {
  const htmlSearchbar = `
<div class='c-beta-header__search-bar c-beta-search-bar ember-view' style='margin-top: 5px; margin-bottom: 5px;'>
<i class='material-icons c-beta-search-bar__icon' role='button' data-ember-action=''>search</i>
<form class='c-beta-search-bar__form' data-ember-action=''>
<input autocomplete='off' placeholder='Filter collection' class='c-beta-search-bar__input ember-text-field ember-view' type='text' id='filterSearchBar'>
</form>
</div>`;

  const domSearchBarDiv = document.createElement('div');
  domSearchBarDiv.innerHTML = htmlSearchbar;
  sidebar.prepend(domSearchBarDiv);
  const domSearchBar = document.querySelector('#filterSearchBar');
  domSearchBar.addEventListener('keyup', filter);

  domSearchBar.focus();
};

const main = async () => {
  const sidebar = document.querySelector('.l-sidebar');
  if (sidebar) {
    return addSidebarSearch(sidebar);
  }
  await wait(100);
  main();
};

(async function() {
  'use strict';
  await main();
})();
