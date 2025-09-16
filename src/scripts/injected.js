// Injected script that runs in the page context
// This can access Snapchat's JavaScript APIs and variables

(function () {
  "use strict";

  console.log("SnapStory Downloader: Injected script loaded");

  // Store original XMLHttpRequest and fetch to intercept network requests
  const originalXHR = window.XMLHttpRequest;
  const originalFetch = window.fetch;

  // Intercept XMLHttpRequest to catch media URLs
  window.XMLHttpRequest = function () {
    const xhr = new originalXHR();
    const originalOpen = xhr.open;

    xhr.open = function (method, url, ...args) {
      // Check if this is a media request
      if (
        url &&
        (url.includes("media") ||
          url.includes("story") ||
          url.includes(".mp4") ||
          url.includes(".jpg") ||
          url.includes(".png"))
      ) {
        console.log("Intercepted XHR media request:", url);

        // Send to content script
        window.postMessage(
          {
            type: "SNAPSTORY_MEDIA_URL",
            url: url,
            method: method,
          },
          "*"
        );
      }

      return originalOpen.apply(this, [method, url, ...args]);
    };

    return xhr;
  };

  // Intercept fetch requests
  window.fetch = function (input, init) {
    const url = typeof input === "string" ? input : input.url;

    if (
      url &&
      (url.includes("media") ||
        url.includes("story") ||
        url.includes(".mp4") ||
        url.includes(".jpg") ||
        url.includes(".png"))
    ) {
      console.log("Intercepted fetch media request:", url);

      window.postMessage(
        {
          type: "SNAPSTORY_MEDIA_URL",
          url: url,
          method: "GET",
        },
        "*"
      );
    }

    return originalFetch.apply(this, arguments);
  };

  // Listen for story navigation events
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      console.log("Page navigation detected:", url);

      // Trigger a rescan after navigation
      setTimeout(() => {
        window.postMessage(
          {
            type: "SNAPSTORY_PAGE_CHANGE",
            url: url,
          },
          "*"
        );
      }, 1000);
    }
  }).observe(document, { subtree: true, childList: true });

  // Try to hook into Snapchat's internal media loading
  function hookIntoSnapchatAPIs() {
    // Look for common patterns in Snapchat's code
    if (window.webpackChunkName || window.__LOADABLE_LOADED_CHUNKS__) {
      console.log("Detected webpack chunks, attempting to hook media APIs");

      // This is a placeholder - actual implementation would require
      // reverse engineering Snapchat's current API structure
      try {
        // Example of how we might hook into their media loading
        const originalCreateElement = document.createElement;
        document.createElement = function (tagName) {
          const element = originalCreateElement.call(this, tagName);

          if (
            tagName.toLowerCase() === "video" ||
            tagName.toLowerCase() === "img"
          ) {
            // Override src setter to catch when media is loaded
            const originalSrcDescriptor = Object.getOwnPropertyDescriptor(
              element.__proto__,
              "src"
            );
            if (originalSrcDescriptor && originalSrcDescriptor.set) {
              Object.defineProperty(element, "src", {
                get: originalSrcDescriptor.get,
                set: function (value) {
                  if (
                    value &&
                    (value.includes("media") || value.includes("story"))
                  ) {
                    console.log("Media element src set:", value);
                    window.postMessage(
                      {
                        type: "SNAPSTORY_MEDIA_URL",
                        url: value,
                        element: tagName,
                      },
                      "*"
                    );
                  }
                  return originalSrcDescriptor.set.call(this, value);
                },
              });
            }
          }

          return element;
        };
      } catch (e) {
        console.log("Could not hook createElement:", e);
      }
    }
  }

  // Try to hook APIs after page loads
  setTimeout(hookIntoSnapchatAPIs, 3000);
})();
