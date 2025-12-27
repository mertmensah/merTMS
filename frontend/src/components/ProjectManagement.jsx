import { useState, useEffect } from 'react'
import './ProjectManagement.css'

function ProjectManagement() {
  const [projects, setProjects] = useState([])
  const [people, setPeople] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [activeView, setActiveView] = useState('kanban') // kanban, backlog, people
  const [showNewProjectModal, setShowNewProjectModal] = useState(false)
  const [showNewPersonModal, setShowNewPersonModal] = useState(false)
  const [showNewStoryModal, setShowNewStoryModal] = useState(false)
  const [draggedStory, setDraggedStory] = useState(null)
  const [newStoryForm, setNewStoryForm] = useState({
    title: '',
    description: '',
    points: 5,
    priority: 'Medium',
    assignee: null,
    status: 'To Do'
  })
  const [newPersonForm, setNewPersonForm] = useState({
    name: '',
    email: '',
    role: 'Developer',
    avatar: '👤'
  })

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

  // Drag and Drop handlers
  const handleDragStart = (e, story) => {
    setDraggedStory(story)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e, newStatus) => {
    e.preventDefault()
    
    if (!draggedStory || draggedStory.status === newStatus) {
      setDraggedStory(null)
      return
    }

    // Update the story status in the selected project
    const updatedStories = selectedProject.stories.map(story => 
      story.id === draggedStory.id 
        ? { ...story, status: newStatus, completed_at: newStatus === 'Done' ? new Date().toISOString() : null }
        : story
    )

    // Update the selected project with new stories
    const updatedProject = { ...selectedProject, stories: updatedStories }
    setSelectedProject(updatedProject)

    // Update the projects array
    const updatedProjects = projects.map(p => 
      p.id === selectedProject.id ? updatedProject : p
    )
    setProjects(updatedProjects)

    setDraggedStory(null)
    
    // TODO: Make API call to update story status in backend
    // tmsAPI.updateStory(draggedStory.id, { status: newStatus })
  }

  // Form handlers
  const handleCreateStory = () => {
    if (!newStoryForm.title.trim() || !selectedProject) return

    const newStory = {
      id: Date.now(),
      ...newStoryForm,
      created_at: new Date().toISOString()
    }

    const updatedStories = [...selectedProject.stories, newStory]
    const updatedProject = { ...selectedProject, stories: updatedStories }
    setSelectedProject(updatedProject)

    const updatedProjects = projects.map(p => 
      p.id === selectedProject.id ? updatedProject : p
    )
    setProjects(updatedProjects)

    // Reset form and close modal
    setNewStoryForm({ title: '', description: '', points: 5, priority: 'Medium', assignee: null, status: 'To Do' })
    setShowNewStoryModal(false)

    // TODO: Make API call to create story in backend
    // tmsAPI.createStory({ ...newStory, project_id: selectedProject.id })
  }

  const handleCreatePerson = () => {
    if (!newPersonForm.name.trim() || !newPersonForm.email.trim()) return

    const newPerson = {
      id: Date.now(),
      ...newPersonForm,
      created_at: new Date().toISOString()
    }

    setPeople([...people, newPerson])

    // Reset form and close modal
    setNewPersonForm({ name: '', email: '', role: 'Developer', avatar: '👤' })
    setShowNewPersonModal(false)

    // TODO: Make API call to create person in backend
    // tmsAPI.createPerson(newPerson)
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
          <div 
            className="kanban-column"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'To Do')}
          >
            <div className="column-header">
              <h3>📝 To Do</h3>
              <span className="story-count">{getStoriesByStatus('To Do').length}</span>
            </div>
            <div className="story-list">
              {getStoriesByStatus('To Do').map(story => (
                <div 
                  key={story.id} 
                  className="story-card"
                  draggable
                  onDragStart={(e) => handleDragStart(e, story)}
                >
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

          <div 
            className="kanban-column"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'In Progress')}
          >
            <div className="column-header">
              <h3>🔄 In Progress</h3>
              <span className="story-count">{getStoriesByStatus('In Progress').length}</span>
            </div>
            <div className="story-list">
              {getStoriesByStatus('In Progress').map(story => (
                <div 
                  key={story.id} 
                  className="story-card in-progress"
                  draggable
                  onDragStart={(e) => handleDragStart(e, story)}
                >
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

          <div 
            className="kanban-column"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'Done')}
          >
            <div className="column-header">
              <h3>✅ Done</h3>
              <span className="story-count">{getStoriesByStatus('Done').length}</span>
            </div>
            <div className="story-list">
              {getStoriesByStatus('Done').map(story => (
                <div 
                  key={story.id} 
                  className="story-card done"
                  draggable
                  onDragStart={(e) => handleDragStart(e, story)}
                >
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
            <button className="btn-secondary" onClick={() => setShowNewStoryModal(true)}>➕ Add User Story</button>
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

      {/* New Story Modal */}
      {showNewStoryModal && (
        <div className="modal-overlay" onClick={() => setShowNewStoryModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>➕ Add New User Story</h3>
              <button className="modal-close" onClick={() => setShowNewStoryModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Story Title *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="As a user, I want to..."
                  value={newStoryForm.title}
                  onChange={(e) => setNewStoryForm({ ...newStoryForm, title: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  className="form-textarea"
                  placeholder="Additional details and acceptance criteria..."
                  rows="4"
                  value={newStoryForm.description}
                  onChange={(e) => setNewStoryForm({ ...newStoryForm, description: e.target.value })}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Story Points</label>
                  <select
                    className="form-select"
                    value={newStoryForm.points}
                    onChange={(e) => setNewStoryForm({ ...newStoryForm, points: parseInt(e.target.value) })}
                  >
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="5">5</option>
                    <option value="8">8</option>
                    <option value="13">13</option>
                    <option value="21">21</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select
                    className="form-select"
                    value={newStoryForm.priority}
                    onChange={(e) => setNewStoryForm({ ...newStoryForm, priority: e.target.value })}
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Assignee</label>
                  <select
                    className="form-select"
                    value={newStoryForm.assignee || ''}
                    onChange={(e) => setNewStoryForm({ ...newStoryForm, assignee: e.target.value ? parseInt(e.target.value) : null })}
                  >
                    <option value="">Unassigned</option>
                    {people.map(person => (
                      <option key={person.id} value={person.id}>
                        {person.avatar} {person.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowNewStoryModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleCreateStory}>Create Story</button>
            </div>
          </div>
        </div>
      )}

      {/* New Person Modal */}
      {showNewPersonModal && (
        <div className="modal-overlay" onClick={() => setShowNewPersonModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>👥 Add Team Member</h3>
              <button className="modal-close" onClick={() => setShowNewPersonModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="John Doe"
                  value={newPersonForm.name}
                  onChange={(e) => setNewPersonForm({ ...newPersonForm, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="john@optisc.com"
                  value={newPersonForm.email}
                  onChange={(e) => setNewPersonForm({ ...newPersonForm, email: e.target.value })}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Role</label>
                  <select
                    className="form-select"
                    value={newPersonForm.role}
                    onChange={(e) => setNewPersonForm({ ...newPersonForm, role: e.target.value })}
                  >
                    <option value="Developer">Developer</option>
                    <option value="Scrum Master">Scrum Master</option>
                    <option value="Product Owner">Product Owner</option>
                    <option value="Six Sigma Black Belt">Six Sigma Black Belt</option>
                    <option value="QA Engineer">QA Engineer</option>
                    <option value="Business Analyst">Business Analyst</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Avatar</label>
                  <select
                    className="form-select"
                    value={newPersonForm.avatar}
                    onChange={(e) => setNewPersonForm({ ...newPersonForm, avatar: e.target.value })}
                  >
                    <option value="👤">👤 Default</option>
                    <option value="👨‍💼">👨‍💼 Man Business</option>
                    <option value="👩‍💼">👩‍💼 Woman Business</option>
                    <option value="👨‍💻">👨‍💻 Man Tech</option>
                    <option value="👩‍💻">👩‍💻 Woman Tech</option>
                    <option value="👨‍🔬">👨‍🔬 Man Science</option>
                    <option value="👩‍🔬">👩‍🔬 Woman Science</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowNewPersonModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleCreatePerson}>Add Member</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProjectManagement
