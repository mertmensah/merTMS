import { useState, useEffect } from 'react'
import { useAuth } from './contexts/AuthContext'
import { ActivityTracker } from './hooks/useActivityTracker'
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
import ProjectManagement from './components/ProjectManagement'
import SyntheticDataGenerator from './components/SyntheticDataGenerator'
import UserProfile from './components/UserProfile'
import './App.css'

function App() {
  const { user, profile, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState('control-tower')
  const [sidebarExpanded, setSidebarExpanded] = useState(true)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [expandedSections, setExpandedSections] = useState({ 
    database: true,
    innovation: true,
    operational: true
  })

  // Track page views when user switches tabs
  useEffect(() => {
    if (user && activeTab) {
      const pageName = navItems.find(item => item.id === activeTab)?.label || activeTab
      ActivityTracker.trackPageView(pageName)
    }
  }, [activeTab, user])

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
        },
        { 
          id: 'synthetic-data', 
          label: 'Synthetic Data Generator', 
          icon: '🧪',
          description: 'Generate realistic test data for Supabase tables'
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
        },
        { 
          id: 'automation-hub', 
          label: 'Automation Hub', 
          icon: '⚙️',
          description: 'Scheduled scripts and automated workflows'
        },
        { 
          id: 'project-management', 
          label: 'Project Management', 
          icon: '🎯',
          description: 'Lean Six Sigma Scrum framework for project tracking'
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
          label: 'Network Design & Engineering', 
          icon: '🌐',
          description: 'Use AI to evaluate your current and optimal network layout based on your demand'
        }
      ]
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: '🔧',
      description: 'System configuration and preferences'
    },
    { 
      id: 'profile', 
      label: 'My Profile', 
      icon: '👤',
      description: 'View and edit your user profile'
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
            <div className="sidebar-logo">
              <span className="brand-main">merTMS</span>
              <span className="brand-sub">by optisc</span>
            </div>
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
                      <span className="nav-description"><span>{item.description}</span></span>
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
                            <span className="nav-description"><span>{child.description}</span></span>
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
                    <span className="nav-description"><span>{item.description}</span></span>
                  </div>
                </button>
              )}
            </div>
          ))}
        </nav>
        
        <div className="sidebar-footer">
          <div className="sidebar-copyright">
            <span className="copyright-icon">©</span>
            <span className="copyright-text">2025 optisc</span>
          </div>
        </div>
      </div>

      <div className="main-content">
        <header className="app-header">
          <h1>
            {navItems.find(item => item.id === activeTab)?.label || 
             navItems.find(item => item.children?.some(child => child.id === activeTab))?.children?.find(child => child.id === activeTab)?.label || 
             'merTMS'}
          </h1>
          
          {/* User Menu */}
          <div className="user-menu-container" style={{ position: 'relative' }}>
            <button 
              className="user-menu-button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                background: 'rgba(102, 126, 234, 0.1)',
                border: '1px solid rgba(102, 126, 234, 0.2)',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <span style={{ fontSize: '20px' }}>👤</span>
              <span style={{ fontWeight: '500', fontSize: '14px' }}>
                {profile?.full_name || user?.email?.split('@')[0] || 'User'}
              </span>
              <span style={{ fontSize: '12px', opacity: 0.7 }}>▼</span>
            </button>
            
            {showUserMenu && (
              <div 
                className="user-menu-dropdown"
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  background: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  minWidth: '200px',
                  zIndex: 1000
                }}
              >
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
                  <div style={{ fontWeight: '600', fontSize: '14px' }}>{profile?.full_name || 'User'}</div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>{user?.email}</div>
                  {profile?.role && (
                    <div style={{ 
                      fontSize: '11px', 
                      color: '#667eea', 
                      marginTop: '4px',
                      textTransform: 'capitalize',
                      fontWeight: '500'
                    }}>
                      {profile.role}
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => {
                    setActiveTab('profile')
                    setShowUserMenu(false)
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#f5f5f5'}
                  onMouseLeave={(e) => e.target.style.background = 'none'}
                >
                  👤 My Profile
                </button>
                
                <button
                  onClick={() => {
                    signOut()
                    setShowUserMenu(false)
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    background: 'none',
                    border: 'none',
                    borderTop: '1px solid #f0f0f0',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#f44336',
                    fontWeight: '500',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#fff5f5'}
                  onMouseLeave={(e) => e.target.style.background = 'none'}
                >
                  🚪 Sign Out
                </button>
              </div>
            )}
          </div>
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
          {activeTab === 'synthetic-data' && <SyntheticDataGenerator />}
          {activeTab === 'ai-docuscan' && <AIDocuscan />}
          {activeTab === 'automation-hub' && <AutomationHub />}
          {activeTab === 'project-management' && <ProjectManagement />}
          {activeTab === 'settings' && <Settings />}
          {activeTab === 'profile' && <UserProfile />}
        </main>
      </div>
      
      {/* AI Assistant - Available on all pages */}
      <AIAssistant />
    </div>
  )
}

export default App
