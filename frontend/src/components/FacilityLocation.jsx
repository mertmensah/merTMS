import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Circle, Popup, useMap } from 'react-leaflet';
import api from '../services/api';
import './FacilityLocation.css';

// Component to fit map bounds
function MapBounds({ facilities, demandPoints }) {
  const map = useMap();
  
  useEffect(() => {
    if (facilities.length > 0 || demandPoints.length > 0) {
      const allPoints = [
        ...facilities.map(f => [f.latitude, f.longitude]),
        ...demandPoints.map(d => [d.latitude, d.longitude])
      ];
      
      if (allPoints.length > 0) {
        const bounds = allPoints.reduce((bounds, point) => bounds.extend(point), 
          window.L.latLngBounds(allPoints[0], allPoints[0]));
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [facilities, demandPoints, map]);
  
  return null;
}

function FacilityLocation() {
  const [k, setK] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/network/facility-location', { k });
      setResults(response.data);
    } catch (err) {
      console.error('Facility location analysis error:', err);
      setError(err.response?.data?.error || 'Failed to run analysis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runAnalysis();
  }, []);

  const handleSliderChange = (e) => {
    setK(parseInt(e.target.value));
  };

  const handleAnalyze = () => {
    runAnalysis();
  };

  // Color palette for clusters
  const clusterColors = [
    '#176B91', '#46B1E1', '#FF6B6B', '#4ECDC4', '#FFD93D',
    '#95E1D3', '#F38181', '#AA96DA', '#FCBAD3', '#A8D8EA'
  ];

  return (
    <div className="facility-location">
      <div className="fl-header">
        <h2>Facility Location Optimization</h2>
        <p>
          Uses K-means clustering to identify optimal facility locations based on customer demand patterns.
          Adjust the number of facilities to see how it affects coverage and distances.
        </p>
      </div>

      <div className="fl-controls">
        <div className="control-group">
          <label htmlFor="k-slider">
            Number of Facilities (k): <strong>{k}</strong>
          </label>
          <div className="slider-container">
            <span className="slider-label">1</span>
            <input
              id="k-slider"
              type="range"
              min="1"
              max="10"
              value={k}
              onChange={handleSliderChange}
              className="k-slider"
            />
            <span className="slider-label">10</span>
          </div>
        </div>
        
        <button 
          className="analyze-button"
          onClick={handleAnalyze}
          disabled={loading}
        >
          {loading ? 'Analyzing...' : 'Run Analysis'}
        </button>
      </div>

      {error && (
        <div className="fl-error">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {results && (
        <>
          <div className="fl-summary">
            <div className="summary-card">
              <div className="summary-label">Facilities</div>
              <div className="summary-value">{results.facilities.length}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Total Demand</div>
              <div className="summary-value">{results.total_demand.toLocaleString()} lbs</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Demand Points</div>
              <div className="summary-value">{results.demand_points.length}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Avg Volume/Facility</div>
              <div className="summary-value">
                {Math.round(results.total_demand / results.facilities.length).toLocaleString()} lbs
              </div>
            </div>
          </div>

          <div className="fl-map-container">
            <MapContainer
              center={[39.8283, -98.5795]}
              zoom={4}
              style={{ height: '600px', width: '100%' }}
              className="facility-map"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              <MapBounds facilities={results.facilities} demandPoints={results.demand_points} />
              
              {/* Demand Points - sized by weight */}
              {results.demand_points.map((point, idx) => {
                const facilityColor = clusterColors[point.assigned_facility - 1] || '#176B91';
                const radius = Math.max(3, Math.min(15, Math.sqrt(point.weight) / 2));
                
                return (
                  <CircleMarker
                    key={`demand-${idx}`}
                    center={[point.latitude, point.longitude]}
                    radius={radius}
                    pathOptions={{
                      fillColor: facilityColor,
                      fillOpacity: 0.4,
                      color: facilityColor,
                      weight: 1,
                      opacity: 0.6
                    }}
                  >
                    <Popup>
                      <div className="demand-popup">
                        <strong>{point.customer}</strong><br/>
                        Weight: {point.weight.toLocaleString()} lbs<br/>
                        Assigned to: Facility {point.assigned_facility}
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
              
              {/* Facility Locations - large stars */}
              {results.facilities.map((facility) => {
                const facilityColor = clusterColors[facility.facility_id - 1] || '#176B91';
                
                return (
                  <div key={`facility-${facility.facility_id}`}>
                    {/* Service area circle */}
                    <Circle
                      center={[facility.latitude, facility.longitude]}
                      radius={facility.avg_customer_distance * 1609.34} // Convert miles to meters
                      pathOptions={{
                        fillColor: facilityColor,
                        fillOpacity: 0.05,
                        color: facilityColor,
                        weight: 2,
                        opacity: 0.4,
                        dashArray: '5, 10'
                      }}
                    />
                    
                    {/* Facility marker */}
                    <CircleMarker
                      center={[facility.latitude, facility.longitude]}
                      radius={15}
                      pathOptions={{
                        fillColor: facilityColor,
                        fillOpacity: 1,
                        color: '#ffffff',
                        weight: 3,
                        opacity: 1
                      }}
                    >
                      <Popup>
                        <div className="facility-popup">
                          <h3>Facility #{facility.facility_id}</h3>
                          <p><strong>Location:</strong> {facility.nearest_city}, {facility.nearest_state}</p>
                          <p><strong>Coordinates:</strong> {facility.latitude.toFixed(4)}°, {facility.longitude.toFixed(4)}°</p>
                          <p><strong>Avg Distance:</strong> {facility.avg_customer_distance} mi</p>
                          <p><strong>Volume:</strong> {facility.total_volume.toLocaleString()} lbs</p>
                          <p><strong>Customers:</strong> {facility.num_customers}</p>
                        </div>
                      </Popup>
                    </CircleMarker>
                  </div>
                );
              })}
            </MapContainer>

            <div className="map-legend">
              <h4>Legend</h4>
              <div className="legend-item">
                <div className="legend-marker facility-marker"></div>
                <span>Optimal Facility Location</span>
              </div>
              <div className="legend-item">
                <div className="legend-marker demand-marker"></div>
                <span>Customer Demand (sized by weight)</span>
              </div>
              <div className="legend-item">
                <div className="legend-marker service-area"></div>
                <span>Average Service Radius</span>
              </div>
              <div className="legend-note">
                * Colors indicate facility assignment clusters
              </div>
            </div>
          </div>

          <div className="fl-results">
            <h3>Facility Details</h3>
            <div className="results-table-container">
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Facility</th>
                    <th>Nearest City</th>
                    <th>State</th>
                    <th>Coordinates</th>
                    <th>Avg Customer Distance</th>
                    <th>Total Volume</th>
                    <th>Customers Served</th>
                  </tr>
                </thead>
                <tbody>
                  {results.facilities.map((facility) => {
                    const facilityColor = clusterColors[facility.facility_id - 1] || '#176B91';
                    
                    return (
                      <tr key={facility.facility_id}>
                        <td>
                          <div className="facility-cell">
                            <div 
                              className="facility-color-dot" 
                              style={{ backgroundColor: facilityColor }}
                            ></div>
                            Facility #{facility.facility_id}
                          </div>
                        </td>
                        <td>{facility.nearest_city}</td>
                        <td>{facility.nearest_state}</td>
                        <td className="coord-cell">
                          {facility.latitude.toFixed(4)}°, {facility.longitude.toFixed(4)}°
                        </td>
                        <td>{facility.avg_customer_distance} mi</td>
                        <td>{facility.total_volume.toLocaleString()} lbs</td>
                        <td>{facility.num_customers}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default FacilityLocation;
