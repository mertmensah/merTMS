import axios from 'axios';

// Use environment variable if available, otherwise detect based on build mode
const API_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.PROD 
    ? 'https://mertms-nwh7.onrender.com/api'
    : 'http://localhost:5000/api'
);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 180000, // 3 minute timeout for long AI operations
});

export const tmsAPI = {
  // Orders
  getOrders: () => api.get('/orders'),
  createOrder: (orderData) => api.post('/orders', orderData),
  generateOrders: (count = 10) => api.post('/orders/generate', { count }),
  generateMonthlyOrders: () => api.post('/orders/generate', { monthly: true }),
  clearOrders: () => api.delete('/orders/clear'),
  
  // Load Optimization
  optimizeLoads: (orderIds = []) => api.post('/loads/optimize', { order_ids: orderIds }),
  
  // Loads
  getLoads: () => api.get('/loads'),
  getLoadById: (loadId) => api.get(`/loads/${loadId}`),
  simulateTodayLoads: () => api.post('/loads/simulate-today'),
  
  // Route Planning
  optimizeRoute: (loadData) => api.post('/routes/optimize', { load_data: loadData }),
  
  // Cost Analysis
  analyzeCosts: (loadPlan, routePlan) => api.post('/costs/analyze', { 
    load_plan: loadPlan, 
    route_plan: routePlan 
  }),
  
  // Analytics
  getDashboard: () => api.get('/analytics/dashboard'),
  
  // Carriers
  getCarriers: () => api.get('/carriers'),
  
  // Products
  getProducts: () => api.get('/products'),
  createProduct: (productData) => api.post('/products', productData),
  seedProducts: () => api.post('/products/seed'),
  
  // Facilities
  getFacilities: () => api.get('/facilities'),
  getFacilityByCode: (facilityCode) => api.get(`/facilities/code/${facilityCode}`),
  getFacilityByCity: (city) => api.get(`/facilities/city/${city}`),
  getOrigins: () => api.get('/facilities/origins'),
  getDestinations: () => api.get('/facilities/destinations'),
  seedFacilities: () => api.post('/facilities/seed'),
  
  // Map Visualization
  getLoadRoutesMapData: (loadPlan) => api.post('/map/load-routes', { load_plan: loadPlan }),
  
  // AI Assistant
  chatWithAssistant: (data) => api.post('/assistant/chat', data),
  
  // mertsightsAI - Conversational Analytics
  queryMertsights: (question, conversationHistory = []) => api.post('/mertsights/query', {
    question,
    conversation_history: conversationHistory
  }),
  
  // Network Engineering
  analyzeFacilityLocation: (k) => api.post('/network/facility-location', { k }),
  
  // AI Docuscan - Document OCR and Classification
  uploadDocumentForAnalysis: (formData) => {
    return api.post('/docuscan/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 300000, // 5 minutes for document processing
    });
  },
  
  // People Management
  getPeople: () => api.get('/people'),
  createPerson: (personData) => api.post('/people', personData),
  updatePerson: (personId, personData) => api.put(`/people/${personId}`, personData),
  deletePerson: (personId) => api.delete(`/people/${personId}`),
  
  // Project Management
  getProjects: () => api.get('/projects'),
  createProject: (projectData) => api.post('/projects', projectData),
  getProjectStories: (projectId) => api.get(`/projects/${projectId}/stories`),
  createStory: (storyData) => api.post('/stories', storyData),
  updateStory: (storyId, storyData) => api.put(`/stories/${storyId}`, storyData),
};

export default api;
