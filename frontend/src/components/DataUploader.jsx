import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box, Typography, Paper, Button, LinearProgress, Alert, Grid, Card, CardContent
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { uploadFiles } from '../services/api';

const FileDropzone = ({ label, onFileSelect, selectedFile }) => {
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) onFileSelect(acceptedFiles[0]);
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, maxFiles: 1 });

  return (
    <Paper
      {...getRootProps()}
      sx={{
        p: 3,
        textAlign: 'center',
        cursor: 'pointer',
        bgcolor: isDragActive ? 'action.hover' : 'background.paper',
        border: '2px dashed',
        borderColor: selectedFile ? 'success.main' : 'divider',
        transition: 'all 0.2s',
        '&:hover': { borderColor: 'primary.main' }
      }}
    >
      <input {...getInputProps()} />
      {selectedFile ? (
        <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
          <CheckCircleIcon color="success" />
          <Typography>{selectedFile.name}</Typography>
        </Box>
      ) : (
        <>
          <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
          <Typography variant="body1">{label}</Typography>
          <Typography variant="caption" color="textSecondary">
            Drag & drop or click to browse
          </Typography>
        </>
      )}
    </Paper>
  );
};

export default function DataUpload() {
  const [trainFile, setTrainFile] = useState(null);
  const [testFile, setTestFile] = useState(null);
  const [rulFile, setRulFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);

  const handleUpload = async () => {
    if (!trainFile || !testFile || !rulFile) {
      setError('Please select all three files.');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const res = await uploadFiles(trainFile, testFile, rulFile);
      setUploadResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Data Upload
      </Typography>
      <Typography variant="body1" color="textSecondary" paragraph>
        Upload the NASA CMAPSS FD004 dataset files to begin.
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <FileDropzone label="Train file (train_FD004.txt)" onFileSelect={setTrainFile} selectedFile={trainFile} />
        </Grid>
        <Grid item xs={12} md={4}>
          <FileDropzone label="Test file (test_FD004.txt)" onFileSelect={setTestFile} selectedFile={testFile} />
        </Grid>
        <Grid item xs={12} md={4}>
          <FileDropzone label="RUL file (RUL_FD004.txt)" onFileSelect={setRulFile} selectedFile={rulFile} />
        </Grid>
      </Grid>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Button
        variant="contained"
        size="large"
        onClick={handleUpload}
        disabled={uploading || !trainFile || !testFile || !rulFile}
        sx={{ px: 4 }}
      >
        Upload and Validate
      </Button>

      {uploading && <LinearProgress sx={{ mt: 2 }} />}

      {uploadResult && (
        <Card sx={{ mt: 3, bgcolor: 'success.light', color: 'success.contrastText' }}>
          <CardContent>
            <Typography variant="h6">Upload Successful!</Typography>
            <Typography>Training engines: {uploadResult.train_engines}</Typography>
            <Typography>Training cycles: {uploadResult.train_cycles}</Typography>
            <Typography>Test engines: {uploadResult.test_engines}</Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}