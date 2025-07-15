import { Routes, Route, Navigate } from "react-router-dom"
import { Box, CssBaseline, ThemeProvider, createTheme } from "@mui/material"
import NavBar from "./components/NavBar"
import DashboardPage from "./pages/DashboardPage"
import InvoiceListPage from "./pages/InvoiceListPage"
import InvoiceCreatePage from "./pages/InvoiceCreatePage"
import ClientListPage from "./pages/ClientListPage"
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import InvoiceDetailPage from './pages/InvoiceDetailPage'; 

// Enhanced theme with better colors and typography
const theme = createTheme({
  palette: {
    primary: {
      main: "#667eea",
      light: "#9bb5ff",
      dark: "#3f51b5",
    },
    secondary: {
      main: "#764ba2",
    },
    background: {
      default: "#f8fafc",
      paper: "#ffffff",
    },
    text: {
      primary: "#1a202c",
      secondary: "#718096",
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
})

function App() {
    const { isLoggedIn } = useAuth();

    if (!isLoggedIn) {
        return <LoginPage />;
    }
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
       {isLoggedIn && <NavBar />}

      <Box
        component="main"
        sx={{
          pt: { xs: 8, sm: 9 }, 
          px: 3, 
          pb: 3,
          minHeight: "100vh",
          bgcolor: "background.default",
          width: "100vw", 
          boxSizing: "border-box",
        }}
      >
         <Routes>
          {isLoggedIn ? (
            <>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/invoices" element={<InvoiceListPage />} />
              <Route path="/clients" element={<ClientListPage />} />
              <Route path="/invoices/new" element={<InvoiceCreatePage />} />
              <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
              <Route path="/login" element={<Navigate to="/" replace />} />
              <Route path="/signup" element={<SignUpPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
              <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
              
            </>
          ) : (
            <>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignUpPage />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </>
          )}
        </Routes>
      </Box>
    </ThemeProvider>
  )
}

export default App
