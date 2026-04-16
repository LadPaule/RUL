import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Button, CircularProgress
} from '@mui/material';
import { getPredictions } from '../services/api';

export default function History() {
  const [predictions, setPredictions] = useState([]);
  const [filterEngine, setFilterEngine] = useState('');
  const [filterModel, setFilterModel] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchPredictions = (params = {}) => {
    setLoading(true);
    getPredictions(params)
      .then(res => setPredictions(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPredictions();
  }, []);

  const handleFilter = () => {
    const params = {};
    if (filterEngine) params.engine_id = filterEngine;
    if (filterModel) params.model_id = filterModel;
    fetchPredictions(params);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Prediction History
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          label="Engine ID"
          value={filterEngine}
          onChange={(e) => setFilterEngine(e.target.value)}
          size="small"
        />
        <TextField
          label="Model ID"
          value={filterModel}
          onChange={(e) => setFilterModel(e.target.value)}
          size="small"
        />
        <Button variant="outlined" onClick={handleFilter}>Filter</Button>
        <Button variant="text" onClick={() => { setFilterEngine(''); setFilterModel(''); fetchPredictions(); }}>
          Clear
        </Button>
      </Box>

      {loading ? (
        <CircularProgress />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Engine ID</TableCell>
                <TableCell>Model ID</TableCell>
                <TableCell align="right">Predicted RUL</TableCell>
                <TableCell align="right">True RUL</TableCell>
                <TableCell>Timestamp</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {predictions.map(pred => (
                <TableRow key={pred.id}>
                  <TableCell>{pred.id}</TableCell>
                  <TableCell>{pred.engine_id}</TableCell>
                  <TableCell>{pred.model_id}</TableCell>
                  <TableCell align="right">{pred.predicted_rul?.toFixed(2)}</TableCell>
                  <TableCell align="right">{pred.true_rul ? pred.true_rul.toFixed(2) : 'N/A'}</TableCell>
                  <TableCell>{new Date(pred.timestamp).toLocaleString()}</TableCell>
                </TableRow>
              ))}
              {predictions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">No predictions found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}