import { useState } from 'react'
import Dashboard from './components/Dashboard'
import OrderManagement from './components/OrderManagement'
import LoadPlanning from './components/LoadPlanning'
import Loads from './components/Loads'
import ControlTower from './components/ControlTower'
import Facilities from './components/Facilities'
import Products from './components/Products'
import Settings from './components/Settings'
import AIAssistant from './components/AIAssistant'
import MertsightsAI from './components/MertsightsAI'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('control-tower')
  const [sidebarExpanded, setSidebarExpanded] = useState(false)

  const navItems = [
    { id: 'control-tower', label: 'Control Tower', icon: '🎯' },
    { id: 'orders', label: 'Orders', icon: '📋' },
    { id: 'load-builder', label: 'Load Builder', icon: '🔧' },
    { id: 'loads', label: 'Loads', icon: '🚛' },
    { id: 'facilities', label: 'Facilities', icon: '🏭' },
    { id: 'products', label: 'Products', icon: '📦' },
    { id: 'mertsights-ai', label: 'mertsightsAI', icon: '📊' },
    { id: 'network-engineering', label: 'Network Engineering Suite', icon: '🌐' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ]

  return (
    <div className="app">
      <div className={`sidebar ${sidebarExpanded ? 'expanded' : ''}`}>
        <div className="sidebar-header">
          <span className="sidebar-logo">merTM.S</span>
          <button 
            className="menu-toggle"
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
          >
            ☰
          </button>
        </div>
        
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="main-content">
        <header className="app-header">
          <h1>
            {navItems.find(item => item.id === activeTab)?.label || 'merTM.S'}
          </h1>
          <p className="subtitle">merTM.S Transportation Management System</p>
        </header>

        <main className="app-content">
          {activeTab === 'control-tower' && <ControlTower />}
          {activeTab === 'orders' && <OrderManagement />}
          {activeTab === 'load-builder' && <LoadPlanning />}
          {activeTab === 'loads' && <Loads />}
          {activeTab === 'facilities' && <Facilities />}
          {activeTab === 'products' && <Products />}
          {activeTab === 'mertsights-ai' && <MertsightsAI />}
          {activeTab === 'network-engineering' && <div className="placeholder-module"><h2>Network Engineering Suite</h2><p>Coming soon...</p></div>}
          {activeTab === 'settings' && <Settings />}
        </main>
      </div>
      
      {/* AI Assistant - Available on all pages */}
      <AIAssistant />
    </div>
  )
}

export default App
