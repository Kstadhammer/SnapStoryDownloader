// Popup script for SnapStory Downloader
console.log("SnapStory Downloader: Popup script loaded");

class SnapStoryPopup {
  constructor() {
    this.mediaCount = 0;
    this.mediaList = [];
    this.isListVisible = false;
    this.init();
  }

  init() {
    this.bindEvents();
    this.loadMediaCount();
    this.checkSnapchatTab();
  }

  bindEvents() {
    // Refresh button
    document.getElementById("refreshBtn").addEventListener("click", () => {
      this.refreshMedia();
    });

    // Download all button
    document.getElementById("downloadAllBtn").addEventListener("click", () => {
      this.downloadAll();
    });

    // View list button
    document.getElementById("viewListBtn").addEventListener("click", () => {
      this.toggleMediaList();
    });

    // Settings button
    document.getElementById("settingsBtn").addEventListener("click", () => {
      this.openSettings();
    });

    // Debug button (if it exists)
    const debugBtn = document.getElementById("debugBtn");
    if (debugBtn) {
      debugBtn.addEventListener("click", () => {
        this.showDebugInfo();
      });
    }

    // Status message close button
    document.getElementById("statusClose").addEventListener("click", () => {
      this.hideStatusMessage();
    });
  }

  async checkSnapchatTab() {
    try {
      const tabs = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      const currentTab = tabs[0];

      if (!currentTab.url.includes("snapchat.com")) {
        this.showStatusMessage(
          "Please navigate to Snapchat.com to use this extension",
          "warning"
        );
        document.getElementById("downloadAllBtn").disabled = true;
        document.getElementById("refreshBtn").disabled = true;
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error checking current tab:", error);
      return false;
    }
  }

  async loadMediaCount() {
    try {
      const tabs = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      const response = await browser.tabs.sendMessage(tabs[0].id, {
        action: "getMediaCount",
      });

      this.updateMediaCount(response.count || 0);
    } catch (error) {
      console.error("Error loading media count:", error);
      this.updateMediaCount(0);
    }
  }

  async refreshMedia() {
    const refreshBtn = document.getElementById("refreshBtn");
    const originalContent = refreshBtn.innerHTML;

    try {
      // Show loading state
      refreshBtn.innerHTML = '<div class="spinner"></div> Refreshing...';
      refreshBtn.disabled = true;

      const tabs = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      const response = await browser.tabs.sendMessage(tabs[0].id, {
        action: "refreshScan",
      });

      this.updateMediaCount(response.count || 0);
      this.showStatusMessage(`Found ${response.count || 0} stories`, "success");

      // If list is visible, refresh it
      if (this.isListVisible) {
        await this.loadMediaList();
      }
    } catch (error) {
      console.error("Error refreshing media:", error);
      this.showStatusMessage("Error refreshing stories", "error");
    } finally {
      // Restore button state
      refreshBtn.innerHTML = originalContent;
      refreshBtn.disabled = false;
    }
  }

  updateMediaCount(count) {
    this.mediaCount = count;
    document.getElementById("mediaCount").textContent = count;

    const downloadBtn = document.getElementById("downloadAllBtn");
    const viewListBtn = document.getElementById("viewListBtn");

    if (count > 0) {
      downloadBtn.disabled = false;
      viewListBtn.disabled = false;
    } else {
      downloadBtn.disabled = true;
      viewListBtn.disabled = true;
    }
  }

  async downloadAll() {
    const downloadBtn = document.getElementById("downloadAllBtn");
    const originalContent = downloadBtn.innerHTML;

    try {
      // Show loading state
      downloadBtn.innerHTML = '<div class="spinner"></div> Downloading...';
      downloadBtn.disabled = true;

      const tabs = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      const response = await browser.tabs.sendMessage(tabs[0].id, {
        action: "downloadAll",
      });

      const { successful, failed, total } = response;

      if (successful > 0) {
        this.showStatusMessage(
          `Downloaded ${successful}/${total} stories successfully`,
          "success"
        );
      }

      if (failed > 0) {
        this.showStatusMessage(`${failed} downloads failed`, "error");
      }
    } catch (error) {
      console.error("Error downloading all media:", error);
      this.showStatusMessage("Error downloading stories", "error");
    } finally {
      // Restore button state
      downloadBtn.innerHTML = originalContent;
      downloadBtn.disabled = false;
    }
  }

  async toggleMediaList() {
    const mediaListDiv = document.getElementById("mediaList");
    const viewListBtn = document.getElementById("viewListBtn");

    if (this.isListVisible) {
      mediaListDiv.style.display = "none";
      viewListBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="8" y1="6" x2="21" y2="6"/>
          <line x1="8" y1="12" x2="21" y2="12"/>
          <line x1="8" y1="18" x2="21" y2="18"/>
          <line x1="3" y1="6" x2="3.01" y2="6"/>
          <line x1="3" y1="12" x2="3.01" y2="12"/>
          <line x1="3" y1="18" x2="3.01" y2="18"/>
        </svg>
        View Details
      `;
      this.isListVisible = false;
    } else {
      await this.loadMediaList();
      mediaListDiv.style.display = "block";
      viewListBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
        Hide Details
      `;
      this.isListVisible = true;
    }
  }

  async loadMediaList() {
    try {
      const tabs = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      const response = await browser.tabs.sendMessage(tabs[0].id, {
        action: "getMediaList",
      });

      this.mediaList = response.media || [];
      this.renderMediaList();
    } catch (error) {
      console.error("Error loading media list:", error);
      this.showStatusMessage("Error loading story details", "error");
    }
  }

  renderMediaList() {
    const mediaItemsDiv = document.getElementById("mediaItems");

    if (this.mediaList.length === 0) {
      mediaItemsDiv.innerHTML = `
        <div class="media-item">
          <div class="media-info">
            <div style="text-align: center; color: #6c757d; padding: 20px;">
              No stories found. Try refreshing or navigate to a story page.
            </div>
          </div>
        </div>
      `;
      return;
    }

    mediaItemsDiv.innerHTML = this.mediaList
      .map(
        (item, index) => `
      <div class="media-item">
        <div class="media-info">
          <span class="media-type ${item.type}">${item.type}</span>
          <div class="media-filename" title="${item.filename}">${item.filename}</div>
        </div>
        <div class="media-actions">
          <button class="btn btn-secondary btn-small" data-index="${index}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7,10 12,15 17,10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download
          </button>
        </div>
      </div>
    `
      )
      .join("");

    // Add event listeners to download buttons (CSP-safe)
    const downloadButtons =
      mediaItemsDiv.querySelectorAll("button[data-index]");
    downloadButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        const index = parseInt(
          e.target.closest("button").getAttribute("data-index")
        );
        this.downloadSingle(index);
      });
    });
  }

  async downloadSingle(index) {
    const mediaItem = this.mediaList[index];
    if (!mediaItem) return;

    try {
      const tabs = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      const response = await browser.tabs.sendMessage(tabs[0].id, {
        action: "downloadSingle",
        mediaItem: mediaItem,
      });

      if (response.success) {
        this.showStatusMessage("Story downloaded successfully", "success");
      } else {
        this.showStatusMessage("Download failed: " + response.error, "error");
      }
    } catch (error) {
      console.error("Error downloading single media:", error);
      this.showStatusMessage("Error downloading story", "error");
    }
  }

  showStatusMessage(message, type = "success") {
    const statusMessage = document.getElementById("statusMessage");
    const statusText = document.getElementById("statusText");

    statusText.textContent = message;
    statusMessage.className = `status-message ${type} show`;

    // Auto-hide after 3 seconds
    setTimeout(() => {
      this.hideStatusMessage();
    }, 3000);
  }

  hideStatusMessage() {
    const statusMessage = document.getElementById("statusMessage");
    statusMessage.classList.remove("show");
  }

  async showDebugInfo() {
    try {
      const tabs = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      const currentTab = tabs[0];

      let debugInfo = `🔍 Debug Information:\n\n`;
      debugInfo += `📍 Current URL: ${currentTab.url}\n`;
      debugInfo += `🌐 Is Snapchat: ${currentTab.url.includes(
        "snapchat.com"
      )}\n`;
      debugInfo += `📊 Media Count: ${this.mediaCount}\n`;
      debugInfo += `📋 Media List Length: ${this.mediaList.length}\n\n`;

      if (this.mediaList.length > 0) {
        debugInfo += `📁 Found Media:\n`;
        this.mediaList.forEach((item, index) => {
          debugInfo += `  ${index + 1}. ${item.type} - ${item.filename}\n`;
          debugInfo += `     URL: ${item.url.substring(0, 60)}...\n`;
        });
      } else {
        debugInfo += `❌ No media detected. Try:\n`;
        debugInfo += `  1. Navigate to a Snapchat story\n`;
        debugInfo += `  2. Click the Refresh button\n`;
        debugInfo += `  3. Check browser console for errors\n`;
      }

      // Copy to clipboard and show alert
      navigator.clipboard
        .writeText(debugInfo)
        .then(() => {
          this.showStatusMessage("Debug info copied to clipboard!", "success");
        })
        .catch(() => {
          // Fallback: show in alert
          alert(debugInfo);
        });

      // Also log to console
      console.log("SnapStory Debug Info:", {
        currentUrl: currentTab.url,
        mediaCount: this.mediaCount,
        mediaList: this.mediaList,
        isSnapchat: currentTab.url.includes("snapchat.com"),
      });
    } catch (error) {
      console.error("Error getting debug info:", error);
      this.showStatusMessage("Error getting debug info", "error");
    }
  }

  async testDownload() {
    try {
      // Test download with a simple image
      const testUrl =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
      const testFilename = `test-download-${Date.now()}.png`;

      const response = await browser.runtime.sendMessage({
        action: "download",
        url: testUrl,
        filename: testFilename,
      });

      if (response.success) {
        this.showStatusMessage(
          "Test download successful! Check your downloads folder.",
          "success"
        );
      } else {
        this.showStatusMessage(
          `Test download failed: ${response.error}`,
          "error"
        );
      }
    } catch (error) {
      console.error("Test download error:", error);
      this.showStatusMessage(`Test download error: ${error.message}`, "error");
    }
  }

  openSettings() {
    // For now, just show a message about settings
    this.showStatusMessage("Settings panel coming soon!", "warning");

    // TODO: Implement settings panel
    // This could open a new tab or show an inline settings panel
  }
}

// Initialize popup when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.snapStoryPopup = new SnapStoryPopup();
});
