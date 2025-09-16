# 🐛 SnapStory Downloader - Debug Guide

## When Downloads Don't Work

### Step 1: Reload the Extension

1. Go to `about:debugging`
2. Find SnapStory Downloader
3. Click **"Reload"**
4. Try downloading again

### Step 2: Check Browser Console

1. **Open Developer Tools** (F12)
2. Go to **Console** tab
3. Try downloading again
4. Look for messages starting with "SnapStory:"

**Common Error Messages:**

- `"Invalid media item - no URL found"` → No stories detected
- `"Download failed"` → Check permissions or URL format
- `"Unknown action"` → Communication issue between scripts

### Step 3: Check Extension Console

1. Go to `about:debugging`
2. Find SnapStory Downloader
3. Click **"Inspect"**
4. Try downloading again
5. Look for "SnapStory Background:" messages

### Step 4: Test Basic Download

Open the extension popup and run this in the browser console:

```javascript
// Test if downloads API works
browser.downloads
  .download({
    url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
    filename: "test.png",
  })
  .then((id) => console.log("Download started:", id))
  .catch((err) => console.error("Download failed:", err));
```

### Step 5: Check Snapchat Page

1. Make sure you're on `snapchat.com`
2. Navigate to a story page
3. Click **Refresh** in the extension popup
4. Check if story count increases

## Common Issues & Solutions

### ❌ "No stories found"

**Causes:**

- Not on a Snapchat story page
- Stories haven't loaded yet
- Content detection selectors need updating

**Solutions:**

1. Navigate to a friend's story or your own stories
2. Wait for stories to fully load
3. Click the Refresh button
4. Try different story pages (Discover, Friends, etc.)

### ❌ "Download failed" or nothing happens

**Causes:**

- Invalid URLs (blob:, data: URLs may not work)
- Firefox download permissions
- CORS issues
- Network problems

**Solutions:**

1. Check Firefox Settings → Privacy & Security → Permissions → Downloads
2. Try downloading from a different story
3. Check if URLs are accessible (look in console)

### ❌ Extension not working at all

**Causes:**

- Extension not loaded properly
- JavaScript errors
- Manifest issues

**Solutions:**

1. Reload extension in about:debugging
2. Check for JavaScript errors in console
3. Verify all files are in correct locations

## Debug Console Commands

### Check Extension Status

```javascript
// In extension popup console
console.log("Media count:", snapStoryPopup.mediaCount);
console.log("Media list:", snapStoryPopup.mediaList);
```

### Test Content Script Communication

```javascript
// In main page console (F12)
browser.runtime
  .sendMessage({ action: "getMediaCount" })
  .then((response) => console.log("Response:", response));
```

### Manual Download Test

```javascript
// In extension popup console
snapStoryPopup.testDownload();
```

## File Locations to Check

### Content Script Loading

- File: `src/scripts/content.js`
- Should log: `"SnapStory Downloader: Content script loaded"`

### Background Script Loading

- File: `src/background/background.js`
- Should log: `"SnapStory Downloader: Background script loaded"`

### Popup Loading

- File: `src/popup/popup.js`
- Should log: `"SnapStory Downloader: Popup script loaded"`

## Network Issues

### Check if Media URLs are Accessible

1. Open Developer Tools → Network tab
2. Navigate to a story
3. Look for media requests (images, videos)
4. Right-click on media requests → "Copy URL"
5. Try opening URL in new tab

### CORS Problems

If you see CORS errors:

- Snapchat may be blocking cross-origin requests
- Try using blob URLs instead of direct URLs
- May need to use different detection methods

## Advanced Debugging

### Enable Verbose Logging

Add this to content script:

```javascript
// Add more detailed logging
console.log("SnapStory: Scanning DOM...");
console.log(
  "SnapStory: Found elements:",
  document.querySelectorAll("video, img")
);
```

### Check Snapchat's Structure

```javascript
// In main page console
console.log("Videos:", document.querySelectorAll("video"));
console.log("Images:", document.querySelectorAll("img"));
console.log(
  "Background images:",
  document.querySelectorAll('[style*="background-image"]')
);
```

## Getting Help

### Create a Bug Report

Include:

1. Firefox version
2. Extension version
3. Console error messages
4. Steps to reproduce
5. Snapchat page URL (if possible)

### Debug Info Export

The extension popup has a debug feature that copies system info to clipboard.

## Quick Fixes to Try

1. **Reload extension** in about:debugging
2. **Restart Firefox**
3. **Clear browser cache** for snapchat.com
4. **Disable other extensions** temporarily
5. **Try in private/incognito mode**
6. **Check Firefox permissions** for downloads

## Still Not Working?

If none of the above helps:

1. Check GitHub issues: https://github.com/Kstadhammer/SnapStoryDownloader/issues
2. Create a new issue with debug information
3. Try testing on different Snapchat story pages
4. Check if Snapchat has updated their page structure
