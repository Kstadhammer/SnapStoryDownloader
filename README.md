# SnapStory Downloader

A Firefox extension that allows users to download Snapchat stories as images or videos.

## 🚀 Features

- **Auto-Detection**: Automatically detects Snapchat story media (images and videos)
- **Bulk Download**: Download all available stories with one click
- **Individual Download**: Download specific stories from a detailed list
- **Smart Naming**: Automatically generates meaningful filenames with timestamps
- **Real-time Updates**: Live count of available stories with refresh capability
- **Modern UI**: Clean, responsive interface with visual feedback

## 📁 Project Structure

```
SnapStory/
├── manifest.json                 # Extension manifest
├── src/
│   ├── background/
│   │   └── background.js         # Background script for downloads
│   ├── popup/
│   │   ├── popup.html           # Extension popup interface
│   │   ├── popup.css            # Popup styling
│   │   └── popup.js             # Popup functionality
│   └── scripts/
│       ├── content.js           # Content script for media detection
│       └── injected.js          # Injected script for deep integration
├── icons/
│   ├── icon.svg                 # Source SVG icon
│   ├── icon-16.png             # 16x16 icon
│   ├── icon-32.png             # 32x32 icon
│   ├── icon-48.png             # 48x48 icon
│   └── icon-128.png            # 128x128 icon
└── README.md
```

## 🛠️ Installation

### For Development

1. **Clone or download** this repository to your local machine

2. **Open Firefox** and navigate to `about:debugging`

3. Click **"This Firefox"** in the left sidebar

4. Click **"Load Temporary Add-on"**

5. Navigate to the SnapStory folder and select the `manifest.json` file

6. The extension will be loaded and ready to use

### For Production

1. **Package the extension**:

   ```bash
   # Create a zip file with all extension files
   zip -r snapstory-extension.zip manifest.json src/ icons/
   ```

2. **Submit to Firefox Add-ons** (optional):
   - Visit [Firefox Add-on Developer Hub](https://addons.mozilla.org/developers/)
   - Follow the submission guidelines

## 📖 Usage

1. **Navigate to Snapchat**: Go to [snapchat.com](https://snapchat.com) and log in

2. **View Stories**: Navigate to any story page or stories section

3. **Open Extension**: Click the SnapStory extension icon in your browser toolbar

4. **Download Options**:
   - **Refresh**: Click the refresh button to scan for new stories
   - **Download All**: Download all detected stories at once
   - **View Details**: See individual stories and download them separately

## 🔧 Technical Details

### Content Script (`content.js`)

- Scans DOM for video and image elements
- Uses MutationObserver to detect dynamically loaded content
- Extracts media URLs from various sources (src attributes, background images)
- Communicates with background script for downloads

### Injected Script (`injected.js`)

- Runs in page context to access Snapchat's JavaScript APIs
- Intercepts XHR and fetch requests for media URLs
- Hooks into Snapchat's internal media loading mechanisms
- Provides deeper integration with Snapchat's dynamic content

### Background Script (`background.js`)

- Handles file downloads using the Downloads API
- Manages extension settings and storage
- Provides badge updates and notifications
- Coordinates between content scripts and popup

### Popup Interface (`popup.html/css/js`)

- Modern, responsive UI design
- Real-time story count and status updates
- Individual and bulk download controls
- Error handling and user feedback

## ⚠️ Important Notes

### Legal Considerations

- **Respect Privacy**: Only download stories you have permission to save
- **Terms of Service**: Ensure compliance with Snapchat's Terms of Service
- **Copyright**: Respect content creators' rights and intellectual property

### Technical Limitations

- **Dynamic Content**: Snapchat heavily uses dynamic content loading
- **Anti-Scraping**: Snapchat may implement measures to prevent automated access
- **Updates Required**: Snapchat updates may break functionality, requiring extension updates

### Browser Permissions

The extension requires these permissions:

- `activeTab`: To access the current Snapchat tab
- `downloads`: To save files to your computer
- `storage`: To save extension settings
- `*://*.snapchat.com/*`: To run on Snapchat pages

## 🐛 Troubleshooting

### No Stories Detected

1. Make sure you're on a Snapchat story page
2. Try clicking the "Refresh" button
3. Check browser console for errors (F12 → Console)

### Downloads Not Working

1. Check Firefox download permissions
2. Verify download folder permissions
3. Try downloading individual stories instead of bulk

### Extension Not Loading

1. Verify all files are in correct locations
2. Check manifest.json syntax
3. Reload the extension in about:debugging

## 🔄 Development

### File Structure Guidelines

- Keep scripts organized in `src/` subdirectories
- Use semantic naming for files and functions
- Maintain consistent code formatting
- Add comments for complex logic

### Testing

1. Test on different Snapchat pages (stories, discover, etc.)
2. Verify downloads work with different media types
3. Check responsive design on different screen sizes
4. Test error handling scenarios

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with proper testing
4. Submit a pull request with clear description

## 📄 License

This project is for educational purposes. Please ensure compliance with:

- Snapchat's Terms of Service
- Local copyright laws
- Privacy regulations (GDPR, etc.)

## 🤝 Support

For issues, questions, or contributions:

1. Check the troubleshooting section
2. Review browser console for errors
3. Create detailed issue reports with steps to reproduce

---

**Disclaimer**: This extension is not affiliated with Snapchat. Use responsibly and in accordance with all applicable terms of service and laws.
