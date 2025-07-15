import { useState } from 'react';
import { Box, Button, Typography, Modal, Stack, Alert, CircularProgress } from '@mui/material';
import { sendMockEmail } from '../services/api';

const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: { xs: '90%', sm: 500 },
    bgcolor: 'background.paper',
    borderRadius: 2,
    boxShadow: 24,
    p: 4,
};

export default function EmailModal({ open, onClose, invoice }) {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' }); // 'success' or 'error'

    // Reset status when the modal is closed or a new invoice is loaded
    if (open && status.message) {
      if(!loading) setStatus({ type: '', message: '' });
    }

    if (!invoice) return null;

    const emailData = {
        recipient_email: invoice.client.email,
        subject: `Reminder: Invoice ${invoice.invoiceNumber} is due`,
        body: `Dear ${invoice.client.name},\n\nThis is a friendly reminder that invoice ${invoice.invoiceNumber} for the amount of $${invoice.total.toFixed(2)} is due on ${new Date(invoice.dueDate).toLocaleDateString()}.\n\nPlease find the invoice attached.\n\nBest regards,\nYour Company`,
    };

    const handleSendEmail = async () => {
        setLoading(true);
        setStatus({ type: '', message: '' });
        try {
            await sendMockEmail(emailData);
            setStatus({ type: 'success', message: 'Email reminder sent successfully!' });
        } catch (err) {
            setStatus({ type: 'error', message: 'Failed to send email. Please try again.' });
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={modalStyle}>
                <Typography variant="h6" component="h2" mb={2}>
                    Send Invoice Reminder
                </Typography>

                <Stack spacing={2} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                    <Typography variant="body2"><strong>To:</strong> {emailData.recipient_email}</Typography>
                    <Typography variant="body2"><strong>Subject:</strong> {emailData.subject}</Typography>
                    <Box sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                        {emailData.body}
                    </Box>
                </Stack>

                <Box sx={{ mt: 3, textAlign: 'right' }}>
                    <Button onClick={onClose} sx={{ mr: 1 }} disabled={loading}>Cancel</Button>
                    <Button onClick={handleSendEmail} variant="contained" disabled={loading}>
                        {loading ? <CircularProgress size={24} /> : 'Send Email'}
                    </Button>
                </Box>
                
                {status.message && (
                    <Alert severity={status.type} sx={{ mt: 2 }}>
                        {status.message}
                    </Alert>
                )}
            </Box>
        </Modal>
    );
}