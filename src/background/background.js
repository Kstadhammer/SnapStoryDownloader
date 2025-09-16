// Background script for SnapStory Downloader
console.log("SnapStory Downloader: Background script loaded");

// Handle extension installation
browser.runtime.onInstalled.addListener((details) => {
  console.log("Extension installed:", details.reason);

  if (details.reason === "install") {
    // Set default settings
    browser.storage.local.set({
      autoDownload: false,
      downloadPath: "SnapStory Downloads",
      maxConcurrentDownloads: 3,
    });
  }
});

// Handle messages from content scripts and popup
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Background received message:", request);

  switch (request.action) {
    case "updateBadge":
      updateBadge(sender.tab.id, request.count);
      sendResponse({ success: true });
      break;

    case "download":
      handleDownload(request.url, request.filename)
        .then((downloadId) => sendResponse({ success: true, downloadId }))
        .catch((error) =>
          sendResponse({ success: false, error: error.message })
        );
      return true; // Keep message channel open for async response

    case "getSettings":
      browser.storage.local
        .get(["autoDownload", "downloadPath", "maxConcurrentDownloads"])
        .then((settings) => {
          sendResponse({ settings });
        });
      return true;

    case "saveSettings":
      browser.storage.local
        .set(request.settings)
        .then(() => sendResponse({ success: true }))
        .catch((error) =>
          sendResponse({ success: false, error: error.message })
        );
      return true;

    default:
      sendResponse({ error: "Unknown action" });
  }
});

// Update extension badge
function updateBadge(tabId, count) {
  if (count > 0) {
    browser.browserAction.setBadgeText({
      text: count.toString(),
      tabId: tabId,
    });
    browser.browserAction.setBadgeBackgroundColor({
      color: "#FF6B35",
      tabId: tabId,
    });
  } else {
    browser.browserAction.setBadgeText({
      text: "",
      tabId: tabId,
    });
  }
}

// Handle file downloads
async function handleDownload(url, filename) {
  try {
    console.log("SnapStory Background: Download request received", {
      url,
      filename,
    });

    // Validate inputs
    if (!url) {
      throw new Error("No URL provided for download");
    }
    if (!filename) {
      throw new Error("No filename provided for download");
    }

    // Check if URL is accessible
    if (
      !url.startsWith("http://") &&
      !url.startsWith("https://") &&
      !url.startsWith("data:") &&
      !url.startsWith("blob:")
    ) {
      throw new Error(`Invalid URL format: ${url}`);
    }

    // Special handling for data URLs
    if (url.startsWith("data:")) {
      console.log("SnapStory Background: Processing data URL");

      // Check data URL size (Firefox has limits)
      if (url.length > 2 * 1024 * 1024) {
        // 2MB limit
        console.warn(
          "SnapStory Background: Data URL is very large, download might fail"
        );
      }

      // Ensure proper file extension based on data type
      const dataTypeMatch = url.match(/data:([^;]+)/);
      if (dataTypeMatch) {
        const mimeType = dataTypeMatch[1];
        console.log("SnapStory Background: Data URL mime type:", mimeType);

        // Adjust filename extension if needed
        if (mimeType.includes("webp") && !filename.includes(".webp")) {
          filename = filename.replace(/\.[^.]+$/, ".webp");
        } else if (mimeType.includes("jpeg") && !filename.includes(".jpg")) {
          filename = filename.replace(/\.[^.]+$/, ".jpg");
        } else if (mimeType.includes("png") && !filename.includes(".png")) {
          filename = filename.replace(/\.[^.]+$/, ".png");
        } else if (mimeType.includes("mp4") && !filename.includes(".mp4")) {
          filename = filename.replace(/\.[^.]+$/, ".mp4");
        }

        console.log("SnapStory Background: Adjusted filename:", filename);
      }
    }

    // Final filename cleanup to ensure no illegal characters
    filename = filename
      .replace(/[<>:"/\\|?*]/g, "_") // Replace illegal characters
      .replace(/[&=]/g, "_") // Replace URL parameter characters
      .replace(/_{2,}/g, "_") // Replace multiple underscores with single
      .substring(0, 100); // Limit total length

    console.log("SnapStory Background: Final cleaned filename:", filename);

    // Get user settings
    const settings = await browser.storage.local.get([
      "downloadPath",
      "maxConcurrentDownloads",
    ]);

    const downloadPath = settings.downloadPath || "SnapStory Downloads";

    // Create download options
    const downloadOptions = {
      url: url,
      filename: `${downloadPath}/${filename}`,
      saveAs: false, // Don't show save dialog
      conflictAction: "uniquify", // Add number if file exists
    };

    console.log(
      "SnapStory Background: Starting download with options:",
      downloadOptions
    );

    // Start the download
    const downloadId = await browser.downloads.download(downloadOptions);

    console.log(
      "SnapStory Background: Download started successfully with ID:",
      downloadId
    );
    return downloadId;
  } catch (error) {
    console.error("SnapStory Background: Download failed:", error);
    console.error("SnapStory Background: Error details:", {
      message: error.message,
      stack: error.stack,
      url: url,
      filename: filename,
    });
    throw error;
  }
}

// Monitor download progress
browser.downloads.onChanged.addListener((downloadDelta) => {
  if (downloadDelta.state && downloadDelta.state.current === "complete") {
    console.log("Download completed:", downloadDelta.id);

    // Optionally notify user of completion
    browser.notifications.create({
      type: "basic",
      iconUrl: "icons/icon-48.png",
      title: "SnapStory Download Complete",
      message: "Your Snapchat story has been downloaded successfully!",
    });
  } else if (
    downloadDelta.state &&
    downloadDelta.state.current === "interrupted"
  ) {
    console.error("Download interrupted:", downloadDelta.id);

    browser.notifications.create({
      type: "basic",
      iconUrl: "icons/icon-48.png",
      title: "SnapStory Download Failed",
      message: "There was an error downloading the story. Please try again.",
    });
  }
});

// Handle tab updates to reset badge when leaving Snapchat
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url && !changeInfo.url.includes("snapchat.com")) {
    updateBadge(tabId, 0);
  }
});

// Clean up when tabs are closed
browser.tabs.onRemoved.addListener((tabId, removeInfo) => {
  // Clean up any tab-specific data if needed
  console.log("Tab closed:", tabId);
});
