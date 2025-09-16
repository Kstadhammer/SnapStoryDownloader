# Development Guide

## Quick Start

### 1. Install Extension for Testing

```bash
# Open Firefox and go to about:debugging
# Click "This Firefox" → "Load Temporary Add-on"
# Select the manifest.json file from this directory
```

### 2. Development Commands

```bash
# Validate extension files
npm run validate

# Package for distribution
npm run package

# Clean build artifacts
npm run clean

# Show development instructions
npm run dev
```

## File Organization

```
src/
├── background/     # Background scripts (service worker equivalent)
├── popup/          # Extension popup UI
└── scripts/        # Content and injected scripts
```

## Key Components

### Content Script (`src/scripts/content.js`)

- Runs on Snapchat pages
- Detects media elements (images/videos)
- Uses MutationObserver for dynamic content
- Communicates with background script

### Injected Script (`src/scripts/injected.js`)

- Runs in page context
- Intercepts network requests
- Hooks into Snapchat's APIs
- Deep integration with page JavaScript

### Background Script (`src/background/background.js`)

- Handles downloads
- Manages extension state
- Badge updates
- Settings storage

### Popup (`src/popup/`)

- User interface
- Download controls
- Media list display
- Settings access

## Testing Checklist

### Basic Functionality

- [ ] Extension loads without errors
- [ ] Badge shows story count
- [ ] Popup opens correctly
- [ ] Stories are detected on Snapchat pages

### Download Features

- [ ] Individual story download works
- [ ] Bulk download works
- [ ] Files are named correctly
- [ ] Downloads save to correct location

### UI/UX

- [ ] Popup is responsive
- [ ] Loading states work
- [ ] Error messages display
- [ ] Icons display correctly

### Edge Cases

- [ ] Works with no stories found
- [ ] Handles network errors gracefully
- [ ] Works on different Snapchat page types
- [ ] Handles rapid navigation

## Debugging

### Browser Console

1. Open Developer Tools (F12)
2. Check Console tab for errors
3. Look for "SnapStory" prefixed messages

### Extension Debugging

1. Go to `about:debugging`
2. Find your extension
3. Click "Inspect" to open dev tools
4. Check background script console

### Common Issues

**Stories not detected:**

- Check if content script is injecting
- Verify Snapchat page structure hasn't changed
- Look for console errors

**Downloads failing:**

- Check download permissions
- Verify file paths are valid
- Check for CORS issues

**Popup not working:**

- Check popup.js for errors
- Verify manifest popup path
- Check CSS loading

## Code Style

### JavaScript

- Use ES6+ features
- Prefer const/let over var
- Use async/await for promises
- Add JSDoc comments for functions

### CSS

- Use CSS Grid/Flexbox for layouts
- Follow BEM naming convention
- Use CSS custom properties for theming
- Ensure responsive design

### HTML

- Semantic HTML elements
- Accessible markup (ARIA labels)
- Proper meta tags
- Valid HTML5

## Security Considerations

### Content Security Policy

- Avoid inline scripts/styles
- Use proper CSP headers
- Sanitize user input
- Validate URLs before downloading

### Permissions

- Request minimal permissions
- Document permission usage
- Handle permission denials gracefully

## Performance

### Memory Usage

- Clean up event listeners
- Remove unused observers
- Limit stored data size

### Network Efficiency

- Batch similar requests
- Cache frequently used data
- Avoid unnecessary API calls

## Release Process

### Version Updates

1. Update version in `manifest.json`
2. Update version in `package.json`
3. Update CHANGELOG.md
4. Test thoroughly

### Packaging

```bash
npm run clean
npm run validate
npm run package
```

### Distribution

1. Test packaged extension
2. Submit to Firefox Add-ons (if desired)
3. Create GitHub release
4. Update documentation

## Contributing

### Pull Request Process

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Update documentation
5. Submit PR with clear description

### Code Review Checklist

- [ ] Code follows style guidelines
- [ ] All tests pass
- [ ] Documentation updated
- [ ] No security vulnerabilities
- [ ] Performance impact considered
