import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// File upload
export const uploadFiles = (trainFile, testFile, rulFile) => {
  const formData = new FormData();
  formData.append('train_file', trainFile);
  formData.append('test_file', testFile);
  formData.append('rul_file', rulFile);
  return api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getDatasets = () => api.get('/datasets');

// EDA endpoints
export const getStatistics = () => api.get('/eda/statistics');
export const getVisualizations = () => api.get('/eda/visualizations');
export const getCorrelationHeatmap = () => api.get('/eda/correlation/heatmap');

// Training
export const trainModel = (modelType) => api.post('/train', { model_type: modelType });
export const getModels = () => api.get('/models');
export const getModelDetails = (modelId) => api.get(`/models/${modelId}`);
export const compareModels = () => api.get('/models/compare');

// Prediction
export const predictRUL = (modelId, engineId, file) => {
  const formData = new FormData();
  formData.append('model_id', modelId);
  formData.append('engine_id', engineId);
  formData.append('file', file);
  return api.post('/predict', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};


export const getEngineTimeseries = (engineId) => api.get(`/eda/timeseries/${engineId}`);

export const getPredictions = (params) => api.get('/predictions', { params });

export default api;

