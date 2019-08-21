// ==UserScript==
// @name         Replace Gmail's URL of images with their original URL
// @namespace    http://tampermonkey.net/
// @updateURL    https://raw.githubusercontent.com/Spendesk/tampermonkey-scripts/master/scripts/replace-gmail-url-of-images-with-their-original-url.js
// @downloadURL  https://raw.githubusercontent.com/Spendesk/tampermonkey-scripts/master/scripts/replace-gmail-url-of-images-with-their-original-url.js
// @version      0.1
// @description  Gmail caches images in email on their own servers and serves them via their CDN. This script rewrites the images URLs so they point to the original URL instead of the Gmail's cached copy.
// @author       Spendesk
// @match        mail.google.com/*
// @grant        none
// @icon         https://www.spendesk.com/favicon-32x32.png
// ==/UserScript==

(function() {
  'use strict';
  const REGEX = /https:\/\/.*\.googleusercontent\.com\/.*#(https?:\/\/.*)/i;

  const rewriteImageUrls = (container) => {
      // Rewrite img source on <img> tags
      Array.from(
          container.querySelectorAll('img')
      ).forEach(img => {
          const match = img.src.match(REGEX);

          if (!match) {
              return;
          }

          const [, originalURL] = match;

          img.src = originalURL;
      });

      // Rewrite img source on CSS backgrounds
      Array.from(
          container.querySelectorAll('[style]')
      ).forEach(element => {
          if (!element.style.backgroundImage && !element.style.background) {
              return;
          }

          let match;
          let fromBackground = false;
          let fromBackgroundImage = false;

          if (element.style.backgroundImage) {
              match = element.style.backgroundImage.match(REGEX);
              fromBackgroundImage = true;
          }

          if (!match) {
              match = element.style.background.match(REGEX);
              fromBackground = true;
          }

          if (!match) {
              return;
          }

          const [input, originalURL] = match;

          if (fromBackgroundImage) {
              element.style.backgroundImage = element.style.backgroundImage
                  .replace(input, originalURL);
          }

          if (fromBackground) {
              element.style.background = element.style.background
                  .replace(input, originalURL);
          }
      });
  };

  setInterval(() => {
      const emailContainer = document.querySelector('.ii.gt.adO');

      if (emailContainer) {
          rewriteImageUrls(emailContainer);
      }
  }, 1000);
})();
