import { useState, useEffect } from 'react'
import { tmsAPI } from '../services/api'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './ControlTower.css'

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Custom marker icons
const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

const yellowIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

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
  const [deliveries, setDeliveries] = useState({
    delivered: [],
    onTime: [],
    pastDue: []
  })
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [mapMarkers, setMapMarkers] = useState([])

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
              status: 'delivered',
              icon: greenIcon
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
              status: 'onTime',
              icon: yellowIcon
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
              status: 'pastDue',
              icon: redIcon
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

  const handleSimulateLoads = async () => {
    if (!confirm('This will create 8 new test loads with today\'s delivery date. Continue?')) {
      return
    }
    
    setLoading(true)
    try {
      const response = await tmsAPI.simulateTodayLoads()
      const result = response.data
      alert(`✅ Successfully created ${result.loads_created} loads:\n\n` +
            `- ${result.summary.delivered} Delivered\n` +
            `- ${result.summary.on_time} On Time (In Transit)\n` +
            `- ${result.summary.at_risk} At Risk (will be late)\n\n` +
            `${result.orders_assigned} orders assigned for ${result.date}`)
      fetchTodayDeliveries()
    } catch (error) {
      console.error('❌ FRONTEND ERROR - Error simulating loads:', error)
      console.error('❌ Full error object:', JSON.stringify(error, null, 2))
      console.error('❌ Response data:', error.response?.data)
      console.error('❌ Response status:', error.response?.status)
      console.error('❌ Response headers:', error.response?.headers)
      
      const debugCode = error.response?.data?.debug_code || 'FRONTEND-ERROR'
      const errorMsg = error.response?.data?.error || error.message
      alert(`❌ Failed to simulate loads\n\nDebug Code: ${debugCode}\nError: ${errorMsg}\nStatus: ${error.response?.status || 'N/A'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateOrders = async () => {
    try {
      setGenerating(true)
      const response = await tmsAPI.generateOrders(50)
      console.log('Generate orders response:', response.data)
      alert(`Successfully generated 50 new orders! Total orders: ${response.data.count || 50}`)
      // No need to refresh Control Tower as it doesn't display orders directly
    } catch (error) {
      console.error('Error generating orders:', error)
      alert(`Failed to generate orders: ${error.response?.data?.error || error.message}`)
    } finally {
      setGenerating(false)
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
        <div style={{ display: 'flex', gap: '10px', alignSelf: 'flex-start', marginTop: '10px' }}>
          <button 
            className="btn-secondary" 
            onClick={handleGenerateOrders}
            disabled={generating || loading}
            title="Generate 50 sample orders for testing"
          >
            {generating ? 'Generating...' : '📦 Simulate Orders'}
          </button>
          <button 
            className="btn-secondary" 
            onClick={handleSimulateLoads}
            disabled={generating || loading}
            title="Create test loads for today's delivery"
          >
            🎬 Simulate Loads
          </button>
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
      {mapMarkers.length > 0 && (
        <div className="tower-map-section">
          <h3>Delivery Map</h3>
          <p className="map-description">Destination locations color-coded by status</p>
          <MapContainer 
            center={[39.8283, -98.5795]} 
            zoom={4} 
            style={{ height: '500px', width: '100%', borderRadius: '8px' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {mapMarkers.map((marker, idx) => (
              <Marker 
                key={`${marker.order.id}-${idx}`}
                position={[marker.lat, marker.lng]}
                icon={marker.icon}
              >
                <Popup>
                  <div style={{ minWidth: '200px' }}>
                    <strong>{marker.order.order_number}</strong>
                    <br />
                    <strong>Status:</strong> {marker.order.status}
                    <br />
                    <strong>Customer:</strong> {marker.order.customer}
                    <br />
                    <strong>Destination:</strong> {marker.order.destination}
                    <br />
                    <strong>Weight:</strong> {marker.order.weight_lbs} lbs
                    <br />
                    <strong>Volume:</strong> {marker.order.volume_cuft} cu.ft
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
          
          <div className="map-legend">
            <div className="legend-item">
              <span className="legend-marker green"></span>
              <span>Delivered ({deliveries.delivered.length})</span>
            </div>
            <div className="legend-item">
              <span className="legend-marker yellow"></span>
              <span>On Time / In Transit ({deliveries.onTime.length})</span>
            </div>
            <div className="legend-item">
              <span className="legend-marker red"></span>
              <span>Past Due ({deliveries.pastDue.length})</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ControlTower
