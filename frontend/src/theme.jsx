import { createTheme } from '@mui/material/styles';

export const getTheme = (mode) => createTheme({
    palette: {
        mode,
        primary: {
            main: mode === 'dark' ? '#90caf9' : '#1976d2',
        },
        secondary: {
            main: mode === 'dark' ? '#f48fb1' : '#dc004e',
        },
        background: {
            default: mode === 'dark' ? '#121212' : '#f5f5f5',
            paper: mode === 'dark' ? '#1e1e1e' : '#ffffff',
        },
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    },
    shape: {
        borderRadius: 12,
    },
    components: {
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    boxShadow: mode === 'dark'
                        ? '0 4px 20px rgba(0,0,0,0.5)'
                        : '0 4px 20px rgba(0,0,0,0.05)',
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 28,
                    textTransform: 'none',
                    fontWeight: 600,
                },
            },
        },
    }
});










