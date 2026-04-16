import React, { useState, useMemo } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppBar, Toolbar, Typography, Tabs, Tab, Box, Switch, FormControlLabel, Container } from '@mui/material';
import { getTheme } from './theme';
import DataUploader from './components/DataUploader';
import EDADashboard from './components/EDADashboard';
import ModelTraining from './components/ModelTraining';
import Prediction from './components/Prediction';
import History from './components/History';

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const theme = useMemo(() => getTheme(darkMode ? 'dark' : 'light'), [darkMode]);

  const handleTabChange = (event, newValue) => setTabValue(newValue);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static" color="primary" elevation={0} sx={{ borderRadius: 0 }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            ✈️ Aircraft Engine RUL Prediction
          </Typography>
          <FormControlLabel
            control={<Switch checked={darkMode} onChange={() => setDarkMode(!darkMode)} color="default" />}
            label={darkMode ? 'Dark' : 'Light'}
          />
        </Toolbar>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          centered
          textColor="inherit"
          indicatorColor="secondary"
          sx={{ '& .MuiTab-root': { fontWeight: 600 } }}
        >
          <Tab label="Data Upload" />
          <Tab label="EDA Dashboard" />
          <Tab label="Model Training" />
          <Tab label="Prediction" />
          <Tab label="History" />
        </Tabs>
      </AppBar>

      <Container maxWidth="xl">
        <TabPanel value={tabValue} index={0}>
          <DataUploader />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <EDADashboard />
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <ModelTraining />
        </TabPanel>
        <TabPanel value={tabValue} index={3}>
          <Prediction />
        </TabPanel>
        <TabPanel value={tabValue} index={4}>
          <History />
        </TabPanel>
      </Container>
    </ThemeProvider>
  );
}

export default App;