// ==UserScript==
// @name         Warn on github
// @namespace    http://tampermonkey.net/
// @updateURL    https://raw.githubusercontent.com/Spendesk/tampermonkey-scripts/master/scripts/warn-on-github.js
// @downloadURL  https://raw.githubusercontent.com/Spendesk/tampermonkey-scripts/master/scripts/warn-on-github.js
// @version      0.4
// @description  try to take over the world!
// @author       Spendesk
// @match        *github.com/Spendesk/*/pull/*
// @grant        none
// @icon         https://www.spendesk.com/favicon-32x32.png
// ==/UserScript==

const MERGING_TYPES = {
  SQUASHING: "is-squashing",
  MERGING: "is-merging",
  REBASING: "is-rebasing"
};

const RELEASE_TITLE_REGEX = /bump \d+\.\d+\.\d+/i;

const DEFAULT_BACKGROUND = "";
const ALERT_BACKGROUND = "#ef9a9a";
const ALERT_COLOR = "#b71c1c";

const ERROR_DIV_CLASS = "custom-error-div";

function insertAlertDivAfter(referenceNode, content) {
  const newP = document.createElement("p");
  newP.classList = "alt-merge-options";
  newP.style.color = ALERT_COLOR;
  newP.style.fontWeight = "bold";
  newP.innerText = content;

  const newDiv = document.createElement("div");
  newDiv.classList = ERROR_DIV_CLASS;
  newDiv.style.textAlign = "right";
  newDiv.appendChild(newP);

  referenceNode.parentNode.insertBefore(newDiv, referenceNode.nextSibling);
}

function removeElementFromDom(element) {
  element.parentNode.removeChild(element);
}

function getBaseElement() {
  return document.querySelector(
    ".commit-ref.css-truncate.user-select-contain.expandable.base-ref"
  );
}
function getHeadElement() {
  return document.querySelector(
    ".commit-ref.css-truncate.user-select-contain.expandable.head-ref"
  );
}
function getIssueTitleElement() {
  return document.querySelector(".js-issue-title");
}

function getMergePrElement() {
  return document.querySelector(
    ".merge-pr.js-merge-pr.js-details-container.Details"
  );
}

function getMergeMessageElement() {
  return document.querySelector(".merge-message");
}

function hasClass(element, className) {
  const elementClasses = element.classList;
  return elementClasses.contains(className);
}

function getMergeStatus() {
  const mergePrElement = getMergePrElement();
  for (const className of Object.values(MERGING_TYPES)) {
    if (hasClass(mergePrElement, className)) {
      return className;
    }
  }
}

function isPullRequest() {
  const baseElement = getBaseElement();
  const headElement = getHeadElement();
  return baseElement && headElement;
}

function isWrongBaseBranch() {
  const issueTitleElement = getIssueTitleElement();
  const isBumpPr = issueTitleElement.innerText
    .trim()
    .match(RELEASE_TITLE_REGEX);

  const isHeadHotfix = getHeadElement()
    .innerText.toLowerCase()
    .includes("hotfix");
  const isBaseMaster = getBaseElement().innerText === "master";

  const shouldBeMergedIntoMaster = isBumpPr || isHeadHotfix;
  if (!shouldBeMergedIntoMaster) {
    return false;
  }

  return !isBaseMaster;
}

function isWrongMergingTypeWithMaster() {
  const baseElement = getBaseElement();
  const headElement = getHeadElement();

  const isMergingIntoMaster = baseElement.innerText === "master";
  const isMergingFromMaster = headElement.innerText === "master";

  if (!isMergingIntoMaster && !isMergingFromMaster) {
    return false;
  }

  return getMergeStatus() !== MERGING_TYPES.MERGING;
}

function isWrongMergingTypeWithStaging() {
  const baseElement = getBaseElement();
  const headElement = getHeadElement();

  const isMergingIntoMaster = baseElement.innerText === "master";
  const isMergingFromMaster = headElement.innerText === "master";

  if (isMergingIntoMaster || isMergingFromMaster) {
    return false;
  }

  return getMergeStatus() === MERGING_TYPES.MERGING;
}

function resetMergeElementInfo() {
  const mergeMessageElement = getMergeMessageElement();
  mergeMessageElement.style.background = DEFAULT_BACKGROUND;

  const errorDivElement = mergeMessageElement.querySelector(
    `.${ERROR_DIV_CLASS}`
  );
  if (errorDivElement) {
    removeElementFromDom(errorDivElement);
  }
}

function updateMergeElementInfo(message) {
  resetMergeElementInfo();

  const mergeMessageElement = getMergeMessageElement();
  mergeMessageElement.style.background = ALERT_BACKGROUND;

  const altMergeOptionsElement = mergeMessageElement.querySelector(
    ".alt-merge-options.text-small"
  );
  insertAlertDivAfter(altMergeOptionsElement, message);
}

function addMessageIfError() {
  resetMergeElementInfo();

  if (isWrongBaseBranch()) {
    updateMergeElementInfo("You might want MASTER as a base branch");
    return;
  }

  if (isWrongMergingTypeWithMaster()) {
    updateMergeElementInfo(
      "If you are merging from or into MASTER, you should create a merge commit"
    );
    return;
  }

  if (isWrongMergingTypeWithStaging()) {
    updateMergeElementInfo(
      "If you are not merging from or into MASTER, you should use rebase or squash"
    );
    return;
  }
}

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function repeatAddMessageIfError() {
  addMessageIfError();
  await wait(500);
  repeatAddMessageIfError();
}

(function() {
  if (!isPullRequest()) return;
  repeatAddMessageIfError();
})();
