import { useState } from 'react';
import FacilityLocation from './FacilityLocation';
import './NetworkEngineering.css';

function NetworkEngineering() {
  const [activeTab, setActiveTab] = useState('facility-location');

  return (
    <div className="network-engineering">
      <div className="network-tabs">
        <button
          className={`tab-button ${activeTab === 'facility-location' ? 'active' : ''}`}
          onClick={() => setActiveTab('facility-location')}
        >
          <span className="tab-icon">📍</span>
          <div className="tab-info">
            <span className="tab-title">Facility Location</span>
            <span className="tab-desc">Center of Gravity Analysis</span>
          </div>
        </button>
        
        <button
          className="tab-button disabled"
          disabled
          title="Coming soon"
        >
          <span className="tab-icon">🚚</span>
          <div className="tab-info">
            <span className="tab-title">Lane Analysis</span>
            <span className="tab-desc">Coming Soon</span>
          </div>
        </button>
        
        <button
          className="tab-button disabled"
          disabled
          title="Coming soon"
        >
          <span className="tab-icon">🌐</span>
          <div className="tab-info">
            <span className="tab-title">Network Design</span>
            <span className="tab-desc">Coming Soon</span>
          </div>
        </button>
      </div>

      <div className="network-content">
        {activeTab === 'facility-location' && <FacilityLocation />}
      </div>
    </div>
  );
}

export default NetworkEngineering;
