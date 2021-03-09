// ==UserScript==
// @name         Autofill for Spendesk login
// @namespace    https://spendesk.com
// @updateURL    https://raw.githubusercontent.com/Spendesk/tampermonkey-scripts/master/scripts/autofill-username-on-website.js
// @downloadURL  https://raw.githubusercontent.com/Spendesk/tampermonkey-scripts/master/scripts/autofill-username-on-website.js
// @version      0.3
// @description  Autofill username and password field for spendesk login
// @author       Spendesk
// @match        *://staging.spendesk.com/auth/login*
// @match        *://dev.spendesk.com/auth/login*
// @match        *://*.spendesk.spx/auth/login*
// @match        *://*.local.app.spendesk.dev/auth/login*
// @match        *://*.local.spendesk.dev/auth/login*
// @icon         https://www.spendesk.com/favicon-32x32.png
// @grant GM_setValue
// @grant GM_getValue

// ==/UserScript==

const findReactFromDOMNode = function (dom, nbTries = 0) {
  console.log({ nbTriesFindNode: nbTries });
  if (nbTries > 5) return;
  let key = Object.keys(dom).find((key) =>
    key.startsWith("__reactInternalInstance$")
  );
  let internalInstance = dom[key];
  if (internalInstance == null) {
    return findReactFromDOMNode(dom, nbTries++);
  }

  let domNode;
  if (internalInstance.return) {
    // react 16+
    domNode = internalInstance._debugOwner
      ? internalInstance._debugOwner.stateNode
      : internalInstance.return.stateNode;
  } else {
    // react <16
    domNode = internalInstance._currentElement._owner._instance;
  }
  console.log({ domNode });
  return domNode ?? findReactFromDOMNode(dom, nbTries++);
};

const asyncFindDomElement = async (selector, nbTries = 0) => {
  console.log("trying to find element", { selector, nbTries });
  const element = document.querySelector(selector);
  if (!element) {
    await wait(500);
    return asyncFindDomElement(selector, nbTries++);
  }
  return element;
};

const prefill = async (name, defaultMatch, password) => {
  console.log("trying to prefill");
  const mailInput = await asyncFindDomElement('input[placeholder="Email"]');
  console.log("mailInput found");
  const form = await asyncFindDomElement(".LoginPasswordForm");
  console.log("form found");

  let automatch = "";
  if (location.host === "staging.spendesk.com") {
    automatch = "staging";
  } else {
    automatch = defaultMatch;
  }

  console.log("trying to find reactFromDOMNode");
  const formDomNode = findReactFromDOMNode(form);
  console.log({ formDomNode, name, automatch, password });
  formDomNode.setState({
    email: `${name}+${automatch}@spendesk.com`,
    password,
  });

  console.log("selecting range");
  mailInput.setSelectionRange(
    name.length + 1,
    name.length + 1 + automatch.length
  );

  console.log("focusing");
  mailInput.focus();
};

const wait = (timeout) =>
  new Promise((resolve, reject) => {
    setTimeout(() => resolve(), timeout);
  });

const handleInfo = async () => {
  const name = prompt(
    'Please enter the first part of your spendesk email.\nTaking "bastien+accountowner@spendesk.com" as an example, please enter "bastien"'
  );
  const defaultMatch = prompt(
    'Please enter the default account you want to log with.\nTaking "bastien+accountowner@spendesk.com" as an example, please enter "accountowner"'
  );
  const password = prompt("Please enter the password you want to log with.");

  await Promise.all([
    GM_setValue("name", name),
    GM_setValue("defaultMatch", defaultMatch),
    GM_setValue("password", password),
  ]);
  alert(
    `Great! Your default account was saved as ${name}+${defaultMatch}@spendesk.com with the password ${password}!`
  );
  prefill(name, defaultMatch, password);
};

const addButton = async (valuesAlreadySet, nbTries = 0) => {
  if (nbTries > 5) return false;
  console.log({ nbTries });
  try {
    const layout = document.querySelector("#layout-login");
    if (!layout) {
      await wait(500);
      return addButton(valuesAlreadySet, nbTries + 1);
    }

    const buttonNode = document.createElement("input");
    buttonNode.setAttribute("type", "button");
    buttonNode.setAttribute(
      "value",
      `${valuesAlreadySet ? "Update" : "Set"} login params`
    );
    layout.appendChild(buttonNode);
    buttonNode.style.position = "absolute";
    buttonNode.style.top = "15px";
    buttonNode.style.right = "150px";
    buttonNode.style.padding = "3px";
    buttonNode.style.borderRadius = "2px";
    buttonNode.style.backgroundColor = "white";
    buttonNode.style.zIndex = 1;
    buttonNode.addEventListener("click", handleInfo, false);

    return true;
  } catch (e) {
    await wait(500);
    return addButton(valuesAlreadySet, nbTries + 1);
  }
};

(async function () {
  "use strict";
  // await GM_setValue('key', 'value');

  setTimeout(async () => {
    const [name, defaultMatch, password] = await Promise.all([
      GM_getValue("name"),
      GM_getValue("defaultMatch"),
      GM_getValue("password"),
    ]);

    const valuesAlreadySet = name && defaultMatch && password;
    const buttonAdded = await addButton(valuesAlreadySet);
    if (!buttonAdded) {
      console.log("Cannot add button");
      return;
    }

    if (valuesAlreadySet) {
      await prefill(name, defaultMatch, password);
    }
  }, 100);
})();
