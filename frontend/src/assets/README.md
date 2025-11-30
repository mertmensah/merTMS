# Assets Folder

This folder contains images, logos, and other static assets for the merTM.S application.

## Brand Colors
- **Primary Dark Blue**: #176B91 (used for active states, CTA buttons, sidebar)
- **Primary Light Blue**: #46B1E1 (used for hover states, accents)
- **Text**: Black (#000000)

## Suggested Assets to Add

Please add the following files to this folder:

1. **Company Logo** 
   - `logo.png` or `logo.svg` - Main company logo
   - Recommended size: 200x60px or vector format

2. **Brand Assets**
   - `brand-colors.png` - Reference image with brand colors
   - Any other brand guidelines or reference images

3. **Icons** (optional)
   - Custom icons or imagery specific to merTM.S

## Using Assets in Components

To use assets in your React components:

```jsx
import logo from '../assets/logo.png'

function MyComponent() {
  return <img src={logo} alt="merTM.S Logo" />
}
```
