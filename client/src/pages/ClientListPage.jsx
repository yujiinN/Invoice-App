import { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Button,
  Modal,
  TextField,
  Stack,
  Paper,
  Alert,
  CircularProgress,
  Fade,
  IconButton,
  InputAdornment,
  Snackbar,
  Avatar,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { getClients, createClient, updateClient, deleteClient, importClients } from "../services/api";
import {
  PersonAdd as PersonAddIcon,
  UploadFile as UploadFileIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  People,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { xs: "90%", sm: 500 },
  bgcolor: "background.paper",
  borderRadius: 3,
  boxShadow: 24,
  p: 0,
  maxHeight: "90vh",
  overflow: "hidden",
  display: 'flex',
  flexDirection: 'column',
};

export default function ClientListPage() {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formState, setFormState] = useState({ name: "", email: "", address: "" });
  const [formError, setFormError] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const fileInputRef = useRef(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchClients = async () => {
    setLoading(true);
    try {
      const response = await getClients();
      setClients(response.data);
      setFilteredClients(response.data);
    } catch (error) {
      console.error("Failed to fetch clients:", error);
      setSnackbar({ open: true, message: 'Failed to fetch clients.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    const filtered = clients.filter(
      (client) =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.address.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredClients(filtered);
  }, [searchTerm, clients]);

  const handleOpenCreateModal = () => {
    setEditingClient(null);
    setFormState({ name: "", email: "", address: "" });
    setModalOpen(true);
  };

  const handleOpenEditModal = (client) => {
    setEditingClient(client);
    setFormState({ name: client.name, email: client.email, address: client.address });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingClient(null);
    setFormState({ name: "", email: "", address: "" });
    setFormError("");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormState((prevState) => ({ ...prevState, [name]: value }));
    if (formError) setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError("");

    if (!formState.name.trim() || !formState.email.trim() || !formState.address.trim()) {
      setFormError("All fields are required.");
      setFormSubmitting(false);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formState.email)) {
      setFormError("Please enter a valid email address.");
      setFormSubmitting(false);
      return;
    }

    try {
      let message = '';
      if (editingClient) {
        await updateClient(editingClient.id, formState);
        message = 'Client updated successfully!';
      } else {
        await createClient(formState);
        message = 'Client created successfully!';
      }
      handleCloseModal();
      fetchClients();
      setSnackbar({ open: true, message, severity: 'success' });
    } catch (error) {
      setFormError("Operation failed. The email might already be in use.");
      console.error("Failed to save client:", error);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteClient = async (clientId) => {
    if (window.confirm("Are you sure you want to delete this client? This will also delete all associated invoices and cannot be undone.")) {
        setLoading(true);
        try {
            await deleteClient(clientId);
            setSnackbar({ open: true, message: 'Client deleted successfully.', severity: 'success' });
            fetchClients();
        } catch(error) {
            setSnackbar({ open: true, message: 'Failed to delete client.', severity: 'error' });
            console.error(error);
            setLoading(false);
        }
    }
  };

  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
        const response = await importClients(formData);
        setSnackbar({ open: true, message: response.data.message, severity: 'success' });
        fetchClients();
    } catch (err) {
        const errorData = err.response?.data;
        const message = errorData?.detail?.message || 'An error occurred during import.';
        const details = errorData?.detail?.errors ? ` Details: ${errorData.detail.errors.join(', ')}` : '';
        setSnackbar({ open: true, message: message + details, severity: 'error' });
        console.error(err);
    } finally {
        setLoading(false);
        if(fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar({ ...snackbar, open: false });
  };

  const columns = [
    {
      field: "name",
      headerName: "Client Name",
      minWidth: 200,
      flex: 2,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light', color: 'primary.dark', fontSize: '0.875rem' }}>
            {params.value.charAt(0).toUpperCase()}
          </Avatar>
          <Typography variant="body2" fontWeight="medium">{params.value}</Typography>
        </Box>
      ),
    },
    { field: "email", headerName: "Email Address", minWidth: 250, flex: 2 },
    { field: "address", headerName: "Address", minWidth: 300, flex: 3 },
    {
      field: 'actions',
      headerName: 'Actions',
      sortable: false,
      width: 100,
      align: 'right',
      renderCell: (params) => (
        <Box>
            <IconButton size="small" onClick={() => handleOpenEditModal(params.row)}>
                <EditIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" color="error" onClick={() => handleDeleteClient(params.row.id)}>
                <DeleteIcon fontSize="small" />
            </IconButton>
        </Box>
      )
    }
  ];

  return (
    <Box>
      <input type="file" ref={fileInputRef} hidden accept=".csv" onChange={handleFileSelect} />

      <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "stretch", sm: "center" }, gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold">Clients</Typography>
          <Typography variant="body2" color="text.secondary">Manage your client information and contacts</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" onClick={handleImportClick} startIcon={<UploadFileIcon />}>Import</Button>
          <Button variant="contained" onClick={handleOpenCreateModal} startIcon={<PersonAddIcon />}>Add Client</Button>
        </Box>
      </Box>

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search clients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>), }}
          sx={{ maxWidth: 400 }}
        />
      </Box>

      <Paper elevation={0} sx={{ height: 650, width: "100%", border: 1, borderColor: "divider" }}>
        <DataGrid
          rows={filteredClients}
          columns={columns}
          loading={loading}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          sx={{ border: "none" }}
          slots={{
            noRowsOverlay: () => (
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "text.secondary", gap: 1 }}>
                <People sx={{ fontSize: 48, opacity: 0.5 }} />
                <Typography variant="h6">No clients found</Typography>
                <Typography variant="body2">{searchTerm ? "Try adjusting your search terms" : "Add your first client to get started"}</Typography>
              </Box>
            ),
          }}
        />
      </Paper>

      <Modal open={modalOpen} onClose={handleCloseModal} closeAfterTransition>
        <Fade in={modalOpen}>
          <Box sx={modalStyle}>
            <Box sx={{ p: 3, borderBottom: 1, borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography variant="h6" component="h2" fontWeight="bold">{editingClient ? 'Edit Client' : 'Add New Client'}</Typography>
              <IconButton onClick={handleCloseModal} size="small"><CloseIcon /></IconButton>
            </Box>
            <Box sx={{ p: 3, overflowY: 'auto' }}>
              <Box component="form" onSubmit={handleSubmit} noValidate>
                <Stack spacing={3}>
                  <TextField required fullWidth label="Full Name" name="name" value={formState.name} onChange={handleInputChange} disabled={formSubmitting} error={!!formError && !formState.name.trim()} />
                  <TextField required fullWidth type="email" label="Email Address" name="email" value={formState.email} onChange={handleInputChange} disabled={formSubmitting} error={!!formError && (!formState.email.trim() || formError.includes("email"))} />
                  <TextField required fullWidth label="Billing Address" name="address" value={formState.address} onChange={handleInputChange} disabled={formSubmitting} multiline rows={3} error={!!formError && !formState.address.trim()} />
                  {formError && <Alert severity="error">{formError}</Alert>}
                  <Box sx={{ display: "flex", gap: 2, pt: 1 }}>
                    <Button onClick={handleCloseModal} variant="outlined" fullWidth disabled={formSubmitting}>Cancel</Button>
                    <Box sx={{ position: "relative", width: "100%" }}>
                      <Button type="submit" fullWidth variant="contained" disabled={formSubmitting} sx={{ py: 1.5 }}>{formSubmitting ? "Saving..." : "Save Client"}</Button>
                      {formSubmitting && (<CircularProgress size={24} sx={{ position: "absolute", top: "50%", left: "50%", marginTop: "-12px", marginLeft: "-12px" }} />)}
                    </Box>
                  </Box>
                </Stack>
              </Box>
            </Box>
          </Box>
        </Fade>
      </Modal>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}