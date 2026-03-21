import { useState } from 'react'
import './AIAgent.css'

const API_URL = import.meta.env.VITE_API_URL || 'https://mertms-nwh7.onrender.com/api'

function AIAgent() {
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [history, setHistory] = useState([])

  const exampleQueries = [
    "Show me all delayed shipments",
    "What's the on-time delivery rate?",
    "Find orders going to California",
    "Check capacity for Chicago facility",
    "Calculate average shipment weight",
    "List top 5 customers by order count",
    "Show me Amazon orders",
    "Get route info from Dallas to Atlanta"
  ]

  const handleSubmit = async (queryText = question) => {
    if (!queryText.trim()) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch(`${API_URL}/agent/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: queryText })
      })

      // Check if response is ok before parsing
      if (!response.ok) {
        let errorMessage = `Server error (${response.status}): `
        
        // Try to parse error from JSON response
        try {
          const errorData = await response.json()
          errorMessage += errorData.error || errorData.message || 'Unknown error'
        } catch {
          // If response isn't JSON, use status text
          if (response.status === 502) {
            errorMessage = '🔧 Backend service is starting up or experiencing issues. This usually means the GEMINI_API_KEY is missing or LangChain has import errors. Check Render logs.'
          } else if (response.status === 500) {
            errorMessage = '⚠️ Server error - likely missing GEMINI_API_KEY environment variable or LangChain dependency issue. Check backend logs.'
          } else if (response.status === 404) {
            errorMessage = '❌ Agent endpoint not found. The AI Query Agent may not be deployed properly.'
          } else {
            errorMessage += response.statusText || 'Request failed'
          }
        }
        
        setError(errorMessage)
        setLoading(false)
        return
      }

      const data = await response.json()

      if (data.success) {
        setResult(data)
        setHistory(prev => [{
          question: queryText,
          answer: data.answer,
          steps: data.steps,
          timestamp: new Date().toISOString()
        }, ...prev].slice(0, 10)) // Keep last 10 queries
        setQuestion('') // Clear input
      } else {
        setError(data.error || 'Agent failed to process query')
      }
    } catch (err) {
      // Network errors, CORS issues, or JSON parse failures
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError(`🌐 Network error: Cannot reach backend server at ${API_URL}. Check if backend is deployed and CORS is configured.`)
      } else if (err instanceof SyntaxError) {
        setError(`📄 Invalid response from server - expected JSON but received HTML/text. Backend may be returning error page.`)
      } else {
        setError(`❌ Unexpected error: ${err.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleExampleClick = (example) => {
    setQuestion(example)
    handleSubmit(example)
  }

  return (
    <div className="ai-agent-container">
      <div className="agent-header">
        <h2>🤖 AI Query Agent</h2>
        <p className="agent-subtitle">
          Powered by LangChain · Ask questions in natural language
        </p>
      </div>

      {/* Query Input */}
      <div className="agent-input-section">
        <div className="input-wrapper">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit()
              }
            }}
            placeholder="Ask me anything about shipments, facilities, or operations..."
            rows={3}
            disabled={loading}
            className="agent-input"
          />
          <button
            onClick={() => handleSubmit()}
            disabled={loading || !question.trim()}
            className="agent-submit-btn"
          >
            {loading ? (
              <>
                <span className="spinner-small"></span>
                Thinking...
              </>
            ) : (
              <>
                <span>🚀</span>
                Ask Agent
              </>
            )}
          </button>
        </div>

        {/* Example Queries */}
        <div className="example-queries">
          <span className="example-label">💡 Try these examples:</span>
          <div className="example-chips">
            {exampleQueries.map((example, idx) => (
              <button
                key={idx}
                onClick={() => handleExampleClick(example)}
                disabled={loading}
                className="example-chip"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="agent-error">
          <strong>❌ Error:</strong> {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="agent-loading">
          <div className="loading-content">
            <div className="spinner"></div>
            <div className="loading-text">
              <p>🧠 Agent is thinking...</p>
              <p className="loading-subtext">Using tools to find the answer</p>
            </div>
          </div>
        </div>
      )}

      {/* Result Display */}
      {result && !loading && (
        <div className="agent-result">
          <div className="result-header">
            <h3>✅ Answer</h3>
            <span className="result-timestamp">
              {new Date().toLocaleTimeString()}
            </span>
          </div>
          <div className="result-answer">
            {result.answer}
          </div>

          {/* Show reasoning steps if available */}
          {result.steps && result.steps.length > 0 && (
            <details className="result-steps">
              <summary>🔍 View Agent's Reasoning ({result.steps.length} steps)</summary>
              <div className="steps-content">
                {result.steps.map((step, idx) => (
                  <div key={idx} className="step-item">
                    <div className="step-number">Step {idx + 1}</div>
                    <div className="step-details">
                      <div className="step-action">
                        <strong>Tool:</strong> {step[0]?.tool || 'Unknown'}
                      </div>
                      <div className="step-input">
                        <strong>Input:</strong> {step[0]?.tool_input || 'N/A'}
                      </div>
                      <div className="step-output">
                        <strong>Output:</strong>
                        <pre>{typeof step[1] === 'string' ? step[1].substring(0, 500) : JSON.stringify(step[1], null, 2).substring(0, 500)}</pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {/* Query History */}
      {history.length > 0 && (
        <div className="agent-history">
          <h3>📜 Recent Queries</h3>
          <div className="history-list">
            {history.map((item, idx) => (
              <div key={idx} className="history-item">
                <div className="history-question">
                  <strong>Q:</strong> {item.question}
                </div>
                <div className="history-answer">
                  <strong>A:</strong> {item.answer}
                </div>
                <div className="history-time">
                  {new Date(item.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Panel */}
      <div className="agent-info">
        <h4>ℹ️ About the AI Agent</h4>
        <p>
          This agent uses <strong>LangChain</strong> with a <strong>ReAct</strong> (Reasoning + Acting) pattern.
          It can autonomously decide which tools to use based on your question:
        </p>
        <ul>
          <li><strong>SearchOrders</strong> - Find shipments by various criteria</li>
          <li><strong>GetFacilityInfo</strong> - Look up warehouse/facility details</li>
          <li><strong>CalculateMetrics</strong> - Compute KPIs and analytics</li>
          <li><strong>CheckCapacity</strong> - Check facility utilization</li>
          <li><strong>OptimizeRoute</strong> - Calculate routes and costs</li>
        </ul>
        <p className="info-note">
          The agent thinks step-by-step, using multiple tools if needed to answer complex questions.
        </p>
      </div>
    </div>
  )
}

export default AIAgent
