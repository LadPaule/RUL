import React, { useState, useEffect } from 'react';
import {
  Box, Typography, FormControl, InputLabel, Select, MenuItem, Button,
  Card, CardContent, Grid, TextField, Alert, CircularProgress, Chip, Paper
} from '@mui/material';
import { useDropzone } from 'react-dropzone';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import GaugeChart from 'react-gauge-chart'; // optional, can use MUI Gauge
import { getModels, predictRUL } from '../services/api';

export default function Prediction() {
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [engineId, setEngineId] = useState(1);
  const [file, setFile] = useState(null);
  const [predicting, setPredicting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loadingModels, setLoadingModels] = useState(true);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (acceptedFiles) => setFile(acceptedFiles[0]),
    maxFiles: 1,
    accept: { 'text/csv': ['.csv'] }
  });

  useEffect(() => {
    getModels().then(res => {
      setModels(res.data);
      if (res.data.length > 0) setSelectedModel(res.data[0].id);
      setLoadingModels(false);
    }).catch(() => setLoadingModels(false));
  }, []);

  const handlePredict = async () => {
    if (!selectedModel || !file) {
      setError('Please select a model and upload a CSV file.');
      return;
    }
    setPredicting(true);
    setError(null);
    try {
      const res = await predictRUL(selectedModel, engineId, file);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Prediction failed.');
    } finally {
      setPredicting(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        RUL Prediction
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Input Configuration</Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Select Trained Model</InputLabel>
                <Select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  label="Select Trained Model"
                  disabled={loadingModels}
                >
                  {models.map(m => (
                    <MenuItem key={m.id} value={m.id}>
                      {m.model_type} (RMSE: {m.evaluation_metrics.rmse?.toFixed(2)})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Engine ID"
                type="number"
                value={engineId}
                onChange={(e) => setEngineId(parseInt(e.target.value) || 1)}
                sx={{ mb: 2 }}
              />

              <Paper
                {...getRootProps()}
                sx={{
                  p: 3,
                  textAlign: 'center',
                  cursor: 'pointer',
                  bgcolor: 'action.hover',
                  border: '2px dashed',
                  borderColor: file ? 'success.main' : 'divider',
                  mb: 2
                }}
              >
                <input {...getInputProps()} />
                <CloudUploadIcon sx={{ fontSize: 40, mb: 1 }} />
                <Typography>
                  {file ? file.name : 'Drop sensor data CSV or click to browse'}
                </Typography>
              </Paper>

              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={handlePredict}
                disabled={predicting || !file || !selectedModel}
              >
                {predicting ? <CircularProgress size={24} /> : 'Predict RUL'}
              </Button>

              {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          {result ? (
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <CardContent>
                <Typography variant="h6" align="center" gutterBottom>
                  Prediction Result
                </Typography>
                <Typography variant="h2" align="center" color="primary" sx={{ fontWeight: 'bold' }}>
                  {result.predicted_rul.toFixed(0)} cycles
                </Typography>
                <Typography align="center" color="textSecondary">
                  Engine ID: {result.engine_id} | Model: {result.model_used}
                </Typography>
                <Typography align="center" variant="caption" display="block" sx={{ mt: 2 }}>
                  Predicted at {new Date(result.timestamp).toLocaleString()}
                </Typography>
                {/* Optional Gauge Chart */}
              </CardContent>
            </Card>
          ) : (
            <Card sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CardContent>
                <Typography color="textSecondary" align="center">
                  Prediction will appear here
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}