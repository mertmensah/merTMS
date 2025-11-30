import { useState, useEffect } from 'react'
import { tmsAPI } from '../services/api'
import RouteMap from './RouteMap'
import './LoadPlanning.css'

function LoadPlanning() {
  const [orders, setOrders] = useState([])
  const [loadPlan, setLoadPlan] = useState(null)
  const [savedLoads, setSavedLoads] = useState([])
  const [expandedLoads, setExpandedLoads] = useState({})
  const [selectedLoadForMap, setSelectedLoadForMap] = useState(null)
  const [mapRoutes, setMapRoutes] = useState([])
  const [optimizing, setOptimizing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingMap, setLoadingMap] = useState(false)

  useEffect(() => {
    fetchOrders()
    fetchSavedLoads()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await tmsAPI.getOrders()
      const ordersData = response.data?.data || response.data || []
      setOrders(ordersData)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSavedLoads = async () => {
    try {
      const response = await tmsAPI.getLoads()
      const loadsData = response.data?.data || response.data || []
      setSavedLoads(loadsData)
    } catch (error) {
      console.error('Error fetching saved loads:', error)
    }
  }

  const handleOptimizeLoads = async () => {
    try {
      setOptimizing(true)
      const pendingOrders = orders.filter(o => o.status === 'Pending')
      
      if (pendingOrders.length === 0) {
        alert('No pending orders to optimize')
        return
      }

      const response = await tmsAPI.optimizeLoads()
      const plan = response.data
      setLoadPlan(plan)
      setExpandedLoads({})
      setSelectedLoadForMap(null)
      setMapRoutes([])
      
      // Refresh data to show saved loads
      await fetchOrders()
      await fetchSavedLoads()
      
      // Check if loads were actually saved
      const newLoadCount = savedLoads.length
      alert(`Load optimization complete!\n\nCreated ${plan.loads?.length || 0} loads.\n\nLoads automatically saved to database.\n\nAssigned ${pendingOrders.length} orders to loads.`)
    } catch (error) {
      console.error('Error optimizing loads:', error)
      alert(`Failed to optimize loads.\n\nError: ${error.response?.data?.error || error.message}\n\nCheck console for details.`)
    } finally {
      setOptimizing(false)
    }
  }

  const toggleLoadExpanded = (loadId) => {
    setExpandedLoads(prev => ({
      ...prev,
      [loadId]: !prev[loadId]
    }))
  }

  const handleViewOnMap = async (load) => {
    try {
      setLoadingMap(true)
      console.log('Fetching map data for load:', load)
      const singleLoadPlan = { loads: [load], summary: loadPlan?.summary || {} }
      const mapResponse = await tmsAPI.getLoadRoutesMapData(singleLoadPlan)
      const routes = mapResponse.data.routes || []
      
      console.log('Received routes:', routes)
      
      if (routes.length === 0) {
        alert('No route data available for this load')
        setLoadingMap(false)
        return
      }
      
      // Validate routes have coordinates
      const validRoutes = routes.filter(r => 
        r.origin_coords?.lat && r.origin_coords?.lng && 
        r.destination_coords?.lat && r.destination_coords?.lng
      )
      
      if (validRoutes.length === 0) {
        alert('No valid coordinates found for this load')
        setLoadingMap(false)
        return
      }
      
      setMapRoutes(validRoutes)
      setSelectedLoadForMap(load)
      setTimeout(() => {
        document.querySelector('.map-section')?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (error) {
      console.error('Error fetching map data:', error)
      alert(`Failed to load map data: ${error.message}`)
    } finally {
      setLoadingMap(false)
    }
  }

  const pendingCount = orders.filter(o => o.status === 'Pending').length

  return (
    <div className="load-planning">
      <div className="header-section">
        <h2>AI Load Planning</h2>
        <button 
          className="btn-primary" 
          onClick={handleOptimizeLoads}
          disabled={optimizing || pendingCount === 0}
        >
          {optimizing ? 'Optimizing with AI...' : 'Optimize Loads'}
        </button>
      </div>

      <div className="planning-info">
        <p><strong>Pending Orders:</strong> {pendingCount}</p>
        <p><strong>Assigned Orders:</strong> {orders.filter(o => o.status === 'Assigned').length}</p>
        <p><strong>Saved Loads in Database:</strong> {savedLoads.length}</p>
        <div style={{ marginTop: '1rem', padding: '1rem', background: '#f0f8ff', borderRadius: '6px', border: '1px solid #4a90e2' }}>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#333' }}>
            ℹ️ <strong>Note:</strong> When you click "Optimize Loads", the system automatically:
            <br />1️⃣ Creates optimized load plans
            <br />2️⃣ Saves loads to database
            <br />3️⃣ Updates order statuses to "Assigned"
            <br />4️⃣ Shows results below and in the Loads tab
          </p>
        </div>
        <button className="btn-secondary" onClick={fetchSavedLoads} style={{ marginTop: '0.5rem' }}>
          Refresh Saved Loads ({savedLoads.length})
        </button>
      </div>

      {/* Show saved loads from database */}
      {savedLoads.length > 0 && (
        <div className="saved-loads-section" style={{ marginBottom: '2rem' }}>
          <h3>💾 Saved Loads ({savedLoads.length})</h3>
          <p style={{ color: '#666', marginBottom: '1rem' }}>These loads have been saved to the database</p>
          <div className="loads-list">
            {savedLoads.map((load) => (
              <div key={load.id} className="load-card">
                <div 
                  className="load-header clickable"
                  onClick={() => toggleLoadExpanded(`saved-${load.id}`)}
                >
                  <div className="load-header-left">
                    <span className="expand-icon">{expandedLoads[`saved-${load.id}`] ? '▼' : '▶'}</span>
                    <h5>{load.load_number}</h5>
                    <span className="truck-type">{load.truck_type}</span>
                    <span className={`status-badge ${load.status.toLowerCase()}`}>{load.status}</span>
                  </div>
                  <div className="load-header-right">
                    <span className="order-count">{load.orders?.length || 0} orders</span>
                  </div>
                </div>
                <div className="load-summary">
                  <div className="load-stat">
                    <span className="stat-label">Origin:</span>
                    <span className="stat-value">{load.origin}</span>
                  </div>
                  <div className="load-stat">
                    <span className="stat-label">Weight:</span>
                    <span className="stat-value">{load.total_weight_lbs?.toLocaleString()} lbs</span>
                  </div>
                  <div className="load-stat">
                    <span className="stat-label">Volume:</span>
                    <span className="stat-value">{load.total_volume_cuft?.toLocaleString()} cu.ft</span>
                  </div>
                  <div className="load-stat">
                    <span className="stat-label">Utilization:</span>
                    <span className="stat-value">{load.utilization_percent}%</span>
                  </div>
                </div>
                
                {expandedLoads[`saved-${load.id}`] && (
                  <div className="load-details-expanded">
                    <h6>Orders in Load</h6>
                    <div className="stop-sequence">
                      {load.orders && load.orders.length > 0 ? (
                        load.orders.map((order, idx) => (
                          <div key={order.id} className="stop-card">
                            <div className="stop-number">{order.sequence_number || idx + 1}</div>
                            <div className="stop-info">
                              <div className="stop-header">
                                <strong>{order.order_number}</strong>
                                <span className="customer-name">{order.customer}</span>
                              </div>
                              <div className="stop-route">
                                <span className="origin">{order.origin}</span>
                                <span className="arrow">→</span>
                                <span className="destination">{order.destination}</span>
                              </div>
                              <div className="stop-metrics">
                                <span>{order.weight_lbs?.toLocaleString()} lbs</span>
                                <span>•</span>
                                <span>{order.volume_cuft?.toLocaleString()} cu.ft</span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="no-orders">No orders in this load</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {loadPlan && (
        <div className="load-results">
          <div className="map-section">
            <h3>Route Visualization</h3>
            {selectedLoadForMap && mapRoutes.length > 0 ? (
              <div>
                <div className="map-header">
                  <h4>Viewing: {selectedLoadForMap.load_id}</h4>
                  <button 
                    className="btn-secondary"
                    onClick={() => {
                      setSelectedLoadForMap(null)
                      setMapRoutes([])
                    }}
                  >
                    Clear Map
                  </button>
                </div>
                <RouteMap key={selectedLoadForMap.load_id} routes={mapRoutes} />
              </div>
            ) : (
              <div className="map-placeholder">
                <p>Click "View on Map" for any load below to visualize its routes</p>
              </div>
            )}
          </div>

          <h3>Optimization Results</h3>
          
          <div className="results-summary">
            <div className="summary-card">
              <div className="summary-label">Total Orders</div>
              <div className="summary-value">{loadPlan.summary.total_orders}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Total Loads</div>
              <div className="summary-value">{loadPlan.summary.total_loads}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Avg Utilization</div>
              <div className="summary-value">{loadPlan.summary.avg_utilization}%</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Cost Savings</div>
              <div className="summary-value">{loadPlan.summary.cost_savings_percent}%</div>
              <div className="tooltip-container">
                <span className="info-icon">ⓘ</span>
                <div className="tooltip-text">
                  Cost savings from load consolidation. More stops per truck = higher savings. 
                  Calculated based on reducing total trucks needed through multi-stop routing 
                  (estimated 15% savings per additional stop, up to 50% maximum).
                </div>
              </div>
            </div>
          </div>

          <div className="loads-list">
            <h4>Optimized Loads</h4>
            {loadPlan.loads.map((load, index) => (
              <div key={index} className="load-card">
                <div 
                  className="load-header clickable"
                  onClick={() => toggleLoadExpanded(load.load_id)}
                >
                  <div className="load-header-left">
                    <span className="expand-icon">{expandedLoads[load.load_id] ? '▼' : '▶'}</span>
                    <h5>{load.load_id}</h5>
                    <span className="truck-type">{load.truck_type}</span>
                  </div>
                  <div className="load-header-right">
                    <button 
                      className="btn-map"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleViewOnMap(load)
                      }}
                      disabled={loadingMap}
                    >
                      {loadingMap ? 'Loading...' : 'View on Map'}
                    </button>
                    <span className="order-count">{load.orders?.length || 0} orders</span>
                  </div>
                </div>
                <div className="load-summary">
                  <div className="load-stat">
                    <span className="stat-label">Weight:</span>
                    <span className="stat-value">{load.total_weight_lbs?.toLocaleString() || 0} lbs</span>
                  </div>
                  <div className="load-stat">
                    <span className="stat-label">Volume:</span>
                    <span className="stat-value">{load.total_volume_cuft?.toLocaleString() || 0} cu.ft</span>
                  </div>
                  <div className="load-stat">
                    <span className="stat-label">Utilization:</span>
                    <span className="stat-value">{load.utilization_percent || 0}%</span>
                  </div>
                </div>
                
                {expandedLoads[load.load_id] && (
                  <div className="load-details-expanded">
                    <h6>Stop Sequence</h6>
                    <div className="stop-sequence">
                      {load.orders && load.orders.length > 0 ? (
                        load.orders.map((order, orderIndex) => (
                          <div key={orderIndex} className="stop-card">
                            <div className="stop-number">{orderIndex + 1}</div>
                            <div className="stop-info">
                              <div className="stop-header">
                                <strong>{order.order_number}</strong>
                                <span className="customer-name">{order.customer || 'N/A'}</span>
                              </div>
                              <div className="stop-route">
                                <span className="origin">{order.origin}</span>
                                <span className="arrow">→</span>
                                <span className="destination">{order.destination}</span>
                              </div>
                              <div className="stop-metrics">
                                <span>{order.weight_lbs?.toLocaleString() || 0} lbs</span>
                                <span>•</span>
                                <span>{order.volume_cuft?.toLocaleString() || 0} cu.ft</span>
                                {order.priority && (
                                  <>
                                    <span>•</span>
                                    <span className={`priority priority-${order.priority?.toLowerCase()}`}>
                                      {order.priority}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="no-orders">No order details available</p>
                      )}
                    </div>
                    {load.reasoning && (
                      <div className="load-reasoning">
                        <strong>Reasoning:</strong> {load.reasoning}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!loadPlan && !loading && (
        <div className="empty-state">
          <p>Click "Optimize Loads" to use AI to consolidate pending orders into efficient truck loads</p>
          <p>The system will analyze weight, volume, origins, and destinations to create optimal loads</p>
        </div>
      )}
    </div>
  )
}

export default LoadPlanning
