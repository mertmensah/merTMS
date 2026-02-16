import { useState, useEffect } from 'react'
import { tmsAPI } from '../services/api'
import './SyntheticDataGenerator.css'

function SyntheticDataGenerator() {
  const [activeTab, setActiveTab] = useState('orders')
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    orders: 0,
    loads: 0,
    facilities: 0,
    products: 0
  })
  
  // Order generation state
  const [orderCount, setOrderCount] = useState(50)
  const [orderGenerating, setOrderGenerating] = useState(false)
  const [orderHistory, setOrderHistory] = useState([])
  
  // Load simulation state
  const [loadSimulating, setLoadSimulating] = useState(false)
  const [loadHistory, setLoadHistory] = useState([])
  
  // Facility/Product seed state
  const [facilitiesSeeded, setFacilitiesSeeded] = useState(false)
  const [productsSeeded, setProductsSeeded] = useState(false)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const [ordersRes, loadsRes, facilitiesRes, productsRes] = await Promise.all([
        tmsAPI.getOrders().catch(e => ({ data: [] })),
        tmsAPI.getLoads().catch(e => ({ data: [] })),
        tmsAPI.getFacilities().catch(e => ({ data: [] })),
        tmsAPI.getProducts().catch(e => ({ data: [] }))
      ])
      
      // Handle different response structures (data.data vs data)
      const getArrayLength = (response) => {
        if (!response) return 0
        const data = response.data?.data || response.data
        return Array.isArray(data) ? data.length : 0
      }
      
      setStats({
        orders: getArrayLength(ordersRes),
        loads: getArrayLength(loadsRes),
        facilities: getArrayLength(facilitiesRes),
        products: getArrayLength(productsRes)
      })
      
      setFacilitiesSeeded(getArrayLength(facilitiesRes) > 0)
      setProductsSeeded(getArrayLength(productsRes) > 0)
    } catch (error) {
      console.error('Error fetching stats:', error)
      // Set defaults so UI doesn't crash
      setStats({
        orders: 0,
        loads: 0,
        facilities: 0,
        products: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateOrders = async (monthly = false) => {
    try {
      setOrderGenerating(true)
      const response = monthly 
        ? await tmsAPI.generateMonthlyOrders()
        : await tmsAPI.generateOrders(orderCount)
      
      const timestamp = new Date().toLocaleString()
      const newEntry = {
        timestamp,
        count: response.data.count || (monthly ? 4000 : orderCount),
        type: monthly ? 'Monthly (4,000)' : `${orderCount} orders`
      }
      
      setOrderHistory([newEntry, ...orderHistory.slice(0, 9)])
      await fetchStats()
      
      alert(`✅ Successfully generated ${newEntry.count} orders!`)
    } catch (error) {
      console.error('Error generating orders:', error)
      alert(`❌ Failed to generate orders: ${error.response?.data?.error || error.message}`)
    } finally {
      setOrderGenerating(false)
    }
  }

  const handleClearOrders = async () => {
    if (!window.confirm('⚠️ This will delete ALL orders from the database. Are you sure?')) {
      return
    }
    
    try {
      setOrderGenerating(true)
      await tmsAPI.clearOrders()
      await fetchStats()
      setOrderHistory([])
      alert('✅ All orders cleared successfully!')
    } catch (error) {
      console.error('Error clearing orders:', error)
      alert(`❌ Failed to clear orders: ${error.response?.data?.error || error.message}`)
    } finally {
      setOrderGenerating(false)
    }
  }

  const handleSimulateLoads = async () => {
    try {
      setLoadSimulating(true)
      const response = await tmsAPI.simulateTodayLoads()
      
      const timestamp = new Date().toLocaleString()
      const newEntry = {
        timestamp,
        count: response.data.loads_created || 8,
        type: "Today's loads simulation"
      }
      
      setLoadHistory([newEntry, ...loadHistory.slice(0, 9)])
      await fetchStats()
      
      alert(`✅ Successfully simulated ${newEntry.count} loads!`)
    } catch (error) {
      console.error('Error simulating loads:', error)
      alert(`❌ Failed to simulate loads: ${error.response?.data?.error || error.message}`)
    } finally {
      setLoadSimulating(false)
    }
  }

  const handleSeedFacilities = async () => {
    try {
      setLoading(true)
      const response = await tmsAPI.seedFacilities()
      await fetchStats()
      alert(`✅ Successfully seeded ${response.data.count || 0} facilities!`)
    } catch (error) {
      console.error('Error seeding facilities:', error)
      alert(`❌ Failed to seed facilities: ${error.response?.data?.error || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSeedProducts = async () => {
    try {
      setLoading(true)
      const response = await tmsAPI.seedProducts()
      await fetchStats()
      alert(`✅ Successfully seeded ${response.data.count || 0} products!`)
    } catch (error) {
      console.error('Error seeding products:', error)
      alert(`❌ Failed to seed products: ${error.response?.data?.error || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="synthetic-data-generator">
      <div className="generator-header">
        <div>
          <h2>🧪 Synthetic Data Generator</h2>
          <p>Generate realistic test data for development, demos, and testing</p>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="stats-dashboard">
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <h3>Orders</h3>
            <p className="stat-value">{(stats.orders || 0).toLocaleString()}</p>
            <span className="stat-label">Total in database</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🚛</div>
          <div className="stat-content">
            <h3>Loads</h3>
            <p className="stat-value">{(stats.loads || 0).toLocaleString()}</p>
            <span className="stat-label">Total in database</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏭</div>
          <div className="stat-content">
            <h3>Facilities</h3>
            <p className="stat-value">{stats.facilities || 0}</p>
            <span className="stat-label status">{facilitiesSeeded ? '✅ Seeded' : '⚠️ Not seeded'}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <h3>Products</h3>
            <p className="stat-value">{stats.products || 0}</p>
            <span className="stat-label status">{productsSeeded ? '✅ Seeded' : '⚠️ Not seeded'}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="generator-tabs">
        <button 
          className={`tab ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          📋 Orders
        </button>
        <button 
          className={`tab ${activeTab === 'loads' ? 'active' : ''}`}
          onClick={() => setActiveTab('loads')}
        >
          🚛 Loads
        </button>
        <button 
          className={`tab ${activeTab === 'master-data' ? 'active' : ''}`}
          onClick={() => setActiveTab('master-data')}
        >
          🗄️ Master Data
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'orders' && (
          <div className="orders-generator">
            <div className="generator-section">
              <h3>📦 Generate Sample Orders</h3>
              <p className="section-description">
                Create realistic synthetic orders from Toronto-area facilities to US destinations.
                Orders include proper coordinates, weights, dimensions, and delivery requirements.
              </p>
              
              <div className="control-group">
                <label htmlFor="orderCount">Number of Orders:</label>
                <div className="input-with-buttons">
                  <input 
                    type="number" 
                    id="orderCount"
                    value={orderCount}
                    onChange={(e) => setOrderCount(Math.max(1, parseInt(e.target.value) || 1))}
                    min="1"
                    max="5000"
                    disabled={orderGenerating}
                  />
                  <div className="quick-select">
                    <button onClick={() => setOrderCount(10)} disabled={orderGenerating}>10</button>
                    <button onClick={() => setOrderCount(50)} disabled={orderGenerating}>50</button>
                    <button onClick={() => setOrderCount(100)} disabled={orderGenerating}>100</button>
                    <button onClick={() => setOrderCount(500)} disabled={orderGenerating}>500</button>
                  </div>
                </div>
              </div>

              <div className="action-buttons">
                <button 
                  className="btn-primary"
                  onClick={() => handleGenerateOrders(false)}
                  disabled={orderGenerating || loading}
                >
                  {orderGenerating ? '⏳ Generating...' : `✨ Generate ${orderCount} Orders`}
                </button>
                <button 
                  className="btn-secondary"
                  onClick={() => handleGenerateOrders(true)}
                  disabled={orderGenerating || loading}
                >
                  {orderGenerating ? '⏳ Generating...' : '📅 Generate Monthly (≈4,000)'}
                </button>
                <button 
                  className="btn-danger"
                  onClick={handleClearOrders}
                  disabled={orderGenerating || loading || stats.orders === 0}
                >
                  🗑️ Clear All Orders
                </button>
              </div>

              {orderHistory.length > 0 && (
                <div className="generation-history">
                  <h4>Recent Generations</h4>
                  <div className="history-list">
                    {orderHistory.map((entry, idx) => (
                      <div key={idx} className="history-item">
                        <span className="history-time">{entry.timestamp}</span>
                        <span className="history-details">
                          Generated {(entry.count || 0).toLocaleString()} orders ({entry.type})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'loads' && (
          <div className="loads-generator">
            <div className="generator-section">
              <h3>🚛 Simulate Load Scenarios</h3>
              <p className="section-description">
                Create realistic load scenarios for Control Tower testing. Generates loads with various
                statuses (delivered, on-time, at-risk) scheduled for today's delivery.
              </p>

              <div className="simulation-options">
                <div className="option-card">
                  <h4>📍 Today's Delivery Loads</h4>
                  <p>Creates 8-10 loads with mixed statuses for Control Tower monitoring</p>
                  <ul className="feature-list">
                    <li>✅ 3 Delivered loads (green status)</li>
                    <li>🟢 3 On-time loads (tracking normally)</li>
                    <li>⚠️ 2 At-risk loads (yellow alerts)</li>
                    <li>📅 All scheduled for today's delivery</li>
                  </ul>
                  <button 
                    className="btn-primary"
                    onClick={handleSimulateLoads}
                    disabled={loadSimulating || loading || stats.orders < 10}
                  >
                    {loadSimulating ? '⏳ Simulating...' : '🎬 Simulate Today\'s Loads'}
                  </button>
                  {stats.orders < 10 && (
                    <p className="warning-text">⚠️ Need at least 10 pending orders to simulate loads</p>
                  )}
                </div>
              </div>

              {loadHistory.length > 0 && (
                <div className="generation-history">
                  <h4>Recent Simulations</h4>
                  <div className="history-list">
                    {loadHistory.map((entry, idx) => (
                      <div key={idx} className="history-item">
                        <span className="history-time">{entry.timestamp}</span>
                        <span className="history-details">
                          Created {entry.count} loads ({entry.type})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'master-data' && (
          <div className="master-data-generator">
            <div className="generator-section">
              <h3>🗄️ Seed Master Data</h3>
              <p className="section-description">
                Initialize reference data tables with sample data. These should only be run once
                during initial setup or when resetting the database.
              </p>

              <div className="seed-options">
                <div className="seed-card">
                  <div className="seed-header">
                    <h4>🏭 Facilities Network</h4>
                    <span className={`seed-status ${facilitiesSeeded ? 'seeded' : 'not-seeded'}`}>
                      {facilitiesSeeded ? '✅ Seeded' : '⚠️ Not Seeded'}
                    </span>
                  </div>
                  <p>
                    Seeds {stats.facilities || '50+'} facilities including Toronto-area origins and US destinations
                    with accurate coordinates for mapping and routing.
                  </p>
                  <button 
                    className="btn-secondary"
                    onClick={handleSeedFacilities}
                    disabled={loading || facilitiesSeeded}
                  >
                    {facilitiesSeeded ? '✅ Already Seeded' : '🌱 Seed Facilities'}
                  </button>
                </div>

                <div className="seed-card">
                  <div className="seed-header">
                    <h4>📦 Product Catalog</h4>
                    <span className={`seed-status ${productsSeeded ? 'seeded' : 'not-seeded'}`}>
                      {productsSeeded ? '✅ Seeded' : '⚠️ Not Seeded'}
                    </span>
                  </div>
                  <p>
                    Seeds {stats.products || '20+'} product SKUs with realistic dimensions, weights, 
                    pallet configurations, and hazmat classifications.
                  </p>
                  <button 
                    className="btn-secondary"
                    onClick={handleSeedProducts}
                    disabled={loading || productsSeeded}
                  >
                    {productsSeeded ? '✅ Already Seeded' : '🌱 Seed Products'}
                  </button>
                </div>
              </div>

              <div className="info-box">
                <h4>ℹ️ About Master Data</h4>
                <p>
                  Master data tables (facilities, products, carriers) should be seeded before generating
                  transactional data (orders, loads). These tables provide the reference data used by the
                  order and load generators.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SyntheticDataGenerator
