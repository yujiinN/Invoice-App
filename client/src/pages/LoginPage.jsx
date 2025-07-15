import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box, Button, TextField, Typography, Paper, Link } from '@mui/material';

export default function LoginPage() {
    const { login } = useAuth();

    const handleLogin = (e) => {
        e.preventDefault();
        login();
    };

    return (
        <Box sx={{ }}>
            <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 400, textAlign: 'center' }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Sign In
                </Typography>
                <Box component="form" onSubmit={handleLogin}>
                    <TextField margin="normal" required fullWidth label="Email Address" name="email" autoComplete="email" />
                    <TextField margin="normal" required fullWidth name="password" label="Password" type="password" autoComplete="current-password"/>
                    <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
                        Sign In
                    </Button>
                    <Typography variant="body2">
                        Don't have an account?{' '}
                        <Link component={RouterLink} to="/signup" variant="body2">
                            Sign Up
                        </Link>
                    </Typography>
                </Box>
            </Paper>
        </Box>
    );
}