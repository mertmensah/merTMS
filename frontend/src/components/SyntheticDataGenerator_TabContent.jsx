// This file contains the tab content template for the enhanced Synthetic Data Generator
// Copy this content to replace the tab content section

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
