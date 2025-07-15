import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Chip,
  Button,
  Paper,
  Alert,
  TextField,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  Link,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { getInvoices, updateInvoiceStatus } from "../services/api";
import { Link as RouterLink } from "react-router-dom";
import {
  AddCircleOutline as AddCircleOutlineIcon,
  CheckCircle as CheckCircleIcon,
  Search as SearchIcon,
  Receipt,
  Schedule,
  AttachMoney,
  MoreVert as MoreVertIcon,
  PictureAsPdf as PictureAsPdfIcon,
} from "@mui/icons-material";
import EmailModal from "../components/EmailModal";
import EmailIcon from "@mui/icons-material/Email";
import DownloadIcon from '@mui/icons-material/Download';

export default function InvoiceListPage() {
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const openMenu = Boolean(anchorEl);
  const [emailModalOpen, setEmailModalOpen] = useState(false);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const response = await getInvoices();
      // The backend now dynamically calculates the OVERDUE status
      setInvoices(response.data);
      setFilteredInvoices(response.data);
    } catch (err) {
      setError("Failed to fetch invoices. Please try again later.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    let filtered = invoices;
    if (searchTerm) {
      filtered = filtered.filter(
        (invoice) =>
          invoice.client.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((invoice) => invoice.status === statusFilter);
    }
    setFilteredInvoices(filtered);
  }, [searchTerm, statusFilter, invoices]);

  const handleMarkAsPaid = async (id) => {
    try {
      await updateInvoiceStatus(id, "PAID");
      fetchInvoices();
    } catch (err) {
      console.error("Failed to mark as paid:", err);
    }
  };

  const handleDownloadPdf = (invoiceId) => {
    // We open the URL in a new tab. The browser handles the download.
    window.open(
      `http://localhost:8000/api/invoices/${invoiceId}/pdf`,
      "_blank"
    );
  };

  const handleMenuOpen = (event, invoice) => {
    setAnchorEl(event.currentTarget);
    setSelectedInvoice(invoice);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedInvoice(null);
  };

  const handleOpenEmailModal = () => {
    handleMenuClose(); // Close the little action menu
    setEmailModalOpen(true);
  };

  const handleCloseEmailModal = () => {
    setEmailModalOpen(false);
  };

  const totalRevenue = invoices
    .filter((inv) => inv.status === "PAID")
    .reduce((sum, inv) => sum + inv.total, 0);

  const summaryCards = [
    {
      title: "Total Revenue",
      value: `$${totalRevenue.toFixed(2)}`,
      icon: <AttachMoney />,
      color: "success.main",
    },
    {
      title: "Total Invoices",
      value: invoices.length.toString(),
      icon: <Receipt />,
      color: "primary.main",
    },
    {
      title: "Paid Invoices",
      value: invoices.filter((inv) => inv.status === "PAID").length.toString(),
      icon: <CheckCircleIcon />,
      color: "success.main",
    },
    {
      title: "Overdue",
      value: invoices
        .filter((inv) => inv.status === "OVERDUE")
        .length.toString(),
      icon: <Schedule />,
      color: "error.main",
    },
  ];

  const columns = [
    {
      field: "invoiceNumber",
      headerName: "Invoice #",
      minWidth: 150,
      flex: 1,
      renderCell: (params) => (
        <Link
          component={RouterLink}
          to={`/invoices/${params.row.id}`}
          underline="hover"
        >
          <Typography variant="body2" fontWeight="medium">
            {params.value}
          </Typography>
        </Link>
      ),
    },
    {
      field: "client",
      headerName: "Client",
      minWidth: 200,
      flex: 2,
      valueGetter: (value, row) => row.client.name,
    },
    {
      field: "status",
      headerName: "Status",
      minWidth: 120,
      flex: 1,
      renderCell: (params) => {
        const status = params.value;
        let color;
        if (status === "PAID") {
          color = "success";
        } else if (status === "UNPAID") {
          color = "warning";
        } else {
          color = "error";
        } // Handles 'OVERDUE'
        return (
          <Chip label={status} color={color} variant="outlined" size="small" />
        );
      },
    },
    {
      field: "dueDate",
      headerName: "Due Date",
      minWidth: 150,
      flex: 1,
      renderCell: (params) => {
        const isOverdue = params.row.status === "OVERDUE";
        return (
          <Typography
            variant="body2"
            color={isOverdue ? "error.main" : "text.primary"}
          >
            {new Date(params.value).toLocaleDateString()}
          </Typography>
        );
      },
    },
    {
      field: "total",
      headerName: "Amount",
      minWidth: 150,
      flex: 1,
      type: "number",
      renderCell: (params) => (
        <Typography fontWeight="medium">${params.value.toFixed(2)}</Typography>
      ),
    },
    {
      field: "actions",
      headerName: "",
      sortable: false,
      width: 60,
      align: "center",
      renderCell: (params) => (
        <IconButton size="small" onClick={(e) => handleMenuOpen(e, params.row)}>
          <MoreVertIcon />
        </IconButton>
      ),
    },
  ];

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1" fontWeight="bold">
          Invoices
        </Typography>
        <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            href="http://localhost:8000/api/export/invoices/csv"
            target="_blank" // Opens in a new tab to trigger download
        >
            Export CSV
        </Button>
        <Button
          variant="contained"
          component={RouterLink}
          to="/invoices/new"
          startIcon={<AddCircleOutlineIcon />}
        >
          Create Invoice
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {summaryCards.map((card) => (
          <Grid item xs={6} md={3} key={card.title}>
            <Card elevation={0} sx={{ border: 1, borderColor: "divider" }}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box sx={{ color: card.color }}>{card.icon}</Box>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {card.value}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {card.title}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper
        elevation={0}
        sx={{ p: 2, border: 1, borderColor: "divider", mb: 3 }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              placeholder="Search by client or invoice number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Box
              sx={{
                display: "flex",
                gap: 1,
                justifyContent: { xs: "flex-start", md: "flex-end" },
              }}
            >
              {["ALL", "PAID", "UNPAID", "OVERDUE"].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "contained" : "outlined"}
                  onClick={() => setStatusFilter(status)}
                  size="small"
                >
                  {status}
                </Button>
              ))}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper
        elevation={0}
        sx={{ height: 650, width: "100%", border: 1, borderColor: "divider" }}
      >
        <DataGrid
          rows={filteredInvoices}
          columns={columns}
          loading={loading}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
            sorting: { sortModel: [{ field: "dueDate", sort: "desc" }] },
          }}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          slots={{
            noRowsOverlay: () => (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  color: "text.secondary",
                  gap: 1,
                }}
              >
                <Receipt sx={{ fontSize: 48, opacity: 0.5 }} />
                <Typography variant="h6">No invoices found</Typography>
                <Typography variant="body2" align="center">
                  {searchTerm || statusFilter !== "ALL"
                    ? "Try adjusting your search or filters"
                    : "Create your first invoice to get started"}
                </Typography>
                {!searchTerm && statusFilter === "ALL" && (
                  <Button
                    component={RouterLink}
                    to="/invoices/new"
                    variant="contained"
                    startIcon={<AddCircleOutlineIcon />}
                    sx={{ mt: 2 }}
                  >
                    Create Invoice
                  </Button>
                )}
              </Box>
            ),
          }}
        />
      </Paper>

      <Menu anchorEl={anchorEl} open={openMenu} onClose={handleMenuClose}>
        {selectedInvoice?.status !== "PAID" && (
          <MenuItem
            onClick={() => {
              handleMarkAsPaid(selectedInvoice.id);
              handleMenuClose();
            }}
          >
            <ListItemIcon>
              <CheckCircleIcon fontSize="small" />
            </ListItemIcon>
            Mark as Paid
          </MenuItem>
        )}
        <MenuItem onClick={handleMenuClose}>View Details</MenuItem>
        {/* ADD THIS NEW MENU ITEM */}
        <MenuItem
          onClick={() => {
            handleDownloadPdf(selectedInvoice.id);
            handleMenuClose();
          }}
        >
          <ListItemIcon>
            <PictureAsPdfIcon fontSize="small" />
          </ListItemIcon>
          Download PDF
        </MenuItem>
        <MenuItem onClick={handleOpenEmailModal}>
          <ListItemIcon>
            <EmailIcon fontSize="small" />
          </ListItemIcon>
          Send Reminder
        </MenuItem>
      </Menu>
      <EmailModal
        open={emailModalOpen}
        onClose={handleCloseEmailModal}
        invoice={selectedInvoice}
      />
    </Box>
  );
}
