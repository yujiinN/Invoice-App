import { useState } from 'react';
import { Box, Button, TextField, Typography, Modal, Stack, Alert } from '@mui/material';

const modalStyle = {
    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
    width: { xs: '90%', sm: 400 }, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 24, p: 4,
};

export default function RecordPaymentModal({ open, onClose, onSubmit, invoice }) {
    const [amount, setAmount] = useState('');
    const [error, setError] = useState('');

    const balanceDue = invoice ? invoice.total - invoice.payments.reduce((sum, p) => sum + p.amount, 0) : 0;

    const handleSubmit = (e) => {
        e.preventDefault();
        const paymentAmount = parseFloat(amount);
        if (!paymentAmount || paymentAmount <= 0) {
            setError('Please enter a valid positive amount.');
            return;
        }
        if (paymentAmount > balanceDue + 0.001) { // Add tolerance for float issues
            setError('Payment cannot exceed the balance due.');
            return;
        }
        onSubmit({ amount: paymentAmount, method: 'Card' });
        setAmount(''); // Reset form on submit
        setError('');
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={modalStyle}>
                <Typography variant="h6" mb={2}>Record Payment for {invoice?.invoiceNumber}</Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                    Balance Due: ${balanceDue.toFixed(2)}
                </Typography>
                <Box component="form" onSubmit={handleSubmit}>
                    <Stack spacing={2}>
                        <TextField
                            required autoFocus fullWidth type="number" label="Payment Amount" value={amount}
                            onChange={(e) => { setAmount(e.target.value); setError(''); }}
                            inputProps={{ min: 0.01, step: "0.01" }}
                        />
                        {error && <Alert severity="error">{error}</Alert>}
                        <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }}>Confirm Payment</Button>
                    </Stack>
                </Box>
            </Box>
        </Modal>
    );
}