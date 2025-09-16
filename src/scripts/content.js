// Content script for SnapStory Downloader
console.log("SnapStory Downloader: Content script loaded");

class SnapStoryDownloader {
  constructor() {
    this.mediaElements = new Set();
    this.observer = null;
    this.init();
  }

  init() {
    // Wait for page to load
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () =>
        this.startObserving()
      );
    } else {
      this.startObserving();
    }
  }

  startObserving() {
    // Initial scan
    this.scanForMedia();

    // Set up mutation observer to catch dynamically loaded content
    this.observer = new MutationObserver((mutations) => {
      let shouldScan = false;
      mutations.forEach((mutation) => {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          shouldScan = true;
        }
      });
      if (shouldScan) {
        this.scanForMedia();
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  scanForMedia() {
    // Look for video elements
    const videos = document.querySelectorAll("video");
    videos.forEach((video) => {
      if (video.src && !this.mediaElements.has(video.src)) {
        this.mediaElements.add(video.src);
        console.log("Found video:", video.src);
      }
    });

    // Look for image elements that might be stories
    const images = document.querySelectorAll(
      'img[src*="snap"], img[src*="story"], img[src*="media"]'
    );
    images.forEach((img) => {
      if (img.src && !this.mediaElements.has(img.src)) {
        this.mediaElements.add(img.src);
        console.log("Found image:", img.src);
      }
    });

    // Look for background images in style attributes
    const elementsWithBg = document.querySelectorAll(
      '[style*="background-image"]'
    );
    elementsWithBg.forEach((el) => {
      const style = el.style.backgroundImage;
      const urlMatch = style.match(/url\(['"]?(.*?)['"]?\)/);
      if (urlMatch && urlMatch[1] && !this.mediaElements.has(urlMatch[1])) {
        this.mediaElements.add(urlMatch[1]);
        console.log("Found background image:", urlMatch[1]);
      }
    });

    // Update badge with count
    this.updateBadge();
  }

  updateBadge() {
    browser.runtime.sendMessage({
      action: "updateBadge",
      count: this.mediaElements.size,
    });
  }

  getMediaElements() {
    return Array.from(this.mediaElements).map((src) => {
      const isVideo =
        src.includes(".mp4") ||
        src.includes("video") ||
        document.querySelector(`video[src="${src}"]`);
      return {
        url: src,
        type: isVideo ? "video" : "image",
        filename: this.generateFilename(src, isVideo),
      };
    });
  }

  generateFilename(url, isVideo) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const extension = isVideo ? "mp4" : "jpg";
    const urlParts = url.split("/");
    const lastPart = urlParts[urlParts.length - 1];

    // Try to extract meaningful name from URL
    if (lastPart && lastPart.includes(".")) {
      return `snapstory_${timestamp}_${lastPart}`;
    }

    return `snapstory_${timestamp}.${extension}`;
  }

  downloadMedia(mediaItem) {
    return new Promise((resolve, reject) => {
      console.log("SnapStory: Attempting to download:", mediaItem);

      if (!mediaItem || !mediaItem.url) {
        const error = "Invalid media item - no URL found";
        console.error("SnapStory:", error);
        reject(new Error(error));
        return;
      }

      browser.runtime
        .sendMessage({
          action: "download",
          url: mediaItem.url,
          filename: mediaItem.filename,
        })
        .then((response) => {
          console.log("SnapStory: Download response:", response);
          if (response && response.success) {
            resolve(response);
          } else {
            reject(new Error(response?.error || "Unknown download error"));
          }
        })
        .catch((error) => {
          console.error("SnapStory: Download failed:", error);
          reject(error);
        });
    });
  }

  downloadAll() {
    const mediaItems = this.getMediaElements();
    const promises = mediaItems.map((item) => this.downloadMedia(item));
    return Promise.allSettled(promises);
  }
}

// Initialize the downloader
const snapStoryDownloader = new SnapStoryDownloader();

// Listen for messages from popup
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case "getMediaCount":
      sendResponse({ count: snapStoryDownloader.mediaElements.size });
      break;
    case "getMediaList":
      sendResponse({ media: snapStoryDownloader.getMediaElements() });
      break;
    case "downloadAll":
      snapStoryDownloader.downloadAll().then((results) => {
        const successful = results.filter(
          (r) => r.status === "fulfilled"
        ).length;
        const failed = results.filter((r) => r.status === "rejected").length;
        sendResponse({ successful, failed, total: results.length });
      });
      return true; // Keep message channel open for async response
    case "downloadSingle":
      snapStoryDownloader
        .downloadMedia(request.mediaItem)
        .then(() => {
          sendResponse({ success: true });
        })
        .catch((error) => {
          sendResponse({ success: false, error: error.message });
        });
      return true;
    case "refreshScan":
      snapStoryDownloader.scanForMedia();
      sendResponse({ count: snapStoryDownloader.mediaElements.size });
      break;
    default:
      sendResponse({ error: "Unknown action" });
  }
});

// Inject additional script to access page's JavaScript context if needed
function injectScript() {
  const script = document.createElement("script");
  script.src = browser.runtime.getURL("src/scripts/injected.js");
  script.addEventListener('load', function() {
    this.remove();
  });
  (document.head || document.documentElement).appendChild(script);
}

// Inject script after a delay to ensure Snapchat's scripts have loaded
setTimeout(injectScript, 2000);
