import React, { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './RouteMap.css'

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const originIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

const destinationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-black.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

function RouteMap({ routes }) {
  console.log('RouteMap rendering with routes:', routes)
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const [mapReady, setMapReady] = useState(false)

  if (!routes || routes.length === 0) {
    return (
      <div className="map-placeholder">
        <p>Select a load and click "View on Map" to visualize routes</p>
      </div>
    )
  }

  // Validate routes and extract coordinates
  useEffect(() => {
    // Clean up previous map instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove()
      mapInstanceRef.current = null
    }

    if (!mapRef.current || !routes || routes.length === 0) {
      return
    }

    // Calculate center point from all coordinates
    const allLats = []
    const allLngs = []
    
    routes.forEach(route => {
      if (route.origin_coords?.lat && route.origin_coords?.lng) {
        allLats.push(route.origin_coords.lat)
        allLngs.push(route.origin_coords.lng)
      }
      if (route.destination_coords?.lat && route.destination_coords?.lng) {
        allLats.push(route.destination_coords.lat)
        allLngs.push(route.destination_coords.lng)
      }
    })

    if (allLats.length === 0) {
      console.warn('No valid coordinates found in routes')
      return
    }

    const centerLat = allLats.reduce((a, b) => a + b, 0) / allLats.length
    const centerLng = allLngs.reduce((a, b) => a + b, 0) / allLngs.length

    console.log('Creating map with center:', centerLat, centerLng)

    // Create new map instance
    const map = L.map(mapRef.current, {
      center: [centerLat, centerLng],
      zoom: 4,
      scrollWheelZoom: true,
      zoomControl: true
    })

    mapInstanceRef.current = map

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map)

    // Add markers and polylines for each route
    const bounds = []
    
    routes.forEach((route, index) => {
      if (!route.origin_coords?.lat || !route.origin_coords?.lng || 
          !route.destination_coords?.lat || !route.destination_coords?.lng) {
        return
      }

      const originPos = [route.origin_coords.lat, route.origin_coords.lng]
      const destPos = [route.destination_coords.lat, route.destination_coords.lng]

      bounds.push(originPos, destPos)

      // Origin marker
      L.marker(originPos, { icon: originIcon })
        .addTo(map)
        .bindPopup(`<strong>${route.origin}</strong><br/>Origin`)

      // Destination marker
      L.marker(destPos, { icon: destinationIcon })
        .addTo(map)
        .bindPopup(`
          <strong>${route.destination}</strong><br/>
          Destination<br/>
          Weight: ${route.weight_lbs} lbs<br/>
          Volume: ${route.volume_cuft} cu.ft
        `)

      // Polyline connecting origin to destination
      L.polyline([originPos, destPos], {
        color: '#4a90e2',
        weight: 3,
        opacity: 0.7
      }).addTo(map)
    })

    // Fit map to show all markers
    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] })
    }

    setMapReady(true)

    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [routes])

  // Check if we have valid data
  const hasValidRoutes = routes.some(route => 
    route.origin_coords?.lat && route.origin_coords?.lng &&
    route.destination_coords?.lat && route.destination_coords?.lng
  )

  if (!hasValidRoutes) {
    return (
      <div className="map-placeholder">
        <p style={{color: 'orange'}}>No valid coordinates found for these routes</p>
      </div>
    )
  }

  return (
    <div className="map-container">
      <div 
        ref={mapRef} 
        style={{ 
          height: '500px', 
          width: '100%',
          borderRadius: '8px',
          overflow: 'hidden'
        }}
      />
      
      <div className="map-legend">
        <div className="legend-item">
          <span className="legend-marker origin"></span>
          Origin
        </div>
        <div className="legend-item">
          <span className="legend-marker destination"></span>
          Destination
        </div>
      </div>
    </div>
  )
}

export default RouteMap