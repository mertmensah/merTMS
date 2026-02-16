import { useState, useEffect } from 'react'
import { tmsAPI } from '../services/api'
import './SyntheticDataGenerator.css'

function SyntheticDataGenerator() {
  const [activeTab, setActiveTab] = useState('orders')
  const [activeSubTab, setActiveSubTab] = useState('bulk') // 'bulk' or 'individual'
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
  
  // Individual Order Form
  const [newOrder, setNewOrder] = useState({
    customer: '',
    destination: '',
    weight_lbs: '',
    volume_cuft: '',
    delivery_date: new Date().toISOString().split('T')[0]
  })
  
  // Load simulation state
  const [loadSimulating, setLoadSimulating] = useState(false)
  const [loadHistory, setLoadHistory] = useState([])
  
  // Individual Load Form
  const [newLoad, setNewLoad] = useState({
    load_number: '',
    origin: '',
    truck_type: '53ft Dry Van',
    status: 'Planning'
  })
  
  // Facility/Product seed state
  const [facilitiesSeeded, setFacilitiesSeeded] = useState(false)
  const [productsSeeded, setProductsSeeded] = useState(false)
  
  // Individual Facility Form
  const [newFacility, setNewFacility] = useState({
    facility_code: '',
    facility_name: '',
    city: '',
    state_province: '',
    country: '',
    latitude: '',
    longitude: '',
    facility_type: 'Distribution Center'
  })
  
  // Individual Product Form
  const [newProduct, setNewProduct] = useState({
    sku: '',
    product_name: '',
    weight_lbs: '',
    length_in: '',
    width_in: '',
    height_in: '',
    category: 'General Freight'
  })

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

  // Individual Creation Handlers
  const handleCreateOrder = async (e) => {
    e.preventDefault()
    if (!newOrder.customer || !newOrder.destination || !newOrder.weight_lbs || !newOrder.volume_cuft) {
      alert('⚠️ Please fill in all required fields')
      return
    }
    
    try {
      setOrderGenerating(true)
      const orderData = {
        order_number: `ORD-${Date.now()}`,
        customer: newOrder.customer,
        destination: newOrder.destination,
        weight_lbs: parseFloat(newOrder.weight_lbs),
        volume_cuft: parseFloat(newOrder.volume_cuft),
        customer_expected_delivery_date: newOrder.delivery_date,
        status: 'Pending',
        priority: 'Standard'
      }
      
      await tmsAPI.createOrder(orderData)
      await fetchStats()
      
      // Reset form
      setNewOrder({
        customer: '',
        destination: '',
        weight_lbs: '',
        volume_cuft: '',
        delivery_date: new Date().toISOString().split('T')[0]
      })
      
      alert(`✅ Order ${orderData.order_number} created successfully!`)
    } catch (error) {
      console.error('Error creating order:', error)
      alert(`❌ Failed to create order: ${error.response?.data?.error || error.message}`)
    } finally {
      setOrderGenerating(false)
    }
  }

  const handleCreateLoad = async (e) => {
    e.preventDefault()
    if (!newLoad.load_number || !newLoad.origin) {
      alert('⚠️ Please fill in all required fields')
      return
    }
    
    try {
      setLoadSimulating(true)
      const loadData = {
        load_number: newLoad.load_number,
        origin: newLoad.origin,
        truck_type: newLoad.truck_type,
        status: newLoad.status,
        total_weight_lbs: 0,
        total_volume_cuft: 0,
        utilization_percent: 0,
        orders: []
      }
      
      await tmsAPI.createLoad(loadData)
      await fetchStats()
      
      // Reset form
      setNewLoad({
        load_number: '',
        origin: '',
        truck_type: '53ft Dry Van',
        status: 'Planning'
      })
      
      alert(`✅ Load ${loadData.load_number} created successfully!`)
    } catch (error) {
      console.error('Error creating load:', error)
      alert(`❌ Failed to create load: ${error.response?.data?.error || error.message}`)
    } finally {
      setLoadSimulating(false)
    }
  }

  const handleCreateFacility = async (e) => {
    e.preventDefault()
    if (!newFacility.facility_code || !newFacility.facility_name || !newFacility.city) {
      alert('⚠️ Please fill in all required fields')
      return
    }
    
    try {
      setLoading(true)
      const facilityData = {
        facility_code: newFacility.facility_code,
        facility_name: newFacility.facility_name,
        city: newFacility.city,
        state_province: newFacility.state_province,
        country: newFacility.country,
        latitude: newFacility.latitude ? parseFloat(newFacility.latitude) : null,
        longitude: newFacility.longitude ? parseFloat(newFacility.longitude) : null,
        facility_type: newFacility.facility_type
      }
      
      await tmsAPI.createFacility(facilityData)
      await fetchStats()
      
      // Reset form
      setNewFacility({
        facility_code: '',
        facility_name: '',
        city: '',
        state_province: '',
        country: '',
        latitude: '',
        longitude: '',
        facility_type: 'Distribution Center'
      })
      
      alert(`✅ Facility ${facilityData.facility_code} created successfully!`)
    } catch (error) {
      console.error('Error creating facility:', error)
      alert(`❌ Failed to create facility: ${error.response?.data?.error || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProduct = async (e) => {
    e.preventDefault()
    if (!newProduct.sku || !newProduct.product_name || !newProduct.weight_lbs) {
      alert('⚠️ Please fill in all required fields')
      return
    }
    
    try {
      setLoading(true)
      const productData = {
        sku: newProduct.sku,
        product_name: newProduct.product_name,
        weight_lbs: parseFloat(newProduct.weight_lbs),
        length_in: newProduct.length_in ? parseFloat(newProduct.length_in) : null,
        width_in: newProduct.width_in ? parseFloat(newProduct.width_in) : null,
        height_in: newProduct.height_in ? parseFloat(newProduct.height_in) : null,
        category: newProduct.category
      }
      
      await tmsAPI.createProduct(productData)
      await fetchStats()
      
      // Reset form
      setNewProduct({
        sku: '',
        product_name: '',
        weight_lbs: '',
        length_in: '',
        width_in: '',
        height_in: '',
        category: 'General Freight'
      })
      
      alert(`✅ Product ${productData.sku} created successfully!`)
    } catch (error) {
      console.error('Error creating product:', error)
      alert(`❌ Failed to create product: ${error.response?.data?.error || error.message}`)
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
          onClick={() => { setActiveTab('orders'); setActiveSubTab('bulk'); }}
        >
          📋 Orders
        </button>
        <button 
          className={`tab ${activeTab === 'loads' ? 'active' : ''}`}
          onClick={() => { setActiveTab('loads'); setActiveSubTab('bulk'); }}
        >
          🚛 Loads
        </button>
        <button 
          className={`tab ${activeTab === 'facilities' ? 'active' : ''}`}
          onClick={() => { setActiveTab('facilities'); setActiveSubTab('bulk'); }}
        >
          🏭 Facilities
        </button>
        <button 
          className={`tab ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => { setActiveTab('products'); setActiveSubTab('bulk'); }}
        >
          📦 Products
        </button>
      </div>

      {/* Sub-tabs */}
      <div className="generator-subtabs">
        <button 
          className={`subtab ${activeSubTab === 'bulk' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('bulk')}
        >
          ⚡ Bulk Generation
        </button>
        <button 
          className={`subtab ${activeSubTab === 'individual' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('individual')}
        >
          ➕ Create Individual
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <>
            {activeSubTab === 'bulk' && (
              <div className="orders-generator">
                <div className="generator-section">
                  <h3>📦 Bulk Generate Orders</h3>
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

            {activeSubTab === 'individual' && (
              <div className="individual-creator">
                <div className="generator-section">
                  <h3>➕ Create Individual Order</h3>
                  <p className="section-description">
                    Manually create a single order with custom specifications. All fields are required.
                  </p>
                  
                  <form onSubmit={handleCreateOrder} className="creation-form">
                    <div className="form-grid">
                      <div className="form-group">
                        <label htmlFor="orderCustomer">Customer Name *</label>
                        <input 
                          type="text" 
                          id="orderCustomer"
                          value={newOrder.customer}
                          onChange={(e) => setNewOrder({...newOrder, customer: e.target.value})}
                          placeholder="e.g., ABC Corporation"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="orderDestination">Destination *</label>
                        <input 
                          type="text" 
                          id="orderDestination"
                          value={newOrder.destination}
                          onChange={(e) => setNewOrder({...newOrder, destination: e.target.value})}
                          placeholder="e.g., Chicago, IL"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="orderWeight">Weight (lbs) *</label>
                        <input 
                          type="number" 
                          id="orderWeight"
                          value={newOrder.weight_lbs}
                          onChange={(e) => setNewOrder({...newOrder, weight_lbs: e.target.value})}
                          placeholder="e.g., 1500"
                          min="1"
                          step="0.01"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="orderVolume">Volume (cu.ft) *</label>
                        <input 
                          type="number" 
                          id="orderVolume"
                          value={newOrder.volume_cuft}
                          onChange={(e) => setNewOrder({...newOrder, volume_cuft: e.target.value})}
                          placeholder="e.g., 200"
                          min="1"
                          step="0.01"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="orderDeliveryDate">Expected Delivery Date *</label>
                        <input 
                          type="date" 
                          id="orderDeliveryDate"
                          value={newOrder.delivery_date}
                          onChange={(e) => setNewOrder({...newOrder, delivery_date: e.target.value})}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-actions">
                      <button 
                        type="submit" 
                        className="btn-primary"
                        disabled={orderGenerating || loading}
                      >
                        {orderGenerating ? '⏳ Creating...' : '✅ Create Order'}
                      </button>
                      <button 
                        type="button" 
                        className="btn-secondary"
                        onClick={() => setNewOrder({
                          customer: '',
                          destination: '',
                          weight_lbs: '',
                          volume_cuft: '',
                          delivery_date: new Date().toISOString().split('T')[0]
                        })}
                        disabled={orderGenerating || loading}
                      >
                        🔄 Reset Form
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}

        {/* LOADS TAB */}
        {activeTab === 'loads' && (
          <>
            {activeSubTab === 'bulk' && (
              <div className="loads-generator">
                <div className="generator-section">
                  <h3>🚛 Bulk Simulate Loads</h3>
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

            {activeSubTab === 'individual' && (
              <div className="individual-creator">
                <div className="generator-section">
                  <h3>➕ Create Individual Load</h3>
                  <p className="section-description">
                    Manually create a single load. Orders can be assigned later via Load Builder.
                  </p>
                  
                  <form onSubmit={handleCreateLoad} className="creation-form">
                    <div className="form-grid">
                      <div className="form-group">
                        <label htmlFor="loadNumber">Load Number *</label>
                        <input 
                          type="text" 
                          id="loadNumber"
                          value={newLoad.load_number}
                          onChange={(e) => setNewLoad({...newLoad, load_number: e.target.value})}
                          placeholder="e.g., LOAD-001"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="loadOrigin">Origin *</label>
                        <input 
                          type="text" 
                          id="loadOrigin"
                          value={newLoad.origin}
                          onChange={(e) => setNewLoad({...newLoad, origin: e.target.value})}
                          placeholder="e.g., Toronto, ON"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="loadTruckType">Truck Type *</label>
                        <select 
                          id="loadTruckType"
                          value={newLoad.truck_type}
                          onChange={(e) => setNewLoad({...newLoad, truck_type: e.target.value})}
                          required
                        >
                          <option value="53ft Dry Van">53ft Dry Van</option>
                          <option value="48ft Dry Van">48ft Dry Van</option>
                          <option value="53ft Refrigerated">53ft Refrigerated</option>
                          <option value="48ft Flatbed">48ft Flatbed</option>
                          <option value="26ft Box Truck">26ft Box Truck</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor="loadStatus">Status *</label>
                        <select 
                          id="loadStatus"
                          value={newLoad.status}
                          onChange={(e) => setNewLoad({...newLoad, status: e.target.value})}
                          required
                        >
                          <option value="Planning">Planning</option>
                          <option value="Dispatched">Dispatched</option>
                          <option value="In Transit">In Transit</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Delayed">Delayed</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-actions">
                      <button 
                        type="submit" 
                        className="btn-primary"
                        disabled={loadSimulating || loading}
                      >
                        {loadSimulating ? '⏳ Creating...' : '✅ Create Load'}
                      </button>
                      <button 
                        type="button" 
                        className="btn-secondary"
                        onClick={() => setNewLoad({
                          load_number: '',
                          origin: '',
                          truck_type: '53ft Dry Van',
                          status: 'Planning'
                        })}
                        disabled={loadSimulating || loading}
                      >
                        🔄 Reset Form
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}

        {/* FACILITIES TAB */}
        {activeTab === 'facilities' && (
          <>
            {activeSubTab === 'bulk' && (
              <div className="facilities-generator">
                <div className="generator-section">
                  <h3>🏭 Bulk Seed Facilities</h3>
                  <p className="section-description">
                    Initialize facility network with realistic data. Run this once during setup.
                  </p>

                  <div className="seed-options">
                    <div className="option-card">
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
                        className="btn-primary"
                        onClick={handleSeedFacilities}
                        disabled={loading || facilitiesSeeded}
                      >
                        {facilitiesSeeded ? '✅ Already Seeded' : '🌱 Seed Facilities'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSubTab === 'individual' && (
              <div className="individual-creator">
                <div className="generator-section">
                  <h3>➕ Create Individual Facility</h3>
                  <p className="section-description">
                    Add a new facility to the network. Include coordinates for accurate mapping.
                  </p>
                  
                  <form onSubmit={handleCreateFacility} className="creation-form">
                    <div className="form-grid">
                      <div className="form-group">
                        <label htmlFor="facilityCode">Facility Code *</label>
                        <input 
                          type="text" 
                          id="facilityCode"
                          value={newFacility.facility_code}
                          onChange={(e) => setNewFacility({...newFacility, facility_code: e.target.value})}
                          placeholder="e.g., TOR-DC-01"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="facilityName">Facility Name *</label>
                        <input 
                          type="text" 
                          id="facilityName"
                          value={newFacility.facility_name}
                          onChange={(e) => setNewFacility({...newFacility, facility_name: e.target.value})}
                          placeholder="e.g., Toronto Distribution Center"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="facilityCity">City *</label>
                        <input 
                          type="text" 
                          id="facilityCity"
                          value={newFacility.city}
                          onChange={(e) => setNewFacility({...newFacility, city: e.target.value})}
                          placeholder="e.g., Toronto"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="facilityState">State/Province</label>
                        <input 
                          type="text" 
                          id="facilityState"
                          value={newFacility.state_province}
                          onChange={(e) => setNewFacility({...newFacility, state_province: e.target.value})}
                          placeholder="e.g., ON"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="facilityCountry">Country</label>
                        <input 
                          type="text" 
                          id="facilityCountry"
                          value={newFacility.country}
                          onChange={(e) => setNewFacility({...newFacility, country: e.target.value})}
                          placeholder="e.g., Canada"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="facilityType">Facility Type *</label>
                        <select 
                          id="facilityType"
                          value={newFacility.facility_type}
                          onChange={(e) => setNewFacility({...newFacility, facility_type: e.target.value})}
                          required
                        >
                          <option value="Distribution Center">Distribution Center</option>
                          <option value="Warehouse">Warehouse</option>
                          <option value="Manufacturing Plant">Manufacturing Plant</option>
                          <option value="Cross-Dock">Cross-Dock</option>
                          <option value="Retail Store">Retail Store</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor="facilityLat">Latitude</label>
                        <input 
                          type="number" 
                          id="facilityLat"
                          value={newFacility.latitude}
                          onChange={(e) => setNewFacility({...newFacility, latitude: e.target.value})}
                          placeholder="e.g., 43.6532"
                          step="any"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="facilityLng">Longitude</label>
                        <input 
                          type="number" 
                          id="facilityLng"
                          value={newFacility.longitude}
                          onChange={(e) => setNewFacility({...newFacility, longitude: e.target.value})}
                          placeholder="e.g., -79.3832"
                          step="any"
                        />
                      </div>
                    </div>

                    <div className="form-actions">
                      <button 
                        type="submit" 
                        className="btn-primary"
                        disabled={loading}
                      >
                        {loading ? '⏳ Creating...' : '✅ Create Facility'}
                      </button>
                      <button 
                        type="button" 
                        className="btn-secondary"
                        onClick={() => setNewFacility({
                          facility_code: '',
                          facility_name: '',
                          city: '',
                          state_province: '',
                          country: '',
                          latitude: '',
                          longitude: '',
                          facility_type: 'Distribution Center'
                        })}
                        disabled={loading}
                      >
                        🔄 Reset Form
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}

        {/* PRODUCTS TAB */}
        {activeTab === 'products' && (
          <>
            {activeSubTab === 'bulk' && (
              <div className="products-generator">
                <div className="generator-section">
                  <h3>📦 Bulk Seed Products</h3>
                  <p className="section-description">
                    Initialize product catalog with realistic SKUs. Run this once during setup.
                  </p>

                  <div className="seed-options">
                    <div className="option-card">
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
                        className="btn-primary"
                        onClick={handleSeedProducts}
                        disabled={loading || productsSeeded}
                      >
                        {productsSeeded ? '✅ Already Seeded' : '🌱 Seed Products'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSubTab === 'individual' && (
              <div className="individual-creator">
                <div className="generator-section">
                  <h3>➕ Create Individual Product</h3>
                  <p className="section-description">
                    Add a new product SKU to the catalog with specifications.
                  </p>
                  
                  <form onSubmit={handleCreateProduct} className="creation-form">
                    <div className="form-grid">
                      <div className="form-group">
                        <label htmlFor="productSKU">SKU *</label>
                        <input 
                          type="text" 
                          id="productSKU"
                          value={newProduct.sku}
                          onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})}
                          placeholder="e.g., PROD-1001"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="productName">Product Name *</label>
                        <input 
                          type="text" 
                          id="productName"
                          value={newProduct.product_name}
                          onChange={(e) => setNewProduct({...newProduct, product_name: e.target.value})}
                          placeholder="e.g., Industrial Widget"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="productWeight">Weight (lbs) *</label>
                        <input 
                          type="number" 
                          id="productWeight"
                          value={newProduct.weight_lbs}
                          onChange={(e) => setNewProduct({...newProduct, weight_lbs: e.target.value})}
                          placeholder="e.g., 25"
                          min="0.01"
                          step="0.01"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="productCategory">Category *</label>
                        <select 
                          id="productCategory"
                          value={newProduct.category}
                          onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                          required
                        >
                          <option value="General Freight">General Freight</option>
                          <option value="Electronics">Electronics</option>
                          <option value="Automotive Parts">Automotive Parts</option>
                          <option value="Food & Beverage">Food & Beverage</option>
                          <option value="Pharmaceuticals">Pharmaceuticals</option>
                          <option value="Hazardous Materials">Hazardous Materials</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor="productLength">Length (inches)</label>
                        <input 
                          type="number" 
                          id="productLength"
                          value={newProduct.length_in}
                          onChange={(e) => setNewProduct({...newProduct, length_in: e.target.value})}
                          placeholder="e.g., 24"
                          min="0.01"
                          step="0.01"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="productWidth">Width (inches)</label>
                        <input 
                          type="number" 
                          id="productWidth"
                          value={newProduct.width_in}
                          onChange={(e) => setNewProduct({...newProduct, width_in: e.target.value})}
                          placeholder="e.g., 18"
                          min="0.01"
                          step="0.01"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="productHeight">Height (inches)</label>
                        <input 
                          type="number" 
                          id="productHeight"
                          value={newProduct.height_in}
                          onChange={(e) => setNewProduct({...newProduct, height_in: e.target.value})}
                          placeholder="e.g., 12"
                          min="0.01"
                          step="0.01"
                        />
                      </div>
                    </div>

                    <div className="form-actions">
                      <button 
                        type="submit" 
                        className="btn-primary"
                        disabled={loading}
                      >
                        {loading ? '⏳ Creating...' : '✅ Create Product'}
                      </button>
                      <button 
                        type="button" 
                        className="btn-secondary"
                        onClick={() => setNewProduct({
                          sku: '',
                          product_name: '',
                          weight_lbs: '',
                          length_in: '',
                          width_in: '',
                          height_in: '',
                          category: 'General Freight'
                        })}
                        disabled={loading}
                      >
                        🔄 Reset Form
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default SyntheticDataGenerator
