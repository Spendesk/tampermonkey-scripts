// ==UserScript==
// @name         Pin tabs on forest
// @namespace    https://spendesk.com
// @updateURL    https://raw.githubusercontent.com/Spendesk/tampermonkey-scripts/master/scripts/pin-tabs-on-forest.js
// @downloadURL  https://raw.githubusercontent.com/Spendesk/tampermonkey-scripts/master/scripts/pin-tabs-on-forest.js
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

const getIsSectionPinned = (section) => {
  const name = getSectionName(section);
  return GM_getValue(name, false);
};

const setSectionPin = (section, isPinned) => {
  const name = getSectionName(section);
  return GM_setValue(name, isPinned);
};

const appendIcon = (button, isPinned) => {
  const icon = getIcon(isPinned);
  button.innerHTML = icon;
};

let originalSections;
const sortSections = async () => {
  const pinnedSections = [];
  const unpinnedSections = [];
  const sidebar = getSidebar();

  if (!originalSections) {
    originalSections = getSections(sidebar);
  }

  const sections = originalSections;

  for (const section of sections) {
    const isSectionPinned = await getIsSectionPinned(section);
    if (isSectionPinned) {
      pinnedSections.push(section);
    } else {
      unpinnedSections.push(section);
    }
  }

  [...pinnedSections, ...unpinnedSections].forEach((section) =>
    sidebar.querySelector('.c-side-menu__list').appendChild(section)
  );
};

const handleTogglePin = async (event) => {
  const button = event.currentTarget;
  const section = button.parentElement;
  const isSectionPinned = await getIsSectionPinned(section);

  await setSectionPin(section, !isSectionPinned)

  appendIcon(button, !isSectionPinned);

  sortSections();
};

const insertPinIcon = async (section) => {
  const button = document.createElement('button');
  section.style.position = 'relative';
  button.type = 'button';
  button.classList.add('spendesk-pin-button');
  button.addEventListener('click', handleTogglePin);

  const isSectionPinned = await getIsSectionPinned(section);

  appendIcon(button, isSectionPinned);

  section.appendChild(button);
};

const addPinIcons = async (sidebar) => {
  const sections = getSections(sidebar);
  for (const section of sections) {
    await insertPinIcon(section);
  }
  await sortSections();
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
