import { useState, useEffect } from 'react'
import { tmsAPI } from '../services/api'
import './Dashboard.css'

function Dashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    activeShipments: 0,
    avgUtilization: 0,
    costSavings: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const ordersResponse = await tmsAPI.getOrders()
      const orders = ordersResponse.data?.data || ordersResponse.data || []
      
      setStats({
        totalOrders: orders.length,
        activeShipments: orders.filter(o => o.status === 'Pending').length,
        avgUtilization: 0,
        costSavings: 0
      })
    } catch (error) {
      console.error('Error fetching dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="loading">Loading dashboard...</div>
  }

  return (
    <div className="dashboard">
      <h2>Dashboard Overview</h2>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.totalOrders}</div>
          <div className="stat-label">Total Orders</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">{stats.activeShipments}</div>
          <div className="stat-label">Pending Orders</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">{stats.avgUtilization}%</div>
          <div className="stat-label">Avg Utilization</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">${stats.costSavings}</div>
          <div className="stat-label">Cost Savings</div>
        </div>
      </div>

      <div className="dashboard-info">
        <h3>Quick Actions</h3>
        <p>View and manage orders in the Orders tab</p>
        <p>Optimize loads using AI in the Load Planning tab</p>
        <p>Generate synthetic test data for demos</p>
      </div>
    </div>
  )
}

export default Dashboard
