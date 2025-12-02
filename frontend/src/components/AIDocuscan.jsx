import React, { useState } from 'react';
import './AIDocuscan.css';
import * as api from '../services/api';

const AIDocuscan = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const documentTypes = [
    'Bill of Lading',
    'Signed Bill of Lading',
    'Commercial Invoice',
    'Packing List',
    'Carrier Invoice',
    'Communication Records'
  ];

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type (images and PDFs)
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        setError('Please upload a valid image (JPG, PNG) or PDF file');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setError('');
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await api.uploadDocumentForAnalysis(formData);
      setResult(response);
    } catch (err) {
      setError(err.message || 'Failed to analyze document. Please try again.');
      console.error('Document analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderExtractedFields = () => {
    if (!result?.extracted_data) return null;

    return (
      <div className="extracted-fields">
        <h3>Extracted Fields</h3>
        <div className="fields-grid">
          {Object.entries(result.extracted_data).map(([key, value]) => (
            <div key={key} className="field-item">
              <span className="field-label">{key.replace(/_/g, ' ').toUpperCase()}:</span>
              <span className="field-value">{value || 'Not found'}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="docuscan-container">
      <div className="docuscan-header">
        <h1>AI Docuscan</h1>
        <p className="subtitle">Use Agentic AI to scan and classify your documents</p>
      </div>

      <div className="upload-section">
        <div className="upload-area">
          <input
            type="file"
            id="file-input"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <label htmlFor="file-input" className="upload-button">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="17 8 12 3 7 8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="12" y1="3" x2="12" y2="15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {selectedFile ? selectedFile.name : 'Choose File'}
          </label>

          {selectedFile && (
            <div className="file-info">
              <p>Selected: {selectedFile.name}</p>
              <p className="file-size">Size: {(selectedFile.size / 1024).toFixed(2)} KB</p>
            </div>
          )}

          <button
            className="analyze-button"
            onClick={handleUpload}
            disabled={!selectedFile || loading}
          >
            {loading ? 'Analyzing...' : 'Analyze Document'}
          </button>
        </div>

        {error && (
          <div className="error-message">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10" strokeWidth="2"/>
              <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" strokeLinecap="round"/>
              <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            {error}
          </div>
        )}
      </div>

      {loading && (
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Processing document with NVIDIA OCR...</p>
          <p className="loading-steps">Extracting text → Classifying → Verifying → Extracting fields</p>
        </div>
      )}

      {result && !loading && (
        <div className="results-container">
          <div className="classification-result">
            <h2>Classification Result</h2>
            <div className="classification-card">
              <div className="classification-type">
                <span className="label">Document Type:</span>
                <span className="value primary">{result.classification}</span>
              </div>
              <div className="confidence-score">
                <span className="label">Confidence:</span>
                <span className="value">{result.confidence}%</span>
              </div>
            </div>

            {result.verification_notes && (
              <div className="verification-notes">
                <h4>Verification Notes:</h4>
                <p>{result.verification_notes}</p>
              </div>
            )}
          </div>

          {renderExtractedFields()}

          <div className="raw-ocr-section">
            <h3>Raw OCR Text</h3>
            <p className="ocr-description">Complete text extracted from document (for troubleshooting)</p>
            <textarea
              className="raw-ocr-text"
              value={result.raw_text || ''}
              readOnly
              rows={15}
            />
          </div>

          <div className="document-types-reference">
            <h4>Supported Document Types:</h4>
            <div className="types-list">
              {documentTypes.map((type, idx) => (
                <span
                  key={idx}
                  className={`type-badge ${result.classification === type ? 'active' : ''}`}
                >
                  {type}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIDocuscan;
