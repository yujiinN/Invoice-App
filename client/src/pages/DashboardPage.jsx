import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Paper,
} from "@mui/material";
import { getDashboardMetrics } from "../services/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  AttachMoney,
  Receipt,
  HourglassEmpty,
  Warning,
} from "@mui/icons-material";
import AIQueryBox from "../components/AIQueryBox";

// A reusable component for our metric cards
const StatCard = ({ title, value, icon, color }) => (
  <Card elevation={0} sx={{ border: 1, borderColor: "divider" }}>
    <CardContent>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Box sx={{ color: color }}>{icon}</Box>
        <Box>
          <Typography variant="h6" fontWeight="bold">
            {value}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {title}
          </Typography>
        </Box>
      </Box>
    </CardContent>
  </Card>
);

export default function DashboardPage() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await getDashboardMetrics();
        setMetrics(response.data);
      } catch (err) {
        setError("Failed to load dashboard metrics.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  const chartData = [
    {
      name: "Invoices",
      Total: metrics.totalInvoices,
      Overdue: metrics.overdueCount,
    },
  ];

  return (
    <Box>
      <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
        Dashboard
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Revenue"
            value={`$${metrics.totalRevenue.toFixed(2)}`}
            icon={<AttachMoney />}
            color="success.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Outstanding"
            value={`$${metrics.totalOutstanding.toFixed(2)}`}
            icon={<HourglassEmpty />}
            color="warning.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Invoices"
            value={metrics.totalInvoices}
            icon={<Receipt />}
            color="primary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Overdue"
            value={metrics.overdueCount}
            icon={<Warning />}
            color="error.main"
          />
        </Grid>
      </Grid>

      <Typography variant="h5" component="h2" fontWeight="bold" gutterBottom>
        Invoice Overview
      </Typography>
      <Paper
        elevation={0}
        sx={{ p: 2, border: 1, borderColor: "divider", height: 400 }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Total" fill="#1976d2" />
            <Bar dataKey="Overdue" fill="#d32f2f" />
          </BarChart>
        </ResponsiveContainer>
      </Paper>
      <AIQueryBox />
    </Box>
  );
}
