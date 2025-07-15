"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  Box,
  Button,
  Typography,
  TextField,
  Grid,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Divider,
  Card,
  Alert,
  Chip,
  InputAdornment,
} from "@mui/material"
import {
  AddCircleOutline as AddCircleOutlineIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Calculate as CalculateIcon,
} from "@mui/icons-material"
import { getClients, createInvoice } from "../services/api"

export default function InvoiceCreatePage() {
  const [clients, setClients] = useState([])
  const [selectedClient, setSelectedClient] = useState("")

  const today = new Date().toISOString().split("T")[0]
  const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  const [issueDate, setIssueDate] = useState(today)
  const [dueDate, setDueDate] = useState(nextMonth)

  const [items, setItems] = useState([{ itemName: "", quantity: 1, unitPrice: 0.0 }])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await getClients()
        setClients(response.data)
      } catch (error) {
        console.error("Failed to fetch clients:", error)
        setError("Could not load clients.")
      }
    }
    fetchClients()
  }, [])

  const handleItemChange = (index, event) => {
    const values = [...items]
    const value =
      event.target.name === "quantity" || event.target.name === "unitPrice"
        ? Number.parseFloat(event.target.value) || 0
        : event.target.value
    values[index][event.target.name] = value
    setItems(values)
  }

  const handleAddItem = () => {
    setItems([...items, { itemName: "", quantity: 1, unitPrice: 0.0 }])
  }

  const handleRemoveItem = (index) => {
    if (items.length > 1) {
      const values = [...items]
      values.splice(index, 1)
      setItems(values)
    }
  }

  const calculateItemTotal = (item) => {
    const quantity = Number.parseFloat(item.quantity) || 0
    const unitPrice = Number.parseFloat(item.unitPrice) || 0
    return (quantity * unitPrice).toFixed(2)
  }

  const calculateSubtotal = () => {
    return items.reduce((total, item) => {
      const quantity = Number.parseFloat(item.quantity) || 0
      const unitPrice = Number.parseFloat(item.unitPrice) || 0
      return total + quantity * unitPrice
    }, 0)
  }

  const calculateTax = () => {
    return calculateSubtotal() * 0.1 // 10% tax
  }

  const calculateTotal = () => {
    return (calculateSubtotal() + calculateTax()).toFixed(2)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (!selectedClient) {
      setError("Please select a client.")
      setLoading(false)
      return
    }

    if (items.some((item) => !item.itemName.trim())) {
      setError("Please fill in all item names.")
      setLoading(false)
      return
    }

    const invoiceData = {
      clientId: selectedClient,
      issueDate: new Date(issueDate).toISOString(),
      dueDate: new Date(dueDate).toISOString(),
      items: items.map((item) => ({
        itemName: item.itemName,
        quantity: Number.parseInt(item.quantity, 10),
        unitPrice: Number.parseFloat(item.unitPrice),
      })),
    }

    try {
      await createInvoice(invoiceData)
      navigate("/invoices")
    } catch (err) {
      console.error("Failed to create invoice:", err)
      setError("Failed to create invoice. Please check your inputs and try again.")
    } finally {
      setLoading(false)
    }
  }

  const selectedClientData = clients.find((client) => client.id === selectedClient)

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <IconButton onClick={() => navigate("/invoices")} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Create New Invoice
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Fill in the details below to generate a new invoice
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Main Form */}
        <Grid item xs={12} lg={8}>
          <Paper elevation={0} sx={{ p: 4, border: 1, borderColor: "divider" }}>
            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                {/* Client and Dates Section */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    Invoice Details
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required error={!!error && !selectedClient}>
                    <InputLabel id="client-select-label">Select Client</InputLabel>
                    <Select
                      labelId="client-select-label"
                      value={selectedClient}
                      label="Select Client"
                      onChange={(e) => setSelectedClient(e.target.value)}
                    >
                      {clients.map((client) => (
                        <MenuItem key={client.id} value={client.id}>
                          <Box>
                            <Typography variant="body1">{client.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {client.email}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={6} md={3}>
                  <TextField
                    fullWidth
                    required
                    type="date"
                    label="Issue Date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={6} md={3}>
                  <TextField
                    fullWidth
                    required
                    type="date"
                    label="Due Date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                {/* Items Section */}
                <Grid item xs={12}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                    <Typography variant="h6" fontWeight="bold">
                      Invoice Items
                    </Typography>
                    <Button
                      startIcon={<AddCircleOutlineIcon />}
                      onClick={handleAddItem}
                      variant="outlined"
                      size="small"
                    >
                      Add Item
                    </Button>
                  </Box>
                </Grid>

                {items.map((item, index) => (
                  <Grid item xs={12} key={index}>
                    <Card variant="outlined" sx={{ p: 2 }}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={5}>
                          <TextField
                            fullWidth
                            required
                            label="Item Description"
                            name="itemName"
                            value={item.itemName}
                            onChange={(e) => handleItemChange(index, e)}
                            placeholder="e.g., Web Development Services"
                          />
                        </Grid>
                        <Grid item xs={4} sm={2}>
                          <TextField
                            fullWidth
                            required
                            type="number"
                            label="Quantity"
                            name="quantity"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, e)}
                            inputProps={{ min: 1 }}
                          />
                        </Grid>
                        <Grid item xs={5} sm={3}>
                          <TextField
                            fullWidth
                            required
                            type="number"
                            label="Unit Price"
                            name="unitPrice"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(index, e)}
                            inputProps={{ min: 0, step: "0.01" }}
                            InputProps={{
                              startAdornment: <InputAdornment position="start">$</InputAdornment>,
                            }}
                          />
                        </Grid>
                        <Grid item xs={2} sm={1}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Typography variant="body2" fontWeight="bold">
                              ${calculateItemTotal(item)}
                            </Typography>
                            <IconButton
                              onClick={() => handleRemoveItem(index)}
                              color="error"
                              disabled={items.length === 1}
                              size="small"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </Grid>
                      </Grid>
                    </Card>
                  </Grid>
                ))}

                {error && (
                  <Grid item xs={12}>
                    <Alert severity="error" sx={{ borderRadius: 2 }}>
                      {error}
                    </Alert>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Box sx={{ display: "flex", gap: 2, pt: 2 }}>
                    <Button onClick={() => navigate("/invoices")} variant="outlined" disabled={loading}>
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={loading}
                      startIcon={<SaveIcon />}
                      sx={{ minWidth: 140 }}
                    >
                      {loading ? "Saving..." : "Save Invoice"}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>

        {/* Summary Sidebar */}
        <Grid item xs={12} lg={4}>
          <Box sx={{ position: "sticky", top: 24 }}>
            {/* Client Info */}
            {selectedClientData && (
              <Paper elevation={0} sx={{ p: 3, mb: 3, border: 1, borderColor: "divider" }}>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Bill To
                </Typography>
                <Box>
                  <Typography variant="body1" fontWeight="medium">
                    {selectedClientData.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedClientData.email}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {selectedClientData.address}
                  </Typography>
                </Box>
              </Paper>
            )}

            {/* Invoice Summary */}
            <Paper elevation={0} sx={{ p: 3, border: 1, borderColor: "divider" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <CalculateIcon color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  Invoice Summary
                </Typography>
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2">Subtotal:</Typography>
                  <Typography variant="body2" fontWeight="medium">
                    ${calculateSubtotal().toFixed(2)}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2">Tax (10%):</Typography>
                  <Typography variant="body2" fontWeight="medium">
                    ${calculateTax().toFixed(2)}
                  </Typography>
                </Box>

                <Divider />

                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="h6" fontWeight="bold">
                    Total:
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="primary.main">
                    ${calculateTotal()}
                  </Typography>
                </Box>

                <Chip
                  label={`${items.length} item${items.length !== 1 ? "s" : ""}`}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              </Box>
            </Paper>
          </Box>
        </Grid>
      </Grid>
    </Box>
  )
}

