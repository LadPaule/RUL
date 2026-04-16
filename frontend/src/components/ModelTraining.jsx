import React, { useState, useEffect } from 'react';
import {
  Box, Typography, FormControl, InputLabel, Select, MenuItem, Button,
  Card, CardContent, Grid, LinearProgress, Alert, Chip, Paper, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress
} from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { trainModel, getModels, compareModels } from '../services/api';

export default function ModelTraining() {
  const [modelType, setModelType] = useState('random_forest');
  const [training, setTraining] = useState(false);
  const [message, setMessage] = useState(null);
  const [models, setModels] = useState([]);
  const [comparison, setComparison] = useState([]);
  const [loadingModels, setLoadingModels] = useState(true);
  const [error, setError] = useState(null);

  const fetchModels = async () => {
    try {
      setLoadingModels(true);
      setError(null);
      const modelsRes = await getModels();
      setModels(modelsRes.data);

      // Compare models - handle separately to avoid breaking if fails
      try {
        const compRes = await compareModels();
        // New response format: { models: [...] }
        setComparison(compRes.data.models || compRes.data || []);
      } catch (compErr) {
        console.warn('Model comparison not available:', compErr);
        setComparison([]);
      }
    } catch (err) {
      console.error('Failed to fetch models:', err);
      setError('Failed to load trained models. Please ensure the backend is running.');
    } finally {
      setLoadingModels(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const handleTrain = async () => {
    setTraining(true);
    setMessage(null);
    try {
      await trainModel(modelType);
      setMessage({ type: 'success', text: `Training of ${modelType} model started. Refresh the list after a minute.` });
      // Wait 5 seconds then refresh models
      setTimeout(() => {
        fetchModels();
        setMessage(null);
      }, 5000);
    } catch (err) {
      console.error('Training error:', err);
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Training failed. Is the backend running?' });
    } finally {
      setTraining(false);
    }
  };

  const metricsData = comparison.map(item => ({
    name: item.model_type,
    RMSE: item.metrics?.rmse || 0,
    MAE: item.metrics?.mae || 0,
    'R²': item.metrics?.r2 || 0,
    'CMAPSS Score': (item.metrics?.cmapss_score || 0) / 1000,
  }));

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Model Training
      </Typography>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Model Type</InputLabel>
                <Select
                  value={modelType}
                  onChange={(e) => setModelType(e.target.value)}
                  label="Model Type"
                >
                  <MenuItem value="linear">Linear Regression</MenuItem>
                  <MenuItem value="random_forest">Random Forest</MenuItem>
                  <MenuItem value="polynomial">Polynomial Regression (deg 2)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button
                variant="contained"
                size="large"
                onClick={handleTrain}
                disabled={training}
                fullWidth
              >
                {training ? 'Training...' : 'Train Model'}
              </Button>
            </Grid>
          </Grid>
          {training && <LinearProgress sx={{ mt: 2 }} />}
          {message && <Alert severity={message.type} sx={{ mt: 2 }}>{message.text}</Alert>}
        </CardContent>
      </Card>

      <Typography variant="h5" gutterBottom>
        Trained Models
        <Button
          variant="outlined"
          size="small"
          onClick={fetchModels}
          sx={{ ml: 2 }}
        >
          Refresh
        </Button>
      </Typography>

      {loadingModels ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      ) : models.length === 0 ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          No trained models yet. Click "Train Model" to train your first model.
        </Alert>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ mb: 4 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">RMSE</TableCell>
                  <TableCell align="right">MAE</TableCell>
                  <TableCell align="right">R²</TableCell>
                  <TableCell align="right">CMAPSS Score</TableCell>
                  <TableCell>Timestamp</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {models.map(model => (
                  <TableRow key={model.id}>
                    <TableCell>
                      <Chip label={model.model_type} color="primary" size="small" />
                    </TableCell>
                    <TableCell align="right">{model.evaluation_metrics?.rmse?.toFixed(2) || 'N/A'}</TableCell>
                    <TableCell align="right">{model.evaluation_metrics?.mae?.toFixed(2) || 'N/A'}</TableCell>
                    <TableCell align="right">{model.evaluation_metrics?.r2?.toFixed(4) || 'N/A'}</TableCell>
                    <TableCell align="right">{model.evaluation_metrics?.cmapss_score?.toFixed(2) || 'N/A'}</TableCell>
                    <TableCell>{new Date(model.training_timestamp).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {comparison.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Model Comparison</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metricsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="RMSE" fill="#8884d8" />
                    <Bar dataKey="MAE" fill="#82ca9d" />
                    <Bar dataKey="R²" fill="#ffc658" />
                    <Bar dataKey="CMAPSS Score" fill="#ff7300" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </Box>
  );
}