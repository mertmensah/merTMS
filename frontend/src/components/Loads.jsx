import React, { useState, useEffect } from 'react'
import { tmsAPI } from '../services/api'
import './Loads.css'

function Loads() {
  const [loads, setLoads] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState(new Set())
  const [contextMenu, setContextMenu] = useState(null)
  const rowsPerPage = 50

  useEffect(() => {
    fetchLoads()
  }, [])

  const fetchLoads = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await tmsAPI.getLoads()
      // Backend returns { data: [loads] }, Axios wraps as response.data
      const loadsData = response.data?.data || response.data || []
      setLoads(Array.isArray(loadsData) ? loadsData : [])
    } catch (error) {
      console.error('Error fetching loads:', error)
      setError(`Failed to fetch loads: ${error.message}`)
      setLoads([])
    } finally {
      setLoading(false)
    }
  }

  const handleSimulateLoads = async () => {
    if (!confirm('This will create 8 new test loads with today\'s delivery date. Continue?')) {
      return
    }
    
    setLoading(true)
    setError(null)
    try {
      const response = await tmsAPI.simulateTodayLoads()
      const result = response.data
      alert(`✅ Successfully created ${result.loads_created} loads:\n\n` +
            `- ${result.summary.delivered} Delivered\n` +
            `- ${result.summary.on_time} On Time (In Transit)\n` +
            `- ${result.summary.at_risk} At Risk (will be late)\n\n` +
            `${result.orders_assigned} orders assigned for ${result.date}`)
      fetchLoads()
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

  const toggleLoadExpanded = (loadId) => {
    setExpandedLoad(expandedLoad === loadId ? null : loadId)
  }

  // Pagination helpers
  const totalPages = Math.max(1, Math.ceil(loads.length / rowsPerPage))
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const currentLoads = loads.slice(startIndex, endIndex)

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage)
    setSelectedRows(new Set())
  }

  // Checkbox selection
  const handleCheckboxClick = (loadId, event) => {
    event.stopPropagation()
    const newSelected = new Set(selectedRows)
    if (newSelected.has(loadId)) {
      newSelected.delete(loadId)
    } else {
      newSelected.add(loadId)
    }
    setSelectedRows(newSelected)
  }

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const allIds = new Set(currentLoads.map(l => l.id))
      setSelectedRows(allIds)
    } else {
      setSelectedRows(new Set())
    }
  }

  // Row selection with Ctrl/Shift support
  const handleRowClick = (loadId, event) => {
    event.preventDefault()
    
    const newSelected = new Set(selectedRows)
    
    if (event.ctrlKey || event.metaKey) {
      // Ctrl+Click: Toggle individual row
      if (newSelected.has(loadId)) {
        newSelected.delete(loadId)
      } else {
        newSelected.add(loadId)
      }
    } else if (event.shiftKey && selectedRows.size > 0) {
      // Shift+Click: Select range
      const lastSelected = Array.from(selectedRows)[selectedRows.size - 1]
      const lastIndex = currentLoads.findIndex(l => l.id === lastSelected)
      const currentIndex = currentLoads.findIndex(l => l.id === loadId)
      
      const start = Math.min(lastIndex, currentIndex)
      const end = Math.max(lastIndex, currentIndex)
      
      for (let i = start; i <= end; i++) {
        newSelected.add(currentLoads[i].id)
      }
    } else {
      // Regular click: Select only this row
      newSelected.clear()
      newSelected.add(loadId)
    }
    
    setSelectedRows(newSelected)
  }

  // Right-click context menu
  const handleContextMenu = (event, loadId) => {
    event.preventDefault()
    
    // If right-clicking on unselected row, select it
    if (!selectedRows.has(loadId)) {
      setSelectedRows(new Set([loadId]))
    }
    
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      loadId: loadId
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
    const allIds = new Set(currentLoads.map(l => l.id))
    setSelectedRows(allIds)
  }

  const clearSelection = () => {
    setSelectedRows(new Set())
  }

  // Export functions
  const exportSelectedToCSV = () => {
    const dataToExport = loads.filter(l => selectedRows.has(l.id))
    exportDataToCSV(dataToExport, 'selected')
  }

  const exportAllToCSV = () => {
    exportDataToCSV(loads, 'all')
  }

  const exportPageToCSV = () => {
    exportDataToCSV(currentLoads, 'page')
  }

  const exportDataToCSV = (data, type) => {
    const headers = ['Load Number', 'Status', 'Origin', 'Truck Type', 'Weight (lbs)', 'Volume (cuft)', 'Utilization %', 'Order Count', 'Created', 'Updated']
    const csvRows = [
      headers.join(','),
      ...data.map(load => [
        load.load_number,
        load.status,
        `"${load.origin || 'N/A'}"`,
        load.truck_type || 'N/A',
        load.total_weight_lbs || 0,
        load.total_volume_cuft || 0,
        load.utilization_percent || 0,
        load.orders?.length || 0,
        load.created_at ? new Date(load.created_at).toISOString() : '',
        load.updated_at ? new Date(load.updated_at).toISOString() : ''
      ].join(','))
    ]
    
    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `loads_${type}_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setContextMenu(null)
  }

  if (loading) {
    return <div className="loads"><p>Loading loads...</p></div>
  }

  if (error) {
    return (
      <div className="loads">
        <div className="error-message" style={{padding: '2rem', background: '#f8d7da', color: '#721c24', borderRadius: '8px'}}>
          <h3>Error Loading Loads</h3>
          <p>{error}</p>
          <button className="btn-primary" onClick={fetchLoads}>Try Again</button>
        </div>
      </div>
    )
  }

  return (
    <div className="loads">
      <div className="header-section">
        <h2>Loads</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn-secondary" 
            onClick={handleSimulateLoads}
            title="Create test loads for today's delivery (Control Tower demo)"
          >
            🎬 Simulate Loads
          </button>
          <button className="btn-primary" onClick={fetchLoads}>
            Refresh
          </button>
        </div>
      </div>

      <div className="loads-stats">
        <div className="stat-card">
          <h3>Total Loads</h3>
          <p className="stat-value">{loads.length}</p>
        </div>
        <div className="stat-card">
          <h3>Planning Status</h3>
          <p className="stat-value">{loads.filter(l => l.status === 'Planning').length}</p>
        </div>
        <div className="stat-card">
          <h3>Dispatched</h3>
          <p className="stat-value">{loads.filter(l => l.status === 'Dispatched').length}</p>
        </div>
        <div className="stat-card">
          <h3>In Transit</h3>
          <p className="stat-value">{loads.filter(l => l.status === 'In Transit').length}</p>
        </div>
      </div>

      <div className="loads-summary">
        <p><strong>Page:</strong> {currentPage} of {totalPages} | <strong>Showing:</strong> {startIndex + 1}-{Math.min(endIndex, loads.length)} of {loads.length}</p>
        {selectedRows.size > 0 && <p><strong>Selected:</strong> {selectedRows.size} loads</p>}
        <p className="info-note">💡 <em>Right-click on any row for export options. Use Ctrl+Click for multi-select, Shift+Click for range select.</em></p>
      </div>

      <div className="loads-table">
        <table>
          <thead>
            <tr>
              <th style={{ width: '50px', textAlign: 'center' }}>
                <input 
                  type="checkbox" 
                  checked={selectedRows.size > 0 && selectedRows.size === currentLoads.length}
                  onChange={handleSelectAll}
                  style={{ cursor: 'pointer' }}
                />
              </th>
              <th>Load #</th>
              <th>Status</th>
              <th>Origin</th>
              <th>Truck Type</th>
              <th>Weight (lbs)</th>
              <th>Volume (cu.ft)</th>
              <th>Utilization %</th>
              <th>Orders</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {loads.length === 0 ? (
              <tr>
                <td colSpan="10" className="empty-state">
                  No loads found. Create loads from the Load Planning page.
                </td>
              </tr>
            ) : (
              currentLoads.map(load => (
                <tr
                  key={load.id}
                  onClick={(e) => handleRowClick(load.id, e)}
                  onContextMenu={(e) => handleContextMenu(e, load.id)}
                  className={selectedRows.has(load.id) ? 'selected-row' : ''}
                >
                  <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      checked={selectedRows.has(load.id)}
                      onChange={(e) => handleCheckboxClick(load.id, e)}
                      style={{ cursor: 'pointer' }}
                    />
                  </td>
                  <td className="load-number">{load.load_number || 'N/A'}</td>
                  <td>
                    <span className={`status-badge status-${(load.status || 'unknown')?.toLowerCase().replace(' ', '-')}`}>
                      {load.status || 'Unknown'}
                    </span>
                  </td>
                  <td>{load.origin || 'N/A'}</td>
                  <td>{load.truck_type || 'N/A'}</td>
                  <td>{(load.total_weight_lbs || 0).toLocaleString()}</td>
                  <td>{(load.total_volume_cuft || 0).toLocaleString()}</td>
                  <td>{load.utilization_percent || 0}%</td>
                  <td>{load.orders?.length || 0}</td>
                  <td>{load.created_at ? new Date(load.created_at).toLocaleDateString() : 'N/A'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
            📄 Export Current Page ({currentLoads.length}) to CSV
          </div>
          <div className="context-menu-item" onClick={exportAllToCSV}>
            📊 Export All Loads ({loads.length}) to CSV
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
      {loads.length > 0 && (
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

export default Loads
