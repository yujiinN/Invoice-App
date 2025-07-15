import { useState, useEffect } from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Grid,
  Divider,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from "@mui/material";
import { getInvoiceDetails, recordPayment } from "../services/api";
import RecordPaymentModal from "../components/RecordPaymentModal";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PaymentIcon from "@mui/icons-material/Payment";

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const fetchInvoice = async () => {
    setLoading(true);
    try {
      const response = await getInvoiceDetails(id);
      setInvoice(response.data);
    } catch (err) {
      setError("Failed to load invoice details.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const handleRecordPayment = async (paymentData) => {
    try {
      await recordPayment(id, paymentData);
      setPaymentModalOpen(false);
      fetchInvoice(); // Refresh invoice data
    } catch (err) {
      console.error("Failed to record payment", err);
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!invoice) return <Typography>Invoice not found.</Typography>;

  const amountPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
  const balanceDue = invoice.total - amountPaid;

  return (
    <Box>
      <Button
        component={RouterLink}
        to="/invoices"
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 2 }}
      >
        Back to Invoices
      </Button>
      <Paper sx={{ p: 4 }}>
        <Grid container justifyContent="space-between" alignItems="flex-start">
          <Grid item>
            <Typography variant="h4" gutterBottom>
              Invoice {invoice.invoiceNumber}
            </Typography>
            <Chip
              label={invoice.status}
              color={invoice.status === "PAID" ? "success" : "warning"}
            />
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              startIcon={<PaymentIcon />}
              onClick={() => setPaymentModalOpen(true)}
              disabled={balanceDue <= 0}
            >
              Record Payment
            </Button>
          </Grid>
        </Grid>
        <Divider sx={{ my: 3 }} />
        <Grid container spacing={4}>
          <Grid item xs={6}>
            <Typography variant="h6">Billed To</Typography>
            <Typography>{invoice.client.name}</Typography>
            <Typography color="text.secondary">
              {invoice.client.address}
            </Typography>
            <Typography color="text.secondary">
              {invoice.client.email}
            </Typography>
          </Grid>
          <Grid item xs={6} sx={{ textAlign: "right" }}>
            <Typography variant="h6">Details</Typography>
            <Typography>
              <strong>Issue Date:</strong>{" "}
              {new Date(invoice.issueDate).toLocaleDateString()}
            </Typography>
            <Typography>
              <strong>Due Date:</strong>{" "}
              {new Date(invoice.dueDate).toLocaleDateString()}
            </Typography>
          </Grid>
        </Grid>
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{ mt: 4, border: "1px solid", borderColor: "divider" }}
        >
          <Table>
            <TableHead sx={{ bgcolor: "grey.50" }}>
              <TableRow>
                <TableCell>Item Description</TableCell>
                <TableCell align="right">Qty</TableCell>
                <TableCell align="right">Unit Price</TableCell>
                <TableCell align="right">Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoice.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.itemName}</TableCell>
                  <TableCell align="right">{item.quantity}</TableCell>
                  <TableCell align="right">
                    ${item.unitPrice.toFixed(2)}
                  </TableCell>
                  <TableCell align="right">
                    ${(item.quantity * item.unitPrice).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Grid container sx={{ mt: 3 }}>
          <Grid item xs={6}>
            <Typography variant="h6">Payment History</Typography>
            {invoice.payments.length > 0 ? (
              invoice.payments.map((p) => (
                <Typography key={p.id} variant="body2" color="text.secondary">
                  {new Date(p.paymentDate).toLocaleDateString()} - $
                  {p.amount.toFixed(2)} via {p.method}
                </Typography>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                No payments recorded.
              </Typography>
            )}
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ width: "100%", maxWidth: 300, ml: "auto" }}>
              <Typography
                variant="body1"
                sx={{ display: "flex", justifyContent: "space-between" }}
              >
                <span>Subtotal:</span>
                <span>${invoice.total.toFixed(2)}</span>
              </Typography>
              <Typography
                variant="body1"
                sx={{ display: "flex", justifyContent: "space-between" }}
              >
                <span>Amount Paid:</span>
                <span>-${amountPaid.toFixed(2)}</span>
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Typography
                variant="h6"
                sx={{ display: "flex", justifyContent: "space-between" }}
              >
                <span>Balance Due:</span>
                <span>${balanceDue.toFixed(2)}</span>
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      <RecordPaymentModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onSubmit={handleRecordPayment}
        invoice={invoice}
      />
    </Box>
  );
}
