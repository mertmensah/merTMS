import { useState, useEffect, useRef } from 'react'
import { tmsAPI } from '../services/api'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import './ControlTower.css'

// Mapbox access token from environment variable
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN
if (!MAPBOX_TOKEN) {
  console.error('VITE_MAPBOX_TOKEN not set in environment variables')
}
mapboxgl.accessToken = MAPBOX_TOKEN

// Marker colors by status
const MARKER_COLORS = {
  delivered: '#4caf50',   // Green
  onTime: '#ff9800',      // Orange
  pastDue: '#f44336'      // Red
}

// Helper function for geocoding
const getDestinationCoordinates = (destination) => {
  const locations = {
    'New York, NY': { lat: 40.7128, lng: -74.0060 },
    'Los Angeles, CA': { lat: 34.0522, lng: -118.2437 },
    'Chicago, IL': { lat: 41.8781, lng: -87.6298 },
    'Houston, TX': { lat: 29.7604, lng: -95.3698 },
    'Phoenix, AZ': { lat: 33.4484, lng: -112.0740 },
    'Philadelphia, PA': { lat: 39.9526, lng: -75.1652 },
    'San Antonio, TX': { lat: 29.4241, lng: -98.4936 },
    'San Diego, CA': { lat: 32.7157, lng: -117.1611 },
    'Dallas, TX': { lat: 32.7767, lng: -96.7970 },
    'San Jose, CA': { lat: 37.3382, lng: -121.8863 },
    'Austin, TX': { lat: 30.2672, lng: -97.7431 },
    'Jacksonville, FL': { lat: 30.3322, lng: -81.6557 },
    'Fort Worth, TX': { lat: 32.7555, lng: -97.3308 },
    'Columbus, OH': { lat: 39.9612, lng: -82.9988 },
    'Charlotte, NC': { lat: 35.2271, lng: -80.8431 },
    'San Francisco, CA': { lat: 37.7749, lng: -122.4194 },
    'Indianapolis, IN': { lat: 39.7684, lng: -86.1581 },
    'Seattle, WA': { lat: 47.6062, lng: -122.3321 },
    'Denver, CO': { lat: 39.7392, lng: -104.9903 },
    'Boston, MA': { lat: 42.3601, lng: -71.0589 },
    'El Paso, TX': { lat: 31.7619, lng: -106.4850 },
    'Nashville, TN': { lat: 36.1627, lng: -86.7816 },
    'Detroit, MI': { lat: 42.3314, lng: -83.0458 },
    'Portland, OR': { lat: 45.5152, lng: -122.6784 },
    'Las Vegas, NV': { lat: 36.1699, lng: -115.1398 },
    'Memphis, TN': { lat: 35.1495, lng: -90.0490 },
    'Louisville, KY': { lat: 38.2527, lng: -85.7585 },
    'Milwaukee, WI': { lat: 43.0389, lng: -87.9065 }
  }
  return locations[destination] || { lat: 40.0, lng: -95.0 }
}

