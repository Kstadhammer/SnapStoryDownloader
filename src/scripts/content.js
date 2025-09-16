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
    console.log("SnapStory: Starting media scan...");

    // Look for ALL video elements (not just with src)
    const videos = document.querySelectorAll("video");
    videos.forEach((video) => {
      // Check src attribute
      if (video.src && !this.mediaElements.has(video.src)) {
        this.mediaElements.add(video.src);
        console.log("Found video src:", video.src);
      }

      // Check source elements within video
      const sources = video.querySelectorAll("source");
      sources.forEach((source) => {
        if (source.src && !this.mediaElements.has(source.src)) {
          this.mediaElements.add(source.src);
          console.log("Found video source:", source.src);
        }
      });

      // Check currentSrc property
      if (video.currentSrc && !this.mediaElements.has(video.currentSrc)) {
        this.mediaElements.add(video.currentSrc);
        console.log("Found video currentSrc:", video.currentSrc);
      }
    });

    // Look for ALL images (broader search)
    const images = document.querySelectorAll("img");
    images.forEach((img) => {
      if (img.src && img.src.length > 50 && !this.mediaElements.has(img.src)) {
        // Only include images with longer URLs (likely media, not icons)
        this.mediaElements.add(img.src);
        console.log("Found image:", img.src.substring(0, 100) + "...");
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
        console.log(
          "Found background image:",
          urlMatch[1].substring(0, 100) + "..."
        );
      }
    });

    // Look for canvas elements (Snapchat might use canvas)
    const canvases = document.querySelectorAll("canvas");
    canvases.forEach((canvas, index) => {
      if (canvas.width > 100 && canvas.height > 100) {
        try {
          const dataUrl = canvas.toDataURL("image/png");
          const canvasId = `canvas_${index}_${Date.now()}`;
          if (!this.mediaElements.has(canvasId)) {
            this.mediaElements.add(dataUrl);
            console.log(
              "Found canvas content:",
              canvas.width + "x" + canvas.height
            );
          }
        } catch (e) {
          console.log("Cannot access canvas content (CORS):", e.message);
        }
      }
    });

    console.log(
      `SnapStory: Scan complete. Found ${this.mediaElements.size} media items`
    );

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
    
    // Clean up URL for filename
    let cleanName = "";
    
    if (url.startsWith("blob:") || url.startsWith("data:")) {
      // For blob/data URLs, use timestamp + type
      cleanName = `snapstory_${timestamp}`;
    } else {
      // For regular URLs, try to extract meaningful name
      const urlParts = url.split("/");
      const lastPart = urlParts[urlParts.length - 1];
      
      if (lastPart && lastPart.includes(".")) {
        // Remove URL parameters and clean illegal characters
        const cleanPart = lastPart
          .split("?")[0]  // Remove query parameters
          .split("#")[0]  // Remove fragment
          .replace(/[<>:"/\\|?*]/g, "_")  // Replace illegal characters
          .substring(0, 50);  // Limit length
        
        cleanName = `snapstory_${timestamp}_${cleanPart}`;
      } else {
        cleanName = `snapstory_${timestamp}`;
      }
    }

    // Ensure we have a valid extension
    if (!cleanName.includes(".")) {
      cleanName += `.${extension}`;
    }

    return cleanName;
  }

  async downloadMedia(mediaItem) {
    return new Promise(async (resolve, reject) => {
      console.log("SnapStory: Attempting to download:", mediaItem);

      if (!mediaItem || !mediaItem.url) {
        const error = "Invalid media item - no URL found";
        console.error("SnapStory:", error);
        reject(new Error(error));
        return;
      }

      let finalUrl = mediaItem.url;

      // Handle blob URLs by converting to data URL in content script context
      if (mediaItem.url.startsWith("blob:")) {
        try {
          console.log("SnapStory: Converting blob URL to data URL");
          const response = await fetch(mediaItem.url);
          const blob = await response.blob();

          finalUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });

          console.log("SnapStory: Successfully converted blob to data URL");
        } catch (blobError) {
          console.error("SnapStory: Failed to convert blob URL:", blobError);
          reject(new Error(`Cannot access blob URL: ${blobError.message}`));
          return;
        }
      }

      browser.runtime
        .sendMessage({
          action: "download",
          url: finalUrl,
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
  script.addEventListener("load", function () {
    this.remove();
  });
  (document.head || document.documentElement).appendChild(script);
}

// Inject script after a delay to ensure Snapchat's scripts have loaded
setTimeout(injectScript, 2000);
