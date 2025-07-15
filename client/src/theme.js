import { createTheme } from '@mui/material/styles';

// Define a light and modern color palette
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // A professional blue
    },
    secondary: {
      main: '#dc004e', // A contrasting color for actions like delete
    },
    background: {
      default: '#f4f6f8', // A very light grey background
      paper: '#ffffff',   // White for cards and surfaces
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
  },
  components: {
    // Style overrides for a more modern feel
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8, // Slightly more rounded buttons
          textTransform: 'none', // Buttons with normal casing
        },
      },
    },
    MuiPaper: {
        styleOverrides: {
            root: {
                borderRadius: 12,
            }
        }
    },
    MuiDataGrid: {
        styleOverrides: {
            root: {
                border: 'none', // Remove the default border
            }
        }
    }
  },
});

export default theme;