import { useState, useEffect } from 'react'
import './ProjectManagement.css'

function ProjectManagement() {
  const [projects, setProjects] = useState([])
  const [people, setPeople] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [activeView, setActiveView] = useState('kanban') // kanban, backlog, people
  const [showNewProjectModal, setShowNewProjectModal] = useState(false)
  const [showNewPersonModal, setShowNewPersonModal] = useState(false)

  // Mock data for initial state
  useEffect(() => {
    // Initialize with sample data
    const samplePeople = [
      { id: 1, name: 'John Smith', role: 'Scrum Master', email: 'john@optisc.com', avatar: '👨‍💼' },
      { id: 2, name: 'Sarah Johnson', role: 'Product Owner', email: 'sarah@optisc.com', avatar: '👩‍💼' },
      { id: 3, name: 'Mike Chen', role: 'Developer', email: 'mike@optisc.com', avatar: '👨‍💻' },
      { id: 4, name: 'Emma Davis', role: 'Six Sigma Black Belt', email: 'emma@optisc.com', avatar: '👩‍🔬' }
    ]
    
    const sampleProjects = [
      {
        id: 1,
        name: 'TMS Process Optimization',
        type: 'Six Sigma DMAIC',
        status: 'In Progress',
        sprint: 'Sprint 3',
        owner: 2,
        team: [1, 2, 3],
        startDate: '2025-12-01',
        targetDate: '2026-02-28',
        phase: 'Measure',
        defectRate: 3.4,
        processEfficiency: 87,
        stories: [
          { id: 1, title: 'Define Current State Process', points: 8, status: 'Done', assignee: 2, priority: 'High' },
          { id: 2, title: 'Measure Cycle Time Metrics', points: 5, status: 'In Progress', assignee: 4, priority: 'High' },
          { id: 3, title: 'Analyze Bottlenecks', points: 13, status: 'To Do', assignee: null, priority: 'Medium' },
          { id: 4, title: 'Improve Load Planning Flow', points: 8, status: 'To Do', assignee: null, priority: 'Medium' }
        ]
      }
    ]
    
    setPeople(samplePeople)
    setProjects(sampleProjects)
    if (sampleProjects.length > 0) {
      setSelectedProject(sampleProjects[0])
    }
  }, [])

  const getPersonById = (id) => people.find(p => p.id === id)

  const getStoriesByStatus = (status) => {
    if (!selectedProject) return []
    return selectedProject.stories.filter(s => s.status === status)
  }

  const calculateVelocity = () => {
    if (!selectedProject) return 0
    const completedPoints = selectedProject.stories
      .filter(s => s.status === 'Done')
      .reduce((sum, s) => sum + s.points, 0)
    return completedPoints
  }

  const calculateBurndown = () => {
    if (!selectedProject) return { remaining: 0, total: 0 }
    const total = selectedProject.stories.reduce((sum, s) => sum + s.points, 0)
    const completed = selectedProject.stories
      .filter(s => s.status === 'Done')
      .reduce((sum, s) => sum + s.points, 0)
    return { remaining: total - completed, total }
  }

  return (
    <div className="project-management">
      <div className="pm-header">
        <div>
          <h2>🎯 Project Management</h2>
          <p className="pm-subtitle">Lean Six Sigma × Scrum Framework</p>
        </div>
        <div className="pm-actions">
          <button className="btn-secondary" onClick={() => setShowNewPersonModal(true)}>
            👥 Add Team Member
          </button>
          <button className="btn-primary" onClick={() => setShowNewProjectModal(true)}>
            ➕ New Project
          </button>
        </div>
      </div>

      {/* Project Selector & Metrics */}
      {selectedProject && (
        <div className="pm-overview">
          <div className="project-selector">
            <select 
              value={selectedProject.id} 
              onChange={(e) => setSelectedProject(projects.find(p => p.id === parseInt(e.target.value)))}
              className="project-select"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <span className="project-type">{selectedProject.type}</span>
            <span className={`project-status status-${selectedProject.status.toLowerCase().replace(' ', '-')}`}>
              {selectedProject.status}
            </span>
          </div>

          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-label">Current Phase</div>
              <div className="metric-value">{selectedProject.phase}</div>
              <div className="metric-subtitle">DMAIC Cycle</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Sprint</div>
              <div className="metric-value">{selectedProject.sprint}</div>
              <div className="metric-subtitle">2 weeks remaining</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Velocity</div>
              <div className="metric-value">{calculateVelocity()}</div>
              <div className="metric-subtitle">Story Points</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Defect Rate</div>
              <div className="metric-value">{selectedProject.defectRate}σ</div>
              <div className="metric-subtitle">Six Sigma Level</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Efficiency</div>
              <div className="metric-value">{selectedProject.processEfficiency}%</div>
              <div className="metric-subtitle">Process Capability</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Burndown</div>
              <div className="metric-value">{calculateBurndown().remaining}/{calculateBurndown().total}</div>
              <div className="metric-subtitle">Points Remaining</div>
            </div>
          </div>
        </div>
      )}

      {/* View Tabs */}
      <div className="view-tabs">
        <button 
          className={`tab ${activeView === 'kanban' ? 'active' : ''}`}
          onClick={() => setActiveView('kanban')}
        >
          📋 Kanban Board
        </button>
        <button 
          className={`tab ${activeView === 'backlog' ? 'active' : ''}`}
          onClick={() => setActiveView('backlog')}
        >
          📚 Product Backlog
        </button>
        <button 
          className={`tab ${activeView === 'people' ? 'active' : ''}`}
          onClick={() => setActiveView('people')}
        >
          👥 Team & Resources
        </button>
      </div>

      {/* Kanban Board View */}
      {activeView === 'kanban' && selectedProject && (
        <div className="kanban-board">
          <div className="kanban-column">
            <div className="column-header">
              <h3>📝 To Do</h3>
              <span className="story-count">{getStoriesByStatus('To Do').length}</span>
            </div>
            <div className="story-list">
              {getStoriesByStatus('To Do').map(story => (
                <div key={story.id} className="story-card">
                  <div className="story-header">
                    <span className={`priority priority-${story.priority.toLowerCase()}`}>
                      {story.priority}
                    </span>
                    <span className="story-points">{story.points} pts</span>
                  </div>
                  <div className="story-title">{story.title}</div>
                  <div className="story-footer">
                    {story.assignee ? (
                      <span className="assignee">
                        {getPersonById(story.assignee)?.avatar} {getPersonById(story.assignee)?.name}
                      </span>
                    ) : (
                      <span className="unassigned">Unassigned</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="kanban-column">
            <div className="column-header">
              <h3>🔄 In Progress</h3>
              <span className="story-count">{getStoriesByStatus('In Progress').length}</span>
            </div>
            <div className="story-list">
              {getStoriesByStatus('In Progress').map(story => (
                <div key={story.id} className="story-card in-progress">
                  <div className="story-header">
                    <span className={`priority priority-${story.priority.toLowerCase()}`}>
                      {story.priority}
                    </span>
                    <span className="story-points">{story.points} pts</span>
                  </div>
                  <div className="story-title">{story.title}</div>
                  <div className="story-footer">
                    {story.assignee ? (
                      <span className="assignee">
                        {getPersonById(story.assignee)?.avatar} {getPersonById(story.assignee)?.name}
                      </span>
                    ) : (
                      <span className="unassigned">Unassigned</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="kanban-column">
            <div className="column-header">
              <h3>✅ Done</h3>
              <span className="story-count">{getStoriesByStatus('Done').length}</span>
            </div>
            <div className="story-list">
              {getStoriesByStatus('Done').map(story => (
                <div key={story.id} className="story-card done">
                  <div className="story-header">
                    <span className={`priority priority-${story.priority.toLowerCase()}`}>
                      {story.priority}
                    </span>
                    <span className="story-points">{story.points} pts</span>
                  </div>
                  <div className="story-title">{story.title}</div>
                  <div className="story-footer">
                    {story.assignee ? (
                      <span className="assignee">
                        {getPersonById(story.assignee)?.avatar} {getPersonById(story.assignee)?.name}
                      </span>
                    ) : (
                      <span className="unassigned">Unassigned</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Product Backlog View */}
      {activeView === 'backlog' && selectedProject && (
        <div className="backlog-view">
          <div className="backlog-header">
            <h3>Product Backlog</h3>
            <button className="btn-secondary">➕ Add User Story</button>
          </div>
          <table className="backlog-table">
            <thead>
              <tr>
                <th>Priority</th>
                <th>User Story</th>
                <th>Story Points</th>
                <th>Status</th>
                <th>Assignee</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {selectedProject.stories
                .sort((a, b) => {
                  const priorityOrder = { High: 1, Medium: 2, Low: 3 }
                  return priorityOrder[a.priority] - priorityOrder[b.priority]
                })
                .map(story => (
                  <tr key={story.id}>
                    <td>
                      <span className={`priority priority-${story.priority.toLowerCase()}`}>
                        {story.priority}
                      </span>
                    </td>
                    <td className="story-title-cell">{story.title}</td>
                    <td>{story.points}</td>
                    <td>
                      <span className={`status-badge status-${story.status.toLowerCase().replace(' ', '-')}`}>
                        {story.status}
                      </span>
                    </td>
                    <td>
                      {story.assignee ? (
                        <span className="assignee">
                          {getPersonById(story.assignee)?.avatar} {getPersonById(story.assignee)?.name}
                        </span>
                      ) : (
                        <span className="unassigned">Unassigned</span>
                      )}
                    </td>
                    <td>
                      <button className="btn-icon" title="Edit">✏️</button>
                      <button className="btn-icon" title="Delete">🗑️</button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* People/Team View */}
      {activeView === 'people' && (
        <div className="people-view">
          <div className="people-header">
            <h3>Team Members & Resources</h3>
            <button className="btn-secondary" onClick={() => setShowNewPersonModal(true)}>
              ➕ Add Team Member
            </button>
          </div>
          <div className="people-grid">
            {people.map(person => (
              <div key={person.id} className="person-card">
                <div className="person-avatar">{person.avatar}</div>
                <div className="person-info">
                  <div className="person-name">{person.name}</div>
                  <div className="person-role">{person.role}</div>
                  <div className="person-email">{person.email}</div>
                </div>
                <div className="person-stats">
                  <div className="stat">
                    <span className="stat-label">Active Stories</span>
                    <span className="stat-value">
                      {selectedProject?.stories.filter(s => s.assignee === person.id && s.status !== 'Done').length || 0}
                    </span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Completed</span>
                    <span className="stat-value">
                      {selectedProject?.stories.filter(s => s.assignee === person.id && s.status === 'Done').length || 0}
                    </span>
                  </div>
                </div>
                <div className="person-actions">
                  <button className="btn-icon" title="Edit">✏️</button>
                  <button className="btn-icon" title="View Details">👁️</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ProjectManagement
