// ==UserScript==
// @name         Autofill for Spendesk login
// @namespace    https://spendesk.com
// @updateURL    https://raw.githubusercontent.com/Spendesk/tampermonkey-scripts/master/scripts/autofill-username-on-website.js
// @downloadURL  https://raw.githubusercontent.com/Spendesk/tampermonkey-scripts/master/scripts/autofill-username-on-website.js
// @version      0.1
// @description  Autofill username and password field for spendesk login
// @author       Spendesk
// @match        *://staging.spendesk.com/auth/login*
// @match        *://dev.spendesk.com/auth/login*
// @match        *://*.spendesk.spx/auth/login*
// @icon         https://www.spendesk.com/favicon-32x32.png
// @grant GM_setValue
// @grant GM_getValue

// ==/UserScript==

const findReactFromDOMNode = function (dom) {
  let key = Object.keys(dom).find((key) =>
    key.startsWith("__reactInternalInstance$")
  );
  let internalInstance = dom[key];
  if (internalInstance == null) return null;

  if (internalInstance.return) {
    // react 16+
    return internalInstance._debugOwner
      ? internalInstance._debugOwner.stateNode
      : internalInstance.return.stateNode;
  } else {
    // react <16
    return internalInstance._currentElement._owner._instance;
  }
};

const prefill = (name, defaultMatch, password) => {
  const mailInput = document.querySelector('input[placeholder="Email"]');
  const form = document.querySelector(".LoginPasswordForm");

  let automatch = "";
  if (location.host === "staging.spendesk.com") {
    automatch = "staging";
  } else {
    automatch = defaultMatch;
  }

  findReactFromDOMNode(form).setState({
    email: `${name}+${automatch}@spendesk.com`,
    password,
  });

  mailInput.setSelectionRange(
    name.length + 1,
    name.length + 1 + automatch.length
  );

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

    if (valuesAlreadySet) prefill(name, defaultMatch, password);
  }, 100);
})();
