// ==UserScript==
// @name         Pin tabs on forest
// @namespace    https://spendesk.com
// @updateURL    https://raw.githubusercontent.com/Spendesk/tampermonkey-scripts/master/scripts/pin-tab-forest.js
// @downloadURL  https://raw.githubusercontent.com/Spendesk/tampermonkey-scripts/master/scripts/pin-tab-forest.js
// @version      0.1
// @description  Add ability to pin tabs on forest in the sidebar
// @author       Spendesk
// @match        *://app.forestadmin.com/*
// @icon         https://www.spendesk.com/favicon-32x32.png
// @grant GM_setValue
// @grant GM_getValue
// @grant GM_addStyle

// ==/UserScript==

GM_addStyle('.spendesk-not-pinned, .spendesk-pinned { color: gold !important; }');
GM_addStyle(
  '.spendesk-not-pinned:hover, .spendesk-pinned:hover { color: goldenrod !important; }'
);
GM_addStyle(
  '.spendesk-pin-button { background: transparent; border: none; font-size: 8px; padding: 3px; position: absolute; right: 2px; top: 12px; }'
);
GM_addStyle('.spendesk-pin-button:hover { cursor: pointer; }');

const DATA_ATTRIBUTE = 'data-pinned';
const NOT_PINNED_ICON =
  '<i class="fa fa-star-o fa-2x spendesk-not-pinned" role="button"></i>';
const PINNED_ICON =
  '<i class="fa fa-star fa-2x spendesk-pinned" role="button"></i>';

const wait = (timeout) =>
  new Promise((resolve) => {
    setTimeout(() => resolve(), timeout);
  });

const getSidebar = () => document.querySelector('.l-sidebar');

const getSections = (sidebar) =>
  Array.from(sidebar.querySelectorAll('.c-side-menu__list>.ember-view'));

const getSectionName = (section) =>
  section.querySelector('.c-side-menu-item__name').textContent.trim();

const getIcon = (isPinned) => (isPinned ? PINNED_ICON : NOT_PINNED_ICON);

const getIsButtonCurrentlyPinned = (button) =>
  button.getAttribute(DATA_ATTRIBUTE) === '1';

const appendIcon = (button, isPinned) => {
  const icon = getIcon(isPinned);
  button.innerHTML = icon;
  button.setAttribute(DATA_ATTRIBUTE, isPinned ? '1' : '0');
};

const sortSections = () => {
  const pinnedSections = [];
  const unpinnedSections = [];
  const sidebar = getSidebar();
  const sections = getSections(sidebar);

  sections.forEach((section) => {
    const button = section.querySelector('button');
    const hasBeenPinned = getIsButtonCurrentlyPinned(button);
    if (hasBeenPinned) {
      pinnedSections.push(section);
    } else {
      unpinnedSections.push(section);
    }
  });

  [...pinnedSections, ...unpinnedSections].forEach((section) =>
    sidebar.querySelector('.c-side-menu__list').appendChild(section)
  );
};

const togglePin = (event) => {
  const button = event.currentTarget;
  const section = button.parentElement;
  const hasBeenPinned = !getIsButtonCurrentlyPinned(button);

  appendIcon(button, hasBeenPinned);

  const name = getSectionName(section);
  GM_setValue(name, hasBeenPinned);
  sortSections();
};

const insertPinIcon = async (section) => {
  const button = document.createElement('button');
  section.style.position = 'relative';
  button.type = 'button';
  button.classList.add('spendesk-pin-button');
  button.addEventListener('click', togglePin);

  const name = getSectionName(section);
  const isPinned = await GM_getValue(name);

  appendIcon(button, isPinned);

  section.appendChild(button);
};

const addPinIcons = async (sidebar) => {
  const sections = getSections(sidebar);
  for (const section of sections) {
    await insertPinIcon(section);
  }
  sortSections();
};

const main = async () => {
  const sidebar = getSidebar();
  if (sidebar) {
    return addPinIcons(sidebar);
  }
  await wait(100);
  main();
};

(async function() {
  'use strict';
  await main();
})();
