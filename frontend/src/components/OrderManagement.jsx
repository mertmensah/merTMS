import { useState, useEffect } from 'react'
import { tmsAPI } from '../services/api'
import './OrderManagement.css'

function OrderManagement() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState(new Set())
  const [contextMenu, setContextMenu] = useState(null)
  const rowsPerPage = 50

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await tmsAPI.getOrders()
      const ordersData = response.data?.data || response.data || []
      setOrders(ordersData)
    } catch (error) {
      console.error('Error fetching orders:', error)
      alert('Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate50Orders = async () => {
    try {
      setGenerating(true)
      const response = await tmsAPI.generateOrders(50)
      console.log('Generate orders response:', response.data)
      alert(`Successfully generated 50 new orders! Total orders: ${response.data.count || 50}`)
      await fetchOrders()
    } catch (error) {
      console.error('Error generating orders:', error)
      alert(`Failed to generate orders: ${error.response?.data?.error || error.message}`)
    } finally {
      setGenerating(false)
    }
  }

  const handleClearOrders = async () => {
    if (!confirm('This will delete ALL orders from the database. Are you sure?')) {
      return
    }
    
    try {
      setClearing(true)
      await tmsAPI.clearOrders()
      alert('All orders cleared')
      setOrders([])
    } catch (error) {
      console.error('Error clearing orders:', error)
      alert('Failed to clear orders')
    } finally {
      setClearing(false)
    }
  }

  // Pagination helpers
  const totalPages = Math.max(1, Math.ceil(orders.length / rowsPerPage))
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const currentOrders = orders.slice(startIndex, endIndex)

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage)
    setSelectedRows(new Set()) // Clear selection when changing pages
  }

  // Checkbox selection
  const handleCheckboxClick = (orderId, event) => {
    event.stopPropagation()
    const newSelected = new Set(selectedRows)
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId)
    } else {
      newSelected.add(orderId)
    }
    setSelectedRows(newSelected)
  }

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const allIds = new Set(currentOrders.map(o => o.id))
      setSelectedRows(allIds)
    } else {
      setSelectedRows(new Set())
    }
  }

  // Row selection with Ctrl/Shift support
  const handleRowClick = (orderId, event) => {
    event.preventDefault()
    
    const newSelected = new Set(selectedRows)
    
    if (event.ctrlKey || event.metaKey) {
      // Ctrl+Click: Toggle individual row
      if (newSelected.has(orderId)) {
        newSelected.delete(orderId)
      } else {
        newSelected.add(orderId)
      }
    } else if (event.shiftKey && selectedRows.size > 0) {
      // Shift+Click: Select range
      const lastSelected = Array.from(selectedRows)[selectedRows.size - 1]
      const lastIndex = currentOrders.findIndex(o => o.id === lastSelected)
      const currentIndex = currentOrders.findIndex(o => o.id === orderId)
      
      const start = Math.min(lastIndex, currentIndex)
      const end = Math.max(lastIndex, currentIndex)
      
      for (let i = start; i <= end; i++) {
        newSelected.add(currentOrders[i].id)
      }
    } else {
      // Regular click: Select only this row
      newSelected.clear()
      newSelected.add(orderId)
    }
    
    setSelectedRows(newSelected)
  }

  // Right-click context menu
  const handleContextMenu = (event, orderId) => {
    event.preventDefault()
    
    // If right-clicking on unselected row, select it
    if (!selectedRows.has(orderId)) {
      setSelectedRows(new Set([orderId]))
    }
    
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      orderId: orderId
    })
  }

  // Close context menu when clicking elsewhere
  useEffect(() => {
    const handleClick = () => setContextMenu(null)
    if (contextMenu) {
      document.addEventListener('click', handleClick)
      return () => document.removeEventListener('click', handleClick)
    }
  }, [contextMenu])

  const selectAllOnPage = () => {
    const allIds = new Set(currentOrders.map(o => o.id))
    setSelectedRows(allIds)
  }

  const clearSelection = () => {
    setSelectedRows(new Set())
  }

  // Export functions
  const exportSelectedToCSV = () => {
    const dataToExport = orders.filter(o => selectedRows.has(o.id))
    exportDataToCSV(dataToExport, 'selected')
  }

  const exportAllToCSV = () => {
    exportDataToCSV(orders, 'all')
  }

  const exportPageToCSV = () => {
    exportDataToCSV(currentOrders, 'page')
  }

  const exportDataToCSV = (data, type) => {
    const headers = ['Order Number', 'Customer', 'Origin', 'Destination', 'Weight (lbs)', 'Volume (cuft)', 'Priority', 'Status', 'Delivery Start', 'Delivery End']
    const csvRows = [
      headers.join(','),
      ...data.map(order => [
        order.order_number,
        `"${order.customer}"`,
        `"${order.origin}"`,
        `"${order.destination}"`,
        order.weight_lbs,
        order.volume_cuft,
        order.priority,
        order.status,
        order.delivery_window_start,
        order.delivery_window_end
      ].join(','))
    ]
    
    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `orders_${type}_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setContextMenu(null)
  }

  if (loading) {
    return <div className="loading">Loading orders...</div>
  }

  return (
    <div className="order-management">
      <div className="header-section">
        <h2>Order Management</h2>
        <div className="button-group">
          <button 
            className="btn-primary" 
            onClick={handleGenerate50Orders}
            disabled={generating || clearing}
          >
            {generating ? 'Generating...' : '📦 Generate 50 Sample Orders'}
          </button>
          <button 
            className="btn-danger" 
            onClick={handleClearOrders}
            disabled={generating || clearing}
          >
            {clearing ? 'Clearing...' : 'Clear All Orders'}
          </button>
        </div>
      </div>

      <div className="orders-summary">
        <p><strong>Total Orders:</strong> {orders.length} {orders.length >= 1000 && '(Supabase limit)'}</p>
        <p><strong>Pending:</strong> {orders.filter(o => o.status === 'Pending').length}</p>
        <p><strong>Page:</strong> {currentPage} of {totalPages} | <strong>Showing:</strong> {startIndex + 1}-{Math.min(endIndex, orders.length)} of {orders.length}</p>
        {selectedRows.size > 0 && <p><strong>Selected:</strong> {selectedRows.size} orders</p>}
        <p className="info-note">💡 <em>Right-click on any row for export options. Use Ctrl+Click for multi-select, Shift+Click for range select.</em></p>
      </div>

      <div className="orders-table">
        <table>
          <thead>
            <tr>
              <th style={{ width: '50px', textAlign: 'center' }}>
                <input 
                  type="checkbox" 
                  checked={selectedRows.size > 0 && selectedRows.size === currentOrders.length}
                  onChange={handleSelectAll}
                  style={{ cursor: 'pointer' }}
                />
              </th>
              <th>Order #</th>
              <th>Customer</th>
              <th>Origin</th>
              <th>Destination</th>
              <th>Weight (lbs)</th>
              <th>Volume (cu.ft)</th>
              <th>Priority</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {currentOrders.map(order => (
              <tr 
                key={order.id}
                onClick={(e) => handleRowClick(order.id, e)}
                onContextMenu={(e) => handleContextMenu(e, order.id)}
                className={selectedRows.has(order.id) ? 'selected-row' : ''}
              >
                <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                  <input 
                    type="checkbox" 
                    checked={selectedRows.has(order.id)}
                    onChange={(e) => handleCheckboxClick(order.id, e)}
                    style={{ cursor: 'pointer' }}
                  />
                </td>
                <td className="order-number">{order.order_number}</td>
                <td>{order.customer}</td>
                <td>{order.origin}</td>
                <td>{order.destination}</td>
                <td>{order.weight_lbs.toLocaleString()}</td>
                <td>{order.volume_cuft.toLocaleString()}</td>
                <td>
                  <span className={`priority priority-${order.priority.toLowerCase()}`}>
                    {order.priority}
                  </span>
                </td>
                <td>
                  <span className={`status status-${order.status.toLowerCase()}`}>
                    {order.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {orders.length === 0 && (
          <div className="empty-state">
            <p>No orders found. Generate some test orders to get started!</p>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div 
          className="context-menu"
          style={{
            position: 'fixed',
            top: `${contextMenu.y}px`,
            left: `${contextMenu.x}px`,
            zIndex: 1000
          }}
        >
          <div className="context-menu-item" onClick={exportSelectedToCSV}>
            📥 Export Selected ({selectedRows.size}) to CSV
          </div>
          <div className="context-menu-item" onClick={exportPageToCSV}>
            📄 Export Current Page ({currentOrders.length}) to CSV
          </div>
          <div className="context-menu-item" onClick={exportAllToCSV}>
            📊 Export All Orders ({orders.length}) to CSV
          </div>
          <div className="context-menu-divider"></div>
          <div className="context-menu-item" onClick={selectAllOnPage}>
            ✓ Select All on Page
          </div>
          <div className="context-menu-item" onClick={clearSelection}>
            ✗ Clear Selection
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {orders.length > 0 && (
        <div className="pagination-controls">
          <button 
            onClick={() => handlePageChange(1)} 
            disabled={currentPage === 1}
            className="btn-pagination"
          >
            ⏮ First
          </button>
          <button 
            onClick={() => handlePageChange(currentPage - 1)} 
            disabled={currentPage === 1}
            className="btn-pagination"
          >
            ◀ Previous
          </button>
          <span className="page-info">
            Page {currentPage} of {totalPages}
          </span>
          <button 
            onClick={() => handlePageChange(currentPage + 1)} 
            disabled={currentPage === totalPages}
            className="btn-pagination"
          >
            Next ▶
          </button>
          <button 
            onClick={() => handlePageChange(totalPages)} 
            disabled={currentPage === totalPages}
            className="btn-pagination"
          >
            Last ⏭
          </button>
        </div>
      )}
    </div>
  )
}

export default OrderManagement
