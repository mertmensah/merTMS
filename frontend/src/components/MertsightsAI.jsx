import React, { useState, useRef, useEffect } from 'react';
import api from '../services/api';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import './MertsightsAI.css';

const MertsightsAI = () => {
  const [messages, setMessages] = useState([
    {
      type: 'assistant',
      text: "Hey! I'm mertsightsAI 📊\n\nAsk me anything about your shipments, loads, orders, or operations. I can show you insights as tables, charts, or graphs.\n\n**Try asking:**\n- \"Show me all pending orders\"\n- \"What's the average load utilization?\"\n- \"Graph orders by status\"\n- \"Which carriers have the highest ratings?\"",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [conversationHistory, setConversationHistory] = useState([]);

  const COLORS = ['#176B91', '#46B1E1', '#FF8042', '#00C49F', '#FFBB28', '#8884D8'];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    // Add user message
    const newUserMessage = {
      type: 'user',
      text: userMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newUserMessage]);

    try {
      // Call mertsightsAI API
      const response = await api.post('/mertsights/query', {
        question: userMessage,
        conversation_history: conversationHistory
      });

      const result = response.data;

      if (result.success) {
        // Check if this is a conversational response (no data query needed)
        if (result.conversational) {
          const conversationalMessage = {
            type: 'assistant',
            text: result.response,
            conversational: true,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, conversationalMessage]);
        } else {
          // Add assistant response with data visualization
          const assistantMessage = {
            type: 'assistant',
            text: result.insight || 'Here are the results:',
            data: result.data,
            visualization: result.visualization,
            sql: result.sql,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, assistantMessage]);

          // Update conversation history (only for data queries)
          setConversationHistory(prev => [
            ...prev,
            {
              question: userMessage,
              sql: result.sql,
              rows: result.data?.length || 0
            }
          ]);
        }
      } else {
        // Error response
        const errorMessage = {
          type: 'assistant',
          text: `**Error:** ${result.error || 'Something went wrong'}`,
          isError: true,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('mertsightsAI error:', error);
      const errorMessage = {
        type: 'assistant',
        text: `**Error:** ${error.response?.data?.error || error.message || 'Network error - please try again'}`,
        isError: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderVisualization = (message) => {
    if (!message.data || !message.visualization) return null;

    const { type, xAxis, yAxis, labelField, valueField, title, chartImage, useMatplotlib } = message.visualization;
    const data = message.data;

    if (data.length === 0) {
      return <div className="no-data">No data to display</div>;
    }

    // If matplotlib chart image is available, display it
    if (chartImage && useMatplotlib) {
      return (
        <div className="chart-container">
          <h4 className="chart-title">{title}</h4>
          <div className="matplotlib-chart">
            <img 
              src={chartImage} 
              alt={title}
              style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px' }}
            />
          </div>
          {message.visualization.reasoning && (
            <p className="chart-reasoning">
              <em>Why this visualization: {message.visualization.reasoning}</em>
            </p>
          )}
        </div>
      );
    }

    // Otherwise, use Recharts for client-side rendering
    switch (type) {
      case 'bar':
        return (
          <div className="chart-container">
            <h4 className="chart-title">{title}</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={xAxis} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey={yAxis} fill="#176B91" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );

      case 'line':
        return (
          <div className="chart-container">
            <h4 className="chart-title">{title}</h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={xAxis} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey={yAxis} stroke="#176B91" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );

      case 'pie':
        return (
          <div className="chart-container">
            <h4 className="chart-title">{title}</h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data}
                  dataKey={valueField}
                  nameKey={labelField}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        );

      case 'table':
      default:
        return renderTable(data);
    }
  };

  const renderTable = (data) => {
    if (!data || data.length === 0) {
      return <div className="no-data">No data available</div>;
    }

    const columns = Object.keys(data[0]);
    const maxRows = 100; // Limit display for performance

    return (
      <div className="table-container">
        <div className="table-info">Showing {Math.min(data.length, maxRows)} of {data.length} results</div>
        <table className="data-table">
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.slice(0, maxRows).map((row, idx) => (
              <tr key={idx}>
                {columns.map(col => (
                  <td key={col}>
                    {formatCellValue(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const formatCellValue = (value) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'number') return value.toLocaleString();
    if (typeof value === 'string' && value.includes('T') && value.includes(':')) {
      // Likely a timestamp
      try {
        return new Date(value).toLocaleString();
      } catch {
        return value;
      }
    }
    return String(value);
  };

  const copySQL = (sql) => {
    navigator.clipboard.writeText(sql);
    alert('SQL copied to clipboard!');
  };

  return (
    <div className="mertsights-container">
      <div className="mertsights-header">
        <h1>📊 mertsightsAI</h1>
        <p>Ask questions about your data in plain English</p>
      </div>

      <div className="messages-container">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.type}`}>
            <div className="message-content">
              {/* Text content */}
              <div className="message-text">
                {message.text.split('\n').map((line, i) => {
                  // Handle markdown bold
                  if (line.startsWith('**') && line.endsWith('**')) {
                    return <strong key={i}>{line.slice(2, -2)}</strong>;
                  }
                  if (line.startsWith('- ')) {
                    return <li key={i}>{line.slice(2)}</li>;
                  }
                  return <p key={i}>{line}</p>;
                })}
              </div>

              {/* Visualization */}
              {message.data && message.visualization && renderVisualization(message)}

              {/* SQL Query (collapsible) */}
              {message.sql && (
                <details className="sql-details">
                  <summary>View SQL Query</summary>
                  <div className="sql-container">
                    <pre>{message.sql}</pre>
                    <button
                      className="copy-sql-btn"
                      onClick={() => copySQL(message.sql)}
                      title="Copy SQL"
                    >
                      📋 Copy
                    </button>
                  </div>
                </details>
              )}

              <div className="message-timestamp">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="message assistant">
            <div className="message-content">
              <div className="loading-indicator">
                <span className="loading-dot"></span>
                <span className="loading-dot"></span>
                <span className="loading-dot"></span>
                <span className="loading-text">Analyzing your question...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="input-container">
        <textarea
          className="message-input"
          placeholder="Ask about your shipments, loads, orders..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
          rows={2}
        />
        <button
          className="send-button"
          onClick={handleSendMessage}
          disabled={!inputMessage.trim() || isLoading}
        >
          {isLoading ? '⏳' : '📊 Ask'}
        </button>
      </div>

      <div className="quick-queries">
        <span className="quick-queries-label">Quick queries:</span>
        {[
          'Show all pending orders',
          'Average load utilization',
          'Orders by priority',
          'Top 10 customers by order volume'
        ].map((query, idx) => (
          <button
            key={idx}
            className="quick-query-btn"
            onClick={() => {
              setInputMessage(query);
              setTimeout(() => handleSendMessage(), 100);
            }}
            disabled={isLoading}
          >
            {query}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MertsightsAI;
