import { useState, useEffect } from 'react'
import { tmsAPI } from '../services/api'
import './Products.css'

function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [expandedProduct, setExpandedProduct] = useState(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const response = await tmsAPI.getProducts()
      const productsData = response.data?.data || response.data || []
      setProducts(productsData)
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSeedProducts = async () => {
    if (!confirm('This will seed 10 sample products. Continue?')) {
      return
    }
    
    try {
      setLoading(true)
      await tmsAPI.seedProducts()
      alert('Products seeded successfully!')
      fetchProducts()
    } catch (error) {
      console.error('Error seeding products:', error)
      alert('Failed to seed products')
    } finally {
      setLoading(false)
    }
  }

  const toggleProductExpanded = (productId) => {
    setExpandedProduct(expandedProduct === productId ? null : productId)
  }

  const calculateCartonVolume = (product) => {
    const volume = (product.carton_length_in * product.carton_width_in * product.carton_height_in) / 1728
    return volume.toFixed(2)
  }

  const calculatePalletWeight = (product) => {
    return (product.carton_weight_lbs * product.units_per_pallet).toFixed(0)
  }

  if (loading && products.length === 0) {
    return <div className="products"><p>Loading products...</p></div>
  }

  return (
    <div className="products">
      <div className="products-header">
        <div>
          <h2>Products Catalog</h2>
          <p>Manage product SKUs, dimensions, weights, and handling requirements</p>
        </div>
        <button className="btn-primary" onClick={handleSeedProducts} disabled={loading}>
          {products.length === 0 ? 'Seed Sample Products' : 'Refresh Products'}
        </button>
      </div>

      <div className="products-stats">
        <div className="stat-card">
          <h3>Total Products</h3>
          <p className="stat-value">{products.length}</p>
        </div>
        <div className="stat-card">
          <h3>Hazmat Items</h3>
          <p className="stat-value">{products.filter(p => p.is_hazmat).length}</p>
        </div>
        <div className="stat-card">
          <h3>Non-Hazmat Items</h3>
          <p className="stat-value">{products.filter(p => !p.is_hazmat).length}</p>
        </div>
      </div>

      <div className="products-list">
        {products.length === 0 ? (
          <div className="empty-state">
            <p>No products in catalog. Click "Seed Sample Products" to add sample data.</p>
          </div>
        ) : (
          products.map(product => (
            <div key={product.id} className="product-card">
              <div 
                className="product-header clickable"
                onClick={() => toggleProductExpanded(product.id)}
              >
                <div className="product-info">
                  <h3>{product.product_id}</h3>
                  <p className="product-name">{product.name}</p>
                  {product.is_hazmat && <span className="hazmat-badge">⚠️ HAZMAT</span>}
                </div>
                <span className="expand-icon">
                  {expandedProduct === product.id ? '▼' : '▶'}
                </span>
              </div>

              {expandedProduct === product.id && (
                <div className="product-details">
                  <div className="detail-section">
                    <h4>Description</h4>
                    <p>{product.description}</p>
                  </div>

                  <div className="detail-section">
                    <h4>Carton Dimensions</h4>
                    <div className="dimensions-grid">
                      <div className="dimension-item">
                        <span className="label">Length:</span>
                        <span className="value">{product.carton_length_in}"</span>
                      </div>
                      <div className="dimension-item">
                        <span className="label">Width:</span>
                        <span className="value">{product.carton_width_in}"</span>
                      </div>
                      <div className="dimension-item">
                        <span className="label">Height:</span>
                        <span className="value">{product.carton_height_in}"</span>
                      </div>
                      <div className="dimension-item">
                        <span className="label">Weight:</span>
                        <span className="value">{product.carton_weight_lbs} lbs</span>
                      </div>
                      <div className="dimension-item">
                        <span className="label">Volume:</span>
                        <span className="value">{calculateCartonVolume(product)} cu.ft</span>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h4>Pallet Information</h4>
                    <div className="pallet-info">
                      <div className="info-item">
                        <span className="label">Units per Pallet:</span>
                        <span className="value">{product.units_per_pallet}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Pallet Weight:</span>
                        <span className="value">{calculatePalletWeight(product)} lbs</span>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h4>Compliance</h4>
                    <div className="compliance-info">
                      <div className="info-item">
                        <span className="label">HS Code:</span>
                        <span className="value">{product.hs_code || 'N/A'}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Hazmat Status:</span>
                        <span className={`value ${product.is_hazmat ? 'hazmat' : 'safe'}`}>
                          {product.is_hazmat ? 'Hazardous Material' : 'Non-Hazmat'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Products
