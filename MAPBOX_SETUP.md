# Mapbox GL JS Setup Guide

## Overview
The Control Tower module has been upgraded from Leaflet to **Mapbox GL JS** with satellite imagery support.

## Features Added
✅ **Satellite View** - High-resolution satellite imagery from Mapbox  
✅ **Multiple Map Styles** - Switch between Satellite, Streets, and Dark modes  
✅ **Better Performance** - Faster rendering and smoother interactions  
✅ **Navigation Controls** - Zoom, rotation, and tilt controls  
✅ **Fullscreen Mode** - Expand map to fullscreen view  
✅ **Custom Markers** - Color-coded delivery status indicators  
✅ **Interactive Popups** - Click markers to view order details  

## Setup Instructions

### 1. Get Your Mapbox Access Token (FREE)
1. Go to https://account.mapbox.com/
2. Sign up for a free account (no credit card required)
3. Navigate to **Access Tokens** page
4. Copy your default public token (starts with `pk.`)
5. **Free Tier Limits**: 50,000 map loads per month

### 2. Update Environment Variables
Open `frontend/.env` and replace the placeholder:

```env
VITE_MAPBOX_TOKEN=pk.YOUR_ACTUAL_TOKEN_HERE
```

### 3. Restart Development Server
```bash
cd frontend
npm run dev
```

The map should now display with satellite imagery!

## Map Styles Available
- **🛰️ Satellite** - High-res satellite imagery with street labels (default)
- **🗺️ Streets** - Standard street map with roads and labels
- **🌙 Dark** - Dark theme map for night viewing

## Marker Color Legend
- 🟢 **Green** - Delivered loads
- 🟠 **Orange** - On-time / In-transit loads
- 🔴 **Red** - Past due / At-risk loads

## Future Enhancements (Optional)
### OpenWeather API Integration
Add real-time weather overlay showing clouds, precipitation, and temperature.

**Setup:**
1. Get free API key at https://home.openweathermap.org/api_keys
2. Add to `frontend/.env`:
   ```env
   VITE_OPENWEATHER_API_KEY=your_key_here
   ```
3. Free tier: 60 calls/minute, 1M calls/month

**Features to implement:**
- Weather layer toggle button
- Cloud coverage overlay
- Temperature at delivery locations
- Precipitation alerts for at-risk loads

## Troubleshooting

### Map not displaying?
1. Check console for errors
2. Verify VITE_MAPBOX_TOKEN is set correctly in `.env`
3. Ensure dev server was restarted after adding token
4. Check if token is valid at https://account.mapbox.com/access-tokens/

### 403 Error?
- Token may be invalid or expired
- Generate a new token on Mapbox dashboard

### Slow loading?
- Check internet connection
- Verify free tier limits haven't been exceeded (50k/month)

## Migration Notes
### What Changed
- ❌ Removed: `react-leaflet`, `leaflet` packages
- ✅ Added: `mapbox-gl` package
- ✅ Updated: Custom marker rendering with inline styles
- ✅ Enhanced: Map controls and style switching

### Backward Compatibility
All existing functionality preserved:
- Load marker display
- Order popup information
- "Simulate Loads" button
- "Simulate Orders" button
- Delivery status categorization

## Cost Comparison
| Provider | Free Tier | Cost After |
|----------|-----------|------------|
| **Mapbox GL JS** | 50,000 loads/month | $5 per 1,000 loads |
| Leaflet (OSM) | Unlimited* | Free |
| Google Maps | $200 credit/month | $7 per 1,000 loads |

*OpenStreetMap is free but doesn't provide satellite imagery by default

## Documentation
- Mapbox GL JS API: https://docs.mapbox.com/mapbox-gl-js/
- Style Specification: https://docs.mapbox.com/mapbox-gl-js/style-spec/
- Examples: https://docs.mapbox.com/mapbox-gl-js/example/

## Support
For issues or questions, check:
1. Browser console for error messages
2. Mapbox account dashboard for API usage
3. Mapbox status page: https://status.mapbox.com/
