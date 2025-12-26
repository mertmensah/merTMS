import React, { useState, useEffect } from 'react';
import './AutomationHub.css';

const AutomationHub = () => {
  const [scripts, setScripts] = useState([]);
  const [expandedScript, setExpandedScript] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data - in production, fetch from API
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setScripts([
        {
          id: 'email-forwarder',
          name: 'Email-to-merTMS Forwarder',
          description: 'Forwards emails from external sources to proprietary scraping inbox for processing',
          schedule: 'Every 5 minutes',
          cronExpression: '*/5 * * * *',
          status: 'active',
          lastRun: '2025-12-26T10:25:00',
          nextRun: '2025-12-26T10:30:00',
          successRate: 98.5,
          totalRuns: 2847,
          avgDuration: '2.3s',
          endpoint: '/api/automation/email-forwarder',
          logs: [
            { timestamp: '2025-12-26T10:25:00', status: 'success', message: 'Forwarded 3 emails to scraping inbox', duration: '2.1s' },
            { timestamp: '2025-12-26T10:20:00', status: 'success', message: 'Forwarded 1 email to scraping inbox', duration: '1.8s' },
            { timestamp: '2025-12-26T10:15:00', status: 'success', message: 'No new emails to forward', duration: '0.9s' },
            { timestamp: '2025-12-26T10:10:00', status: 'success', message: 'Forwarded 5 emails to scraping inbox', duration: '3.2s' }
          ],
          config: {
            sourceEmail: 'shipments@company.com',
            targetInbox: 'scraper@mertms.internal',
            filters: 'Subject contains: BOL, Tracking, Shipment, Delivery'
          }
        },
        {
          id: 'email-scraper',
          name: 'Email Scraper & Document Extractor',
          description: 'Scrapes text and documents from inbox, identifies shipments, and extracts relevant data',
          schedule: 'Every 10 minutes',
          cronExpression: '*/10 * * * *',
          status: 'active',
          lastRun: '2025-12-26T10:20:00',
          nextRun: '2025-12-26T10:30:00',
          successRate: 94.2,
          totalRuns: 1423,
          avgDuration: '8.7s',
          endpoint: '/api/automation/email-scraper',
          logs: [
            { timestamp: '2025-12-26T10:20:00', status: 'success', message: 'Processed 3 emails, extracted 7 documents, matched 3 shipments', duration: '9.1s' },
            { timestamp: '2025-12-26T10:10:00', status: 'success', message: 'Processed 1 email, extracted 2 documents, matched 1 shipment', duration: '6.4s' },
            { timestamp: '2025-12-26T10:00:00', status: 'warning', message: 'Processed 2 emails, 1 shipment could not be matched', duration: '7.8s' },
            { timestamp: '2025-12-26T09:50:00', status: 'success', message: 'No new emails to process', duration: '1.2s' }
          ],
          config: {
            inboxSource: 'scraper@mertms.internal',
            matchingFields: 'BOL Number, PRO Number, Tracking Number, PO Number',
            documentTypes: 'PDF, DOCX, XLSX, PNG, JPG',
            aiModel: 'Gemini Vision API'
          }
        },
        {
          id: 'mertms-updater',
          name: 'merTMS Shipment Updater',
          description: 'Updates shipment properties and status based on scraped email data and documents',
          schedule: 'Every 15 minutes',
          cronExpression: '*/15 * * * *',
          status: 'active',
          lastRun: '2025-12-26T10:15:00',
          nextRun: '2025-12-26T10:30:00',
          successRate: 96.8,
          totalRuns: 948,
          avgDuration: '5.4s',
          endpoint: '/api/automation/mertms-updater',
          logs: [
            { timestamp: '2025-12-26T10:15:00', status: 'success', message: 'Updated 4 shipments: 2 status changes, 3 milestone updates, 1 ETA revision', duration: '5.8s' },
            { timestamp: '2025-12-26T10:00:00', status: 'success', message: 'Updated 2 shipments: 1 status change, 2 document attachments', duration: '4.2s' },
            { timestamp: '2025-12-26T09:45:00', status: 'success', message: 'No pending updates', duration: '1.1s' },
            { timestamp: '2025-12-26T09:30:00', status: 'success', message: 'Updated 6 shipments: 3 status changes, 4 milestone updates', duration: '7.3s' }
          ],
          config: {
            updateFields: 'Status, Current Location, ETA, Milestones, Documents',
            validationRules: 'Require BOL match, Timestamp validation',
            notifyOnChange: 'Email + Dashboard notification'
          }
        },
        {
          id: 'carrier-emailer',
          name: 'Carrier Milestone Emailer',
          description: 'Monitors loads for missing/past due milestones and sends automated reminders to carriers',
          schedule: 'Every 2 hours',
          cronExpression: '0 */2 * * *',
          status: 'active',
          lastRun: '2025-12-26T08:00:00',
          nextRun: '2025-12-26T10:00:00',
          successRate: 99.1,
          totalRuns: 342,
          avgDuration: '12.3s',
          endpoint: '/api/automation/carrier-emailer',
          logs: [
            { timestamp: '2025-12-26T08:00:00', status: 'success', message: 'Sent 3 reminder emails: 2 past due pickups, 1 missing delivery confirmation', duration: '11.8s' },
            { timestamp: '2025-12-26T06:00:00', status: 'success', message: 'Sent 1 reminder email: 1 past due delivery milestone', duration: '9.4s' },
            { timestamp: '2025-12-26T04:00:00', status: 'success', message: 'No missing or past due milestones', duration: '3.2s' },
            { timestamp: '2025-12-26T02:00:00', status: 'success', message: 'Sent 2 reminder emails: 2 missing in-transit updates', duration: '13.1s' }
          ],
          config: {
            checkMilestones: 'Pickup, In Transit, Out for Delivery, Delivered',
            pastDueThreshold: '2 hours after expected time',
            emailTemplate: 'Professional carrier reminder template',
            escalation: 'CC operations after 3 failed attempts'
          }
        }
      ]);
      setIsLoading(false);
    }, 500);
  }, []);

  const toggleScript = (scriptId) => {
    setExpandedScript(expandedScript === scriptId ? null : scriptId);
  };

  const runScriptNow = async (scriptId) => {
    // In production, trigger script execution via API
    console.log(`Manually triggering script: ${scriptId}`);
    alert(`Script "${scriptId}" execution triggered. Check logs for results.`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'status-active';
      case 'paused': return 'status-paused';
      case 'error': return 'status-error';
      default: return 'status-inactive';
    }
  };

  const getLogStatusColor = (status) => {
    switch (status) {
      case 'success': return 'log-success';
      case 'warning': return 'log-warning';
      case 'error': return 'log-error';
      default: return 'log-info';
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="automation-hub">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading automation scripts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="automation-hub">
      <div className="hub-header">
        <div className="header-content">
          <h1>⚙️ Automation Hub</h1>
          <p className="subtitle">Scheduled scripts and automated workflows</p>
        </div>
        <div className="hub-stats">
          <div className="stat-item">
            <span className="stat-label">Active Scripts</span>
            <span className="stat-value">{scripts.filter(s => s.status === 'active').length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Runs Today</span>
            <span className="stat-value">{scripts.reduce((sum, s) => sum + Math.floor(s.totalRuns / 30), 0)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Avg Success Rate</span>
            <span className="stat-value">{(scripts.reduce((sum, s) => sum + s.successRate, 0) / scripts.length).toFixed(1)}%</span>
          </div>
        </div>
      </div>

      <div className="scripts-grid">
        {scripts.map(script => (
          <div key={script.id} className={`script-card ${expandedScript === script.id ? 'expanded' : ''}`}>
            <div className="script-header" onClick={() => toggleScript(script.id)}>
              <div className="script-header-left">
                <div className="script-icon">
                  {script.id === 'email-forwarder' && '📧'}
                  {script.id === 'email-scraper' && '🔍'}
                  {script.id === 'mertms-updater' && '🔄'}
                  {script.id === 'carrier-emailer' && '📨'}
                </div>
                <div className="script-info">
                  <h3>{script.name}</h3>
                  <p className="script-description">{script.description}</p>
                </div>
              </div>
              <div className="script-header-right">
                <span className={`status-badge ${getStatusColor(script.status)}`}>
                  {script.status}
                </span>
                <span className="expand-icon">
                  {expandedScript === script.id ? '▼' : '▶'}
                </span>
              </div>
            </div>

            <div className="script-summary">
              <div className="summary-item">
                <span className="summary-label">Schedule</span>
                <span className="summary-value">⏱️ {script.schedule}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Last Run</span>
                <span className="summary-value">{formatTimestamp(script.lastRun)}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Next Run</span>
                <span className="summary-value">{formatTimestamp(script.nextRun)}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Success Rate</span>
                <span className="summary-value success-rate">{script.successRate}%</span>
              </div>
            </div>

            {expandedScript === script.id && (
              <div className="script-details">
                <div className="details-section">
                  <h4>📊 Performance Metrics</h4>
                  <div className="metrics-grid">
                    <div className="metric-card">
                      <span className="metric-label">Total Runs</span>
                      <span className="metric-value">{script.totalRuns.toLocaleString()}</span>
                    </div>
                    <div className="metric-card">
                      <span className="metric-label">Avg Duration</span>
                      <span className="metric-value">{script.avgDuration}</span>
                    </div>
                    <div className="metric-card">
                      <span className="metric-label">Cron Expression</span>
                      <span className="metric-value cron">{script.cronExpression}</span>
                    </div>
                    <div className="metric-card">
                      <span className="metric-label">Endpoint</span>
                      <span className="metric-value endpoint">{script.endpoint}</span>
                    </div>
                  </div>
                </div>

                <div className="details-section">
                  <h4>⚙️ Configuration</h4>
                  <div className="config-list">
                    {Object.entries(script.config).map(([key, value]) => (
                      <div key={key} className="config-item">
                        <span className="config-key">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                        <span className="config-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="details-section">
                  <h4>📋 Recent Execution Logs</h4>
                  <div className="logs-container">
                    {script.logs.map((log, index) => (
                      <div key={index} className={`log-entry ${getLogStatusColor(log.status)}`}>
                        <div className="log-header">
                          <span className="log-timestamp">{formatTimestamp(log.timestamp)}</span>
                          <span className="log-duration">{log.duration}</span>
                        </div>
                        <div className="log-message">{log.message}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="script-actions">
                  <button className="btn-primary" onClick={() => runScriptNow(script.id)}>
                    ▶️ Run Now
                  </button>
                  <button className="btn-secondary">
                    📝 View Full Logs
                  </button>
                  <button className="btn-secondary">
                    ⚙️ Edit Config
                  </button>
                  <button className="btn-danger">
                    ⏸️ Pause Script
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AutomationHub;
