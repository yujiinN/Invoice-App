import { useState } from 'react';
import { Box, Typography, TextField, Button, Paper, CircularProgress, Alert } from '@mui/material';
import ReactMarkdown from 'react-markdown'; // Import the markdown renderer
import { postAIQuery } from '../services/api';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

export default function AIQueryBox() {
    const [query, setQuery] = useState('');
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!query.trim()) return; // Don't submit empty queries

        setLoading(true);
        setError('');
        setResponse('');

        try {
            const res = await postAIQuery(query);
            setResponse(res.data.answer);
        } catch (err) {
            console.error(err);
            // Provide a user-friendly error from the backend if available
            setError(err.response?.data?.detail || "An unexpected error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Example queries for user guidance
    const exampleQueries = [
        "Which clients are at risk of churn?",
        "Suggest cross-sell opportunities for my clients.",
        "Who is most likely to buy 'Consulting Services'?",
    ];

    return (
        <Paper elevation={0} sx={{ p: 3, mt: 4, border: 1, borderColor: 'divider' }}>
            <Typography variant="h5" component="h2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <AutoAwesomeIcon color="primary" />
                AI Business Insights
            </Typography>
            <Box component="form" onSubmit={handleSubmit}>
                <TextField
                    fullWidth
                    label="Ask a question about your business data..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    variant="outlined"
                    placeholder="e.g., Which clients are at risk of churn?"
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                    <Button type="submit" variant="contained" disabled={loading || !query}>
                        {loading ? 'Analyzing...' : 'Ask AI'}
                    </Button>
                </Box>
            </Box>

            <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary">Try an example: </Typography>
                {exampleQueries.map((ex, i) => (
                    <Button key={i} size="small" variant="text" sx={{textTransform: 'none'}} onClick={() => setQuery(ex)}>
                        {ex}
                    </Button>
                ))}
            </Box>

            {loading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>}
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

            {response && (
                <Box sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1, '& h3': { my: 1 }, '& p': { my: 0.5 }, '& ul': { pl: 2.5 } }}>
                    <ReactMarkdown>{response}</ReactMarkdown>
                </Box>
            )}
        </Paper>
    );
}