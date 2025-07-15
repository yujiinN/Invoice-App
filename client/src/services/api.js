import axios from 'axios';

const apiClient = axios.create({
    baseURL: 'http://localhost:8000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// --- Invoice Functions ---
export const getInvoices = () => {
    return apiClient.get('/invoices');
};

// --- Client Functions (ADD THESE) ---
export const getClients = () => {
    return apiClient.get('/clients');
};

export const createClient = (clientData) => {
    return apiClient.post('/clients', clientData);
};

export const createInvoice = (invoiceData) => {
    return apiClient.post('/invoices', invoiceData);
};

export const updateInvoiceStatus = (invoiceId, status) => {
    return apiClient.put(`/invoices/${invoiceId}/status`, { status });
};

export const getDashboardMetrics = () => {
    return apiClient.get('/metrics');
};

export const recordPayment = (invoiceId, paymentData) => {
    return apiClient.post(`/invoices/${invoiceId}/payments`, paymentData);
};

export const getInvoiceDetails = (invoiceId) => {
    return apiClient.get(`/invoices/${invoiceId}`);
};
export const sendMockEmail = (emailData) => {
    return apiClient.post('/mock-email/send', emailData);
};

export const postAIQuery = (query) => {
    return apiClient.post('/ai/query', { query });
};

export const importClients = (formData) => {
    return apiClient.post('/import/clients/csv', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

export const updateClient = (clientId, clientData) => {
    return apiClient.put(`/clients/${clientId}`, clientData);
};

export const deleteClient = (clientId) => {
    return apiClient.delete(`/clients/${clientId}`);
};