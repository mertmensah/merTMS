import React, { useState, useEffect, useRef } from 'react'
import { tmsAPI } from '../services/api'
import './AIAssistant.css'

function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hey there! I\'m Mert, and I\'m here to help you get the most out of merTM.S. Whether you need help navigating the platform, understanding your data, or figuring out the best way to optimize your loads - just ask. What can I help you with?',
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [chatWidth, setChatWidth] = useState(400)
  const [isResizing, setIsResizing] = useState(false)
  
  const messagesEndRef = useRef(null)
  const chatContainerRef = useRef(null)
  const resizeStartX = useRef(0)
  const resizeStartWidth = useRef(0)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return
      
      const deltaX = resizeStartX.current - e.clientX
      const newWidth = Math.min(Math.max(300, resizeStartWidth.current + deltaX), 800)
      setChatWidth(newWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  const handleResizeStart = (e) => {
    setIsResizing(true)
    resizeStartX.current = e.clientX
    resizeStartWidth.current = chatWidth
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await tmsAPI.chatWithAssistant({
        message: inputMessage,
        conversation_history: messages.slice(-10) // Send last 10 messages for context
      })

      console.log('Assistant response:', response) // Debug log

      // Backend returns { data: { data: { message: "..." } } }
      const responseData = response.data.data || response.data

      const assistantMessage = {
        role: 'assistant',
        content: responseData.message || responseData.response || '❌ No response from server',
        timestamp: new Date(),
        blocked: responseData.blocked || false,
        warning: responseData.warning || null,
        reason: responseData.reason || null
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      console.error('Error response:', error.response) // Debug log
      
      // Build detailed error message
      let errorDetails = `**Error Type:** ${error.message}\n\n`
      
      if (error.response) {
        errorDetails += `**HTTP Status:** ${error.response.status} ${error.response.statusText}\n\n`
        errorDetails += `**Response Data:**\n\`\`\`json\n${JSON.stringify(error.response.data, null, 2)}\n\`\`\`\n\n`
      } else if (error.request) {
        errorDetails += `**Issue:** No response received from server\n\n`
        errorDetails += `**Check:**\n- Backend running on http://localhost:5000?\n- CORS enabled?\n- Network connectivity?\n\n`
      }
      
      errorDetails += `**Troubleshooting:**\n- Check backend terminal for errors\n- Verify API endpoint: POST /api/assistant/chat\n- Check browser console (F12) for details`
      
      const errorMessage = {
        role: 'assistant',
        content: `❌ **Error Processing Request**\n\n${errorDetails}`,
        timestamp: new Date(),
        isError: true
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const toggleExpand = () => {
    setIsExpanded(!isExpanded)
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <>
      {/* Chat Toggle Button */}
      {!isOpen && (
        <button 
          className="ai-assistant-toggle"
          onClick={() => setIsOpen(true)}
          title="Chat with Mert"
        >
          <span className="ai-icon">👨</span>
          <span className="ai-label">Mert</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div 
          className={`ai-assistant-container ${isExpanded ? 'expanded' : ''}`}
          style={{ width: `${chatWidth}px` }}
          ref={chatContainerRef}
        >
          {/* Resize Handle */}
          <div 
            className="resize-handle"
            onMouseDown={handleResizeStart}
            title="Drag to resize"
          />

          {/* Header */}
          <div className="ai-assistant-header">
            <div className="header-left">
              <span className="ai-icon">👨</span>
              <div className="header-text">
                <h3>Mert, your AI Guide to merTM.S</h3>
                <span className="status-indicator">● Online</span>
              </div>
            </div>
            <div className="header-actions">
              <button 
                className="icon-btn"
                onClick={toggleExpand}
                title={isExpanded ? "Minimize" : "Expand"}
              >
                {isExpanded ? '⬇' : '⬆'}
              </button>
              <button 
                className="icon-btn"
                onClick={() => setIsOpen(false)}
                title="Close"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="ai-assistant-messages">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`message ${msg.role} ${msg.isError ? 'error' : ''} ${msg.blocked ? 'blocked' : ''}`}
              >
                <div className="message-content">
                  {msg.warning && (
                    <div className="message-warning">
                      ⚠️ {msg.warning}
                    </div>
                  )}
                  <p>{msg.content}</p>
                </div>
                <span className="message-time">{formatTime(msg.timestamp)}</span>
              </div>
            ))}
            {isLoading && (
              <div className="message assistant loading">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="ai-assistant-input">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about merTM.S..."
              rows={2}
              disabled={isLoading}
            />
            <button 
              className="send-btn"
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
            >
              {isLoading ? '⏳' : '➤'}
            </button>
          </div>

          {/* Footer */}
          <div className="ai-assistant-footer">
            <span className="footer-text">Powered by Google Gemini AI</span>
          </div>
        </div>
      )}
    </>
  )
}

export default AIAssistant
