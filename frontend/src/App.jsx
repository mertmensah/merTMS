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
import NetworkEngineering from './components/NetworkEngineering'
import AIDocuscan from './components/AIDocuscan'
import AutomationHub from './components/AutomationHub'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('control-tower')
  const [sidebarExpanded, setSidebarExpanded] = useState(true)
  const [expandedSections, setExpandedSections] = useState({ 
    database: true,
    innovation: true,
    operational: true
  })

  const navItems = [
    { 
      id: 'control-tower', 
      label: 'Control Tower', 
      icon: '🎯',
      description: 'Real-time shipment visibility and monitoring'
    },
    { 
      id: 'database',
      label: 'Database',
      icon: '🗄️',
      description: 'Core data management modules',
      isSection: true,
      children: [
        { 
          id: 'orders', 
          label: 'Orders', 
          icon: '📋',
          description: 'Manage customer orders and shipments'
        },
        { 
          id: 'loads', 
          label: 'Loads', 
          icon: '🚛',
          description: 'View and track all truck loads'
        },
        { 
          id: 'facilities', 
          label: 'Facilities', 
          icon: '🏭',
          description: 'Warehouse and distribution center network'
        },
        { 
          id: 'products', 
          label: 'Products', 
          icon: '📦',
          description: 'Product catalog and specifications'
        }
      ]
    },
    { 
      id: 'operational',
      label: 'Operational Execution',
      icon: '⚡',
      description: 'Day-to-day operational tools',
      isSection: true,
      children: [
        { 
          id: 'load-builder', 
          label: 'Load Builder', 
          icon: '🔧',
          description: 'Optimize truck loads with AI assistance'
        },
        { 
          id: 'ai-docuscan', 
          label: 'AI Docuscan', 
          icon: '🔍',
          description: 'Use Agentic AI to scan and classify your documents'
        }
      ]
    },
    { 
      id: 'innovation',
      label: 'Innovation Hub',
      icon: '💡',
      description: 'Advanced analytics and engineering',
      isSection: true,
      children: [
        { 
          id: 'mertsights-ai', 
          label: 'mertsightsAI', 
          icon: '📊',
          description: 'AI-powered analytics and insights'
        },
        { 
          id: 'network-engineering', 
          label: 'Network Engineering', 
          icon: '🌐',
          description: 'Network design and optimization tools'
        }
      ]
    },
    { 
      id: 'automation-hub', 
      label: 'Automation Hub', 
      icon: '⚙️',
      description: 'Scheduled scripts and automated workflows'
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: '🔧',
      description: 'System configuration and preferences'
    }
  ]

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }

  return (
    <div className="app">
      <div className={`sidebar ${sidebarExpanded ? 'expanded' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-branding">
            <span className="brand-icon">🚚</span>
            <span className="sidebar-logo">merTM.S</span>
          </div>
          <button 
            className="menu-toggle"
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
            title={sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarExpanded ? '◀' : '▶'}
          </button>
        </div>
        
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <div key={item.id}>
              {item.isSection ? (
                <>
                  <button
                    className={`nav-item section-header ${expandedSections[item.id] ? 'expanded' : ''}`}
                    onClick={() => toggleSection(item.id)}
                    title={!sidebarExpanded ? item.label : ''}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <div className="nav-content">
                      <span className="nav-label">{item.label}</span>
                      <span className="nav-description">{item.description}</span>
                    </div>
                    <span className="section-toggle">{expandedSections[item.id] ? '▼' : '▶'}</span>
                  </button>
                  {expandedSections[item.id] && item.children && (
                    <div className="nav-children">
                      {item.children.map(child => (
                        <button
                          key={child.id}
                          className={`nav-item child-item ${activeTab === child.id ? 'active' : ''}`}
                          onClick={() => setActiveTab(child.id)}
                          title={!sidebarExpanded ? child.label : ''}
                        >
                          <span className="nav-icon">{child.icon}</span>
                          <div className="nav-content">
                            <span className="nav-label">{child.label}</span>
                            <span className="nav-description">{child.description}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <button
                  className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(item.id)}
                  title={!sidebarExpanded ? item.label : ''}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <div className="nav-content">
                    <span className="nav-label">{item.label}</span>
                    <span className="nav-description">{item.description}</span>
                  </div>
                </button>
              )}
            </div>
          ))}
        </nav>
        
        <div className="sidebar-footer">
          <div className="sidebar-version">
            <span className="version-icon">ℹ️</span>
            <span className="version-text">v1.0.0</span>
          </div>
        </div>
      </div>

      <div className="main-content">
        <header className="app-header">
          <h1>
            {navItems.find(item => item.id === activeTab)?.label || 
             navItems.find(item => item.children?.some(child => child.id === activeTab))?.children?.find(child => child.id === activeTab)?.label || 
             'merTM.S'}
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
          {activeTab === 'network-engineering' && <NetworkEngineering />}
          {activeTab === 'ai-docuscan' && <AIDocuscan />}
          {activeTab === 'automation-hub' && <AutomationHub />}
          {activeTab === 'settings' && <Settings />}
        </main>
      </div>
      
      {/* AI Assistant - Available on all pages */}
      <AIAssistant />
    </div>
  )
}

export default App
