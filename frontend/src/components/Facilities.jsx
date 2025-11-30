import { useState, useEffect } from 'react'
import { tmsAPI } from '../services/api'
import './Facilities.css'

function Facilities() {
  const [facilities, setFacilities] = useState([])
  const [filteredFacilities, setFilteredFacilities] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchFilters, setSearchFilters] = useState({
    facilityName: '',
    facilityCode: '',
    city: '',
    state: '',
    country: ''
  })

  useEffect(() => {
    fetchFacilities()
  }, [])

  useEffect(() => {
    filterFacilities()
  }, [searchFilters, facilities])

  const fetchFacilities = async () => {
    try {
      setLoading(true)
      const response = await tmsAPI.getFacilities()
      const facilitiesData = response.data?.data || response.data || []
      setFacilities(facilitiesData)
      setFilteredFacilities(facilitiesData)
    } catch (error) {
      console.error('Error fetching facilities:', error)
      alert('Failed to fetch facilities')
    } finally {
      setLoading(false)
    }
  }

  const filterFacilities = () => {
    let filtered = facilities

    if (searchFilters.facilityName) {
      filtered = filtered.filter(f => 
        f.facility_name.toLowerCase().includes(searchFilters.facilityName.toLowerCase())
      )
    }

    if (searchFilters.facilityCode) {
      filtered = filtered.filter(f => 
        f.facility_code.toLowerCase().includes(searchFilters.facilityCode.toLowerCase())
      )
    }

    if (searchFilters.city) {
      filtered = filtered.filter(f => 
        f.city.toLowerCase().includes(searchFilters.city.toLowerCase())
      )
    }

    if (searchFilters.state) {
      filtered = filtered.filter(f => 
        f.state_province?.toLowerCase().includes(searchFilters.state.toLowerCase())
      )
    }

    if (searchFilters.country) {
      filtered = filtered.filter(f => 
        f.country.toLowerCase().includes(searchFilters.country.toLowerCase())
      )
    }

    setFilteredFacilities(filtered)
  }

  const handleSearchChange = (field, value) => {
    setSearchFilters(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const clearFilters = () => {
    setSearchFilters({
      facilityName: '',
      facilityCode: '',
      city: '',
      state: '',
      country: ''
    })
  }

  const origins = filteredFacilities.filter(f => f.facility_type === 'origin')
  const destinations = filteredFacilities.filter(f => f.facility_type === 'destination')

  return (
    <div className="facilities">
      <div className="header-section">
        <h2>Facilities Management</h2>
        <div className="facilities-stats">
          <div className="stat-badge">
            <span className="stat-label">Total Facilities:</span>
            <span className="stat-value">{facilities.length}</span>
          </div>
          <div className="stat-badge">
            <span className="stat-label">Origins:</span>
            <span className="stat-value origin">{origins.length}</span>
          </div>
          <div className="stat-badge">
            <span className="stat-label">Destinations:</span>
            <span className="stat-value destination">{destinations.length}</span>
          </div>
        </div>
      </div>

      <div className="search-section">
        <h3>Search Facilities</h3>
        <div className="search-grid">
          <div className="search-field">
            <label>Facility Name</label>
            <input
              type="text"
              placeholder="Search by name..."
              value={searchFilters.facilityName}
              onChange={(e) => handleSearchChange('facilityName', e.target.value)}
            />
          </div>
          <div className="search-field">
            <label>Facility Code</label>
            <input
              type="text"
              placeholder="Search by code..."
              value={searchFilters.facilityCode}
              onChange={(e) => handleSearchChange('facilityCode', e.target.value)}
            />
          </div>
          <div className="search-field">
            <label>City</label>
            <input
              type="text"
              placeholder="Search by city..."
              value={searchFilters.city}
              onChange={(e) => handleSearchChange('city', e.target.value)}
            />
          </div>
          <div className="search-field">
            <label>State/Province</label>
            <input
              type="text"
              placeholder="Search by state..."
              value={searchFilters.state}
              onChange={(e) => handleSearchChange('state', e.target.value)}
            />
          </div>
          <div className="search-field">
            <label>Country</label>
            <input
              type="text"
              placeholder="Search by country..."
              value={searchFilters.country}
              onChange={(e) => handleSearchChange('country', e.target.value)}
            />
          </div>
          <div className="search-actions">
            <button className="btn-secondary" onClick={clearFilters}>
              Clear Filters
            </button>
            <button className="btn-primary" onClick={fetchFacilities}>
              Refresh
            </button>
          </div>
        </div>
        <div className="search-results-count">
          Showing {filteredFacilities.length} of {facilities.length} facilities
        </div>
      </div>

      <div className="results-section">
        {loading ? (
          <div className="loading-state">
            <p>Loading facilities...</p>
          </div>
        ) : filteredFacilities.length === 0 ? (
          <div className="empty-state">
            <p>No facilities found matching your search criteria</p>
          </div>
        ) : (
          <>
            {origins.length > 0 && (
              <div className="facilities-group">
                <h3 className="group-title">
                  <span className="type-badge origin">Origins</span>
                  {origins.length} facilities
                </h3>
                <div className="facilities-grid">
                  {origins.map((facility) => (
                    <div key={facility.id} className="facility-card origin-card">
                      <div className="facility-header">
                        <h4>{facility.facility_name}</h4>
                        <span className="facility-code">{facility.facility_code}</span>
                      </div>
                      <div className="facility-details">
                        <div className="detail-row">
                          <span className="detail-label">Location:</span>
                          <span className="detail-value">
                            {facility.city}, {facility.state_province}
                          </span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Country:</span>
                          <span className="detail-value">{facility.country}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Coordinates:</span>
                          <span className="detail-value">
                            {facility.latitude}, {facility.longitude}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {destinations.length > 0 && (
              <div className="facilities-group">
                <h3 className="group-title">
                  <span className="type-badge destination">Destinations</span>
                  {destinations.length} facilities
                </h3>
                <div className="facilities-grid">
                  {destinations.map((facility) => (
                    <div key={facility.id} className="facility-card destination-card">
                      <div className="facility-header">
                        <h4>{facility.facility_name}</h4>
                        <span className="facility-code">{facility.facility_code}</span>
                      </div>
                      <div className="facility-details">
                        <div className="detail-row">
                          <span className="detail-label">Location:</span>
                          <span className="detail-value">
                            {facility.city}, {facility.state_province}
                          </span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Country:</span>
                          <span className="detail-value">{facility.country}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Coordinates:</span>
                          <span className="detail-value">
                            {facility.latitude}, {facility.longitude}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Facilities
