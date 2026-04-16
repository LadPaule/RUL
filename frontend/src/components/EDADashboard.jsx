import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Tabs, Tab, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, CircularProgress, Alert,
  Grid, Card, CardContent, CardHeader, Divider, FormControl,
  InputLabel, Select, MenuItem
} from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line
} from 'recharts';
import { getStatistics, getVisualizations, getEngineTimeseries } from '../services/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

function StatisticsTab() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getStatistics()
      .then(res => { setStats(res.data); setLoading(false); })
      .catch(err => { setError('Failed to load statistics'); setLoading(false); });
  }, []);

  if (loading) return <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!stats) return null;

  const sensorNames = Object.keys(stats.mean).filter(k => k.includes('sensor') || k.includes('op'));

  return (
    <Card>
      <CardHeader title="Descriptive Statistics" />
      <Divider />
      <CardContent sx={{ p: 0 }}>
        <TableContainer sx={{ maxHeight: 500 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>Feature</strong></TableCell>
                <TableCell align="right"><strong>Mean</strong></TableCell>
                <TableCell align="right"><strong>Median</strong></TableCell>
                <TableCell align="right"><strong>Mode</strong></TableCell>
                <TableCell align="right"><strong>Std Dev</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sensorNames.map(feat => (
                <TableRow key={feat} hover>
                  <TableCell>{feat}</TableCell>
                  <TableCell align="right">{stats.mean[feat]?.toFixed(4)}</TableCell>
                  <TableCell align="right">{stats.median[feat]?.toFixed(4)}</TableCell>
                  <TableCell align="right">{stats.mode[feat]?.toFixed(4)}</TableCell>
                  <TableCell align="right">{stats.std[feat]?.toFixed(4)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}

//Todo: Visualizations Tab: Histogram + Line Chart + Boxplot Table
function VisualizationsTab() {
  const [visData, setVisData] = useState(null);
  const [tsData, setTsData] = useState(null);
  const [selectedSensor, setSelectedSensor] = useState('sensor_2');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      getVisualizations(),
      getEngineTimeseries(1)  // default engine 1 for line chart
    ])
      .then(([visRes, tsRes]) => {
        setVisData(visRes.data);
        setTsData(tsRes.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load visualization data');
        setLoading(false);
      });
  }, []);

  if (loading) return <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!visData || !tsData) return null;


  const availableSensors = Object.keys(visData.histograms).sort();


  const sensorHist = visData.histograms[selectedSensor] || [];
  const histBins = sensorHist.reduce((acc, val) => {
    const bin = Math.floor(val * 10) / 10;
    acc[bin] = (acc[bin] || 0) + 1;
    return acc;
  }, {});
  const histData = Object.entries(histBins)
    .map(([bin, count]) => ({ bin: parseFloat(bin), count }))
    .sort((a, b) => a.bin - b.in);


    
  const lineChartData = tsData.cycles.map((cycle, idx) => {
    const point = { cycle };
    Object.keys(tsData.sensors).forEach(sensor => {
      point[sensor] = tsData.sensors[sensor][idx];
    });
    return point;
  });


  const lineSensors = ['sensor_2', 'sensor_3', 'sensor_4'].filter(s => tsData.sensors.hasOwnProperty(s));

  //Todo: Boxplot stats for selected sensors
  const boxSensors = ['sensor_2', 'sensor_3', 'sensor_4', 'sensor_7', 'sensor_11', 'sensor_12'];
  const boxItems = boxSensors.filter(s => visData.boxplot_data[s]).map(sensor => ({
    sensor,
    ...visData.boxplot_data[sensor]
  }));

  return (
    <Grid container spacing={3}>
      {/* Histogram with Sensor Selector */}
      <Grid item xs={12} md={6}>
        <Card sx={{ height: '100%' }}>
          <CardHeader
            title={
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="h6">Histogram</Typography>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Sensor</InputLabel>
                  <Select
                    value={selectedSensor}
                    onChange={(e) => setSelectedSensor(e.target.value)}
                    label="Sensor"
                  >
                    {availableSensors.map(sensor => (
                      <MenuItem key={sensor} value={sensor}>{sensor}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            }
          />
          <Divider />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={histData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bin" label={{ value: 'Sensor Value', position: 'insideBottom', offset: -5 }} />
                <YAxis label={{ value: 'Frequency', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Distribution of {selectedSensor} values.
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Line Chart - Degradation Trends */}
      <Grid item xs={12} md={6}>
        <Card sx={{ height: '100%' }}>
          <CardHeader title={`Sensor Degradation Trends (Engine ${tsData.engine_id})`} />
          <Divider />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={lineChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="cycle" label={{ value: 'Time Cycles', position: 'insideBottom', offset: -5 }} />
                <YAxis label={{ value: 'Sensor Value', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                {lineSensors.map((sensor, index) => (
                  <Line
                    key={sensor}
                    type="monotone"
                    dataKey={sensor}
                    stroke={COLORS[index % COLORS.length]}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Showing {lineSensors.join(', ')} over cycles for engine {tsData.engine_id}.
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Boxplot Statistics Table */}
      <Grid item xs={12}>
        <Card>
          <CardHeader title="Boxplot Statistics (Selected Sensors)" />
          <Divider />
          <CardContent>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Sensor</TableCell>
                    <TableCell align="right">Min</TableCell>
                    <TableCell align="right">Q1</TableCell>
                    <TableCell align="right">Median</TableCell>
                    <TableCell align="right">Q3</TableCell>
                    <TableCell align="right">Max</TableCell>
                    <TableCell>Outliers</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {boxItems.map(item => (
                    <TableRow key={item.sensor} hover>
                      <TableCell>{item.sensor}</TableCell>
                      <TableCell align="right">{item.min.toFixed(4)}</TableCell>
                      <TableCell align="right">{item.q1.toFixed(4)}</TableCell>
                      <TableCell align="right">{item.median.toFixed(4)}</TableCell>
                      <TableCell align="right">{item.q3.toFixed(4)}</TableCell>
                      <TableCell align="right">{item.max.toFixed(4)}</TableCell>
                      <TableCell>{item.outliers.length > 0 ? `${item.outliers.length} outliers` : 'None'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              * Outliers are values beyond 1.5 × IQR from the quartiles.
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

//Todo: Correlation Tab 
function CorrelationTab() {
  const [topCorr, setTopCorr] = useState({ positive: [], negative: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getVisualizations()
      .then(res => {
        setTopCorr(res.data.top_correlations);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load correlation data');
        setLoading(false);
      });
  }, []);

  if (loading) return <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;

  const allCorrelations = [...(topCorr.positive || []), ...(topCorr.negative || [])];

  return (
    <Card>
      <CardHeader title="Top Features Correlated with RUL" />
      <Divider />
      <CardContent>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Feature</TableCell>
                <TableCell align="right">Correlation</TableCell>
                <TableCell>Direction</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {allCorrelations.map((item, idx) => (
                <TableRow key={idx} hover>
                  <TableCell>{item.feature}</TableCell>
                  <TableCell align="right">{item.correlation.toFixed(4)}</TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        display: 'inline-block',
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        bgcolor: item.correlation > 0 ? 'success.light' : 'error.light',
                        color: 'white',
                        fontSize: '0.75rem',
                        fontWeight: 'bold'
                      }}
                    >
                      {item.correlation > 0 ? 'Positive' : 'Negative'}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}

//Todo: Main EDA Dashboard Component
export default function EDADashboard() {
  const [subTab, setSubTab] = useState(0);

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Exploratory Data Analysis
      </Typography>
      <Tabs value={subTab} onChange={(e, v) => setSubTab(v)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Descriptive Statistics" />
        <Tab label="Visualizations" />
        <Tab label="Correlation Analysis" />
      </Tabs>
      <Box sx={{ mt: 2 }}>
        {subTab === 0 && <StatisticsTab />}
        {subTab === 1 && <VisualizationsTab />}
        {subTab === 2 && <CorrelationTab />}
      </Box>
    </Box>
  );
}