function ControlTower() {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const markersRef = useRef([])
  
  const [deliveries, setDeliveries] = useState({
    delivered: [],
    onTime: [],
    pastDue: []
  })
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [mapMarkers, setMapMarkers] = useState([])
  const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/satellite-streets-v12')
  const [mapReady, setMapReady] = useState(false)

  // Initialize map when container becomes available
  useEffect(() => {
    if (map.current || !mapContainer.current) return
    
    console.log('Initializing Mapbox...')
    console.log('Token:', MAPBOX_TOKEN.substring(0, 30) + '...')
    console.log('Style:', mapStyle)
    console.log('Container:', mapContainer.current)
    
    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: mapStyle,
        center: [-97.7, 37.7],
        zoom: 4.8,
        projection: 'mercator',
        accessToken: MAPBOX_TOKEN
      })

      map.current.on('load', () => {
        console.log('✅ Map loaded successfully!')
        setMapReady(true)
        if (mapContainer.current) {
          mapContainer.current.style.backgroundColor = 'transparent'
        }
      })

      map.current.on('error', (e) => {
        console.error('❌ Map error:', e)
        alert('Map failed to load: ' + JSON.stringify(e.error || e))
      })

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')
      map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right')
    } catch (error) {
      console.error('❌ Error initializing Mapbox:', error)
      alert('Failed to initialize map: ' + error.message)
    }

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [mapContainer.current, mapStyle])

  // Update map style when changed
  useEffect(() => {
    if (map.current && mapReady) {
      map.current.setStyle(mapStyle)
    }
  }, [mapStyle, mapReady])

  // Update markers when mapMarkers change
  useEffect(() => {
    if (!map.current) return

    // Wait for map to load before adding markers
    const addMarkers = () => {
      // Remove existing markers
      markersRef.current.forEach(marker => marker.remove())
      markersRef.current = []

      // Add new markers
      mapMarkers.forEach((markerData, index) => {
        // Create custom marker element with label
        const el = document.createElement('div')
        el.className = 'custom-marker-container'
        el.style.position = 'relative'
        el.style.cursor = 'pointer'
        
        // Create the pin
        const pin = document.createElement('div')
        pin.className = 'custom-marker'
        pin.style.backgroundColor = MARKER_COLORS[markerData.status]
        pin.style.width = '32px'
        pin.style.height = '32px'
        pin.style.borderRadius = '50%'
        pin.style.border = '4px solid white'
        pin.style.boxShadow = '0 4px 8px rgba(0,0,0,0.4)'
        pin.style.position = 'relative'
        pin.style.transition = 'transform 0.2s'
        
        // Create the label
        const label = document.createElement('div')
        label.className = 'marker-label'
        label.textContent = markerData.load.load_number
        label.style.position = 'absolute'
        label.style.top = '-30px'
        label.style.left = '50%'
        label.style.transform = 'translateX(-50%)'
        label.style.backgroundColor = 'rgba(0, 0, 0, 0.85)'
        label.style.color = 'white'
        label.style.padding = '4px 8px'
        label.style.borderRadius = '4px'
        label.style.fontSize = '11px'
        label.style.fontWeight = 'bold'
        label.style.whiteSpace = 'nowrap'
        label.style.pointerEvents = 'none'
        label.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)'
        
        pin.appendChild(label)
        el.appendChild(pin)
        
        // Hover effect
        el.addEventListener('mouseenter', () => {
          pin.style.transform = 'scale(1.2)'
          label.style.opacity = '1'
        })
        el.addEventListener('mouseleave', () => {
          pin.style.transform = 'scale(1)'
        })

        // Create enhanced popup
        const statusEmoji = markerData.status === 'delivered' ? '✅' : 
                           markerData.status === 'onTime' ? '🚛' : '⚠️'
        const statusText = markerData.status === 'delivered' ? 'Delivered' : 
                          markerData.status === 'onTime' ? 'On Time / In Transit' : 'Past Due'
        const statusColor = MARKER_COLORS[markerData.status]
        
        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div style="min-width: 250px; font-family: system-ui;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
              <strong style="font-size: 15px; color: #1a1a1a;">${markerData.load.load_number}</strong>
              <span style="background: ${statusColor}; color: white; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">
                ${statusEmoji} ${statusText}
              </span>
            </div>
            <div style="font-size: 13px; line-height: 1.8; color: #333;">
              <div style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #eee;">
                <strong>Order:</strong> ${markerData.order.order_number}<br/>
                <strong>Customer:</strong> ${markerData.order.customer}
              </div>
              <div style="margin-bottom: 8px;">
                <strong>📍 Destination:</strong><br/>
                ${markerData.order.destination}
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; background: #f5f5f5; padding: 8px; border-radius: 4px;">
                <div>
                  <strong>Weight:</strong><br/>
                  ${markerData.order.weight_lbs} lbs
                </div>
                <div>
                  <strong>Volume:</strong><br/>
                  ${markerData.order.volume_cuft} cu.ft
                </div>
              </div>
              ${markerData.load.truck_type ? `<div style="margin-top: 8px;"><strong>🚚 Truck:</strong> ${markerData.load.truck_type}</div>` : ''}
              ${markerData.load.utilization_percent ? `<div style="margin-top: 4px;"><strong>📊 Utilization:</strong> ${markerData.load.utilization_percent}%</div>` : ''}
            </div>
          </div>
        `)

        // Create and add marker
        const marker = new mapboxgl.Marker(el)
          .setLngLat([markerData.lng, markerData.lat])
          .setPopup(popup)
          .addTo(map.current)

        markersRef.current.push(marker)
      })
    }

    if (map.current.isStyleLoaded()) {
      addMarkers()
    } else {
      map.current.on('load', addMarkers)
    }
  }, [mapMarkers])

  useEffect(() => {
    fetchTodayDeliveries()
  }, [])

  const fetchTodayDeliveries = async () => {
    setLoading(true)
    try {
      const response = await tmsAPI.getLoads()
      const loads = response.data?.data || response.data || []
      
      // Get today's date
      const today = new Date().toISOString().split('T')[0]
      
      // Filter loads where customer expects delivery today
      const todayLoads = []
      for (const load of loads) {
        if (load.orders && load.orders.length > 0) {
          // Check if any order has customer_expected_delivery_date = today
          const hasTodayExpectation = load.orders.some(order => {
            const expectedDate = order.customer_expected_delivery_date?.split('T')[0]
            return expectedDate === today
          })
          if (hasTodayExpectation) {
            // Add risk assessment based on estimated_delivery_date
            const estimatedDate = load.estimated_delivery_date?.split('T')[0]
            load.isAtRisk = estimatedDate && estimatedDate > today
            load.isLate = load.status !== 'Delivered' && (!estimatedDate || estimatedDate < today)
            todayLoads.push(load)
          }
        }
      }

      // Categorize by delivery status and risk
      const categorized = {
        delivered: todayLoads.filter(l => l.status === 'Delivered'),
        onTime: todayLoads.filter(l => 
          (l.status === 'In Transit' || l.status === 'Dispatched') && 
          !l.isAtRisk && !l.isLate
        ),
        pastDue: todayLoads.filter(l => 
          l.isAtRisk || l.isLate || 
          l.status === 'Planning' || l.status === 'Delayed'
        )
      }
      
      setDeliveries(categorized)

      // Create map markers with colors based on load destinations
      const markers = []
      
      categorized.delivered.forEach(load => {
        if (load.orders && load.orders.length > 0) {
          load.orders.forEach(order => {
            const coords = getDestinationCoordinates(order.destination)
            markers.push({
              ...coords,
              order,
              load,
              status: 'delivered'
            })
          })
        }
      })
      
      categorized.onTime.forEach(load => {
        if (load.orders && load.orders.length > 0) {
          load.orders.forEach(order => {
            const coords = getDestinationCoordinates(order.destination)
            markers.push({
              ...coords,
              order,
              load,
              status: 'onTime'
            })
          })
        }
      })
      
      categorized.pastDue.forEach(load => {
        if (load.orders && load.orders.length > 0) {
          load.orders.forEach(order => {
            const coords = getDestinationCoordinates(order.destination)
            markers.push({
              ...coords,
              order,
              load,
              status: 'pastDue'
            })
          })
        }
      })

      setMapMarkers(markers)

    } catch (error) {
      console.error('Error fetching today\'s deliveries:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="control-tower"><p>Loading Control Tower...</p></div>
  }

  const totalToday = deliveries.delivered.length + deliveries.onTime.length + deliveries.pastDue.length

  return (
    <div className="control-tower">
      <div className="tower-header">
        <div>
          <h2>🚛 Control Tower - Today's Loads</h2>
          <p className="tower-date">{new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>
        </div>
      </div>

      <div className="tower-summary">
        <div className="summary-card">
          <h3>Total Loads Today</h3>
          <p className="summary-value">{totalToday}</p>
        </div>
        <div className="summary-card success">
          <h3>Delivered</h3>
          <p className="summary-value">{deliveries.delivered.length}</p>
        </div>
        <div className="summary-card warning">
          <h3>On Time / In Transit</h3>
          <p className="summary-value">{deliveries.onTime.length}</p>
        </div>
        <div className="summary-card danger">
          <h3>Past Due</h3>
          <p className="summary-value">{deliveries.pastDue.length}</p>
        </div>
      </div>

      <div className="tower-buckets">
        <div className="bucket delivered-bucket">
          <h3>✓ Delivered ({deliveries.delivered.length})</h3>
          <div className="bucket-list">
            {deliveries.delivered.length === 0 ? (
              <p className="empty-message">No loads delivered yet today</p>
            ) : (
              deliveries.delivered.map(load => (
                <div key={load.id} className="bucket-item">
                  <div className="item-header">
                    <strong>{load.load_number}</strong>
                    <span className="status-badge delivered">Delivered</span>
                  </div>
                  <p>{load.truck_type || 'No truck assigned'}</p>
                  <p className="item-route">{load.origin} • {load.orders?.length || 0} stops</p>
                  <p className="item-weight">{load.total_weight_lbs?.toLocaleString() || 0} lbs • {load.utilization_percent || 0}% utilized</p>
                  {load.estimated_delivery_date && (
                    <p className="item-date">Delivered: {load.estimated_delivery_date}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bucket ontime-bucket">
          <h3>🚛 On Time / In Transit ({deliveries.onTime.length})</h3>
          <div className="bucket-list">
            {deliveries.onTime.length === 0 ? (
              <p className="empty-message">No loads in transit</p>
            ) : (
              deliveries.onTime.map(load => (
                <div key={load.id} className="bucket-item">
                  <div className="item-header">
                    <strong>{load.load_number}</strong>
                    <span className="status-badge in-transit">In Transit</span>
                  </div>
                  <p>{load.truck_type || 'No truck assigned'}</p>
                  <p className="item-route">{load.origin} • {load.orders?.length || 0} stops</p>
                  <p className="item-weight">{load.total_weight_lbs?.toLocaleString() || 0} lbs • {load.utilization_percent || 0}% utilized</p>
                  {load.estimated_delivery_date && (
                    <p className="item-date" style={{ color: '#4caf50' }}>Est. Delivery: {load.estimated_delivery_date}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bucket pastdue-bucket">
          <h3>⚠️ Past Due ({deliveries.pastDue.length})</h3>
          <div className="bucket-list">
            {deliveries.pastDue.length === 0 ? (
              <p className="empty-message success">No past due loads</p>
            ) : (
              deliveries.pastDue.map(load => (
                <div key={load.id} className="bucket-item">
                  <div className="item-header">
                    <strong>{load.load_number}</strong>
                    <span className="status-badge past-due">
                      {load.isAtRisk ? 'At Risk' : load.isLate ? 'Late' : 'Past Due'}
                    </span>
                  </div>
                  <p>{load.truck_type || 'No truck assigned'}</p>
                  <p className="item-route">{load.origin} • {load.orders?.length || 0} stops</p>
                  <p className="item-weight">{load.total_weight_lbs?.toLocaleString() || 0} lbs • {load.utilization_percent || 0}% utilized</p>
                  {load.estimated_delivery_date && (
                    <p className="item-date" style={{ color: '#f44336', fontWeight: 'bold' }}>
                      {load.isAtRisk ? `⚠️ Est: ${load.estimated_delivery_date} (Expected Today)` : `Est: ${load.estimated_delivery_date}`}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Map Visualization */}
      <div className="tower-map-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-m)', flexWrap: 'wrap', gap: 'var(--space-m)' }}>
          <div>
            <h3>📍 Live Delivery Map</h3>
            <p className="map-description">{mapMarkers.length} destination{mapMarkers.length !== 1 ? 's' : ''} across {totalToday} load{totalToday !== 1 ? 's' : ''}</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button 
                className={`btn-map-style ${mapStyle === 'mapbox://styles/mertmensah/clyd3o0s8011901qj1x8s02np' ? 'active' : ''}`}
                onClick={() => setMapStyle('mapbox://styles/mertmensah/clyd3o0s8011901qj1x8s02np')}
                title="Custom satellite view"
              >
                🛰️ Custom
              </button>
              <button 
                className={`btn-map-style ${mapStyle === 'mapbox://styles/mapbox/satellite-streets-v12' ? 'active' : ''}`}
                onClick={() => setMapStyle('mapbox://styles/mapbox/satellite-streets-v12')}
                title="Satellite view with street labels"
              >
                🛰️ Satellite
              </button>
              <button 
                className={`btn-map-style ${mapStyle === 'mapbox://styles/mapbox/streets-v12' ? 'active' : ''}`}
                onClick={() => setMapStyle('mapbox://styles/mapbox/streets-v12')}
                title="Standard street map"
              >
                🗺️ Streets
              </button>
              <button 
                className={`btn-map-style ${mapStyle === 'mapbox://styles/mapbox/dark-v11' ? 'active' : ''}`}
                onClick={() => setMapStyle('mapbox://styles/mapbox/dark-v11')}
                title="Dark theme map"
              >
                🌙 Dark
              </button>
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <div 
              ref={mapContainer} 
              className="mapbox-container"
              style={{ 
                height: '600px', 
                width: '100%', 
                borderRadius: '8px',
                backgroundColor: '#1a1a1a',
                position: 'relative'
              }}
            />
            {/* Map Legend */}
            <div style={{
              position: 'absolute',
              bottom: '20px',
              left: '20px',
              background: 'rgba(255, 255, 255, 0.95)',
              padding: '12px 16px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              backdropFilter: 'blur(10px)',
              zIndex: 1
            }}>
              <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '8px', color: '#1a1a1a' }}>Load Status</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: '#4caf50',
                    border: '2px solid white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }} />
                  <span style={{ color: '#1a1a1a' }}>✓ Delivered ({deliveries.delivered.length})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: '#ff9800',
                    border: '2px solid white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }} />
                  <span style={{ color: '#1a1a1a' }}>🚛 In Transit ({deliveries.onTime.length})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: '#f44336',
                    border: '2px solid white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }} />
                  <span style={{ color: '#1a1a1a' }}>⚠️ Past Due ({deliveries.pastDue.length})</span>
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
  )
}

export default ControlTower
