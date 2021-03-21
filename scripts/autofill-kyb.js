// ==UserScript==
// @name         Autofill KYB
// @namespace    https://spendesk.com
// @updateURL    https://raw.githubusercontent.com/Spendesk/tampermonkey-scripts/master/scripts/fill-kyb.js
// @downloadURL  https://raw.githubusercontent.com/Spendesk/tampermonkey-scripts/master/scripts/fill-kyb.js
// @version      0.1
// @description  Autofill KYB with Silicon Valley references
// @author       Spendesk
// @match        https://*.spendesk.dev/onboarding-v2/*
// @match        https://app.spendesk.spx/onboarding-v2/*
// @match        https://*.linc-preview.sh/onboarding-v2/*
// @icon         https://www.spendesk.com/favicon-32x32.png

// ==/UserScript==

function createButton(context, text, func) {
  const button = document.createElement("button");
  button.type = "button";
  button.innerText = text;
  button.onclick = func;
  button.setAttribute(
    "style",
    "color:white; top: 10px; right: 10px; background: red; padding: 5px 10px; position: fixed; font-size: 25px; z-index: 99999"
  );
  context.appendChild(button);
}

const fireEvent = {
  click: (element) => {
    element.dispatchEvent(
      new window.MouseEvent("mouseover", {
        bubbles: true,
        cancelable: true,
        composed: true,
      })
    );

    element.dispatchEvent(
      new window.MouseEvent("mousemove", {
        bubbles: true,
        cancelable: true,
        composed: true,
      })
    );

    element.dispatchEvent(
      new window.MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        button: 0,
        composed: true,
      })
    );
  },
  type: (element, value) => {
    const event = new window.InputEvent("input", {
      bubbles: true,
      cancelable: false,
      composed: true,
    });
    element.value = value;
    element.dispatchEvent(event);
  },
};

async function wait(time = 100) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

async function waitFor(func, timeout = 1000, interval = 100) {
  const maxTries = Math.ceil(timeout / interval);
  let res = func();
  let tries = 1;

  while ((res === null || res === undefined) && tries <= maxTries) {
    await wait(interval);
    res = func();
    tries++;
  }

  if (tries > maxTries) {
    throw new Error("Too many retries");
  }

  return res;
}

/**
 * Returns the first enabled element with the given text
 * @param {RegExp} reg
 * @param {String} elementType
 */
async function findByText(reg, elementType = "*", root = document) {
  try {
    return await waitFor(() =>
      Array.from(root.querySelectorAll(elementType)).find(
        (node) => reg.test(node.innerText) && !node.disabled
      )
    );
  } catch (err) {
    throw new Error(`Impossible to find element with text: ${reg}`);
  }
}

async function waitKYBToAppears() {
  return new Promise((resolve) => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.target.id === "app-onboarding") {
          observer.disconnect();
          resolve();
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
}

/**
 * A dummy function filling every field using
 * Silicon Valley references
 */
async function fill() {
  const fields = document.querySelectorAll("input");
  fields.forEach(async (field) => {
    switch (field.id) {
      case "iban":
        fireEvent.type(field, "FR2710096000505936325135P81");
        break;
      case "bic":
        fireEvent.type(field, "CMCIFR2AXXX");
        break;
      case "businessName":
      case "legalName":
        fireEvent.type(field, "Pied Piper");
        break;
      case "companyName":
        fireEvent.type(field, "Hooli");
        break;
      case "immatriculationNumber":
        fireEvent.type(field, "12-3456789");
        break;
      case "vatIdentification":
      case "zipcode":
        fireEvent.type(field, "12345");
        break;
      case "website":
        fireEvent.type(field, "https://piedpiper.com");
        break;
      case "registrationDate":
        fireEvent.type(field, "24/03/2005");
        break;
      case "activity":
        fireEvent.type(field, "middle-out compression company");
        break;
      case "city":
        fireEvent.type(field, "Silicon Valley");
        break;
      case "firstName":
        fireEvent.type(field, "Richard");
        break;
      case "lastName":
        fireEvent.type(field, "Hendricks");
        break;
      case "birthDate":
        fireEvent.type(field, "01/06/1988");
        break;
      case "address":
        fireEvent.type(field, "5230 Penfield Avenue");
        fireEvent.click(
          await waitFor(() => document.querySelector('[aria-selected="true"]'))
        ); // Select the first one #lazy
        break;
      case "state":
        fireEvent.type(field, "CA");
        break;
      case "shares":
        fireEvent.type(field, "40");
        break;
      case "ownerSince":
        fireEvent.type(field, "06-2014");
        break;
    }
  });

  // Civility
  const civility = document.querySelector('[name="civility"]');
  if (civility) {
    fireEvent.click(civility); // Open option
    fireEvent.click(await findByText(/Mr/i, "button")); // Select option
  }

  // Phone Number
  fireEvent.type(
    await waitFor(() => document.querySelector('[autocomplete="tel"]')),
    "0612345678"
  );
}

(function () {
  waitKYBToAppears().then(() => createButton(document.body, "FILL", fill));
})();
