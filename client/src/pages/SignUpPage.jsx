import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box, Button, TextField, Typography, Paper, Link } from '@mui/material';

export default function SignUpPage() {
    const { login } = useAuth();

    const handleSignUp = (e) => {
        e.preventDefault();
        login();
    };

    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
            <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 400, textAlign: 'center' }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Create an Account
                </Typography>
                <Box component="form" onSubmit={handleSignUp}>
                    <TextField margin="normal" required fullWidth label="Full Name" name="name" autoComplete="name" autoFocus />
                    <TextField margin="normal" required fullWidth label="Email Address" name="email" autoComplete="email" />
                    <TextField margin="normal" required fullWidth name="password" label="Password" type="password" autoComplete="new-password" />
                    <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
                        Sign Up
                    </Button>
                    <Typography variant="body2">
                        Already have an account?{' '}
                        <Link component={RouterLink} to="/login" variant="body2">
                            Sign In
                        </Link>
                    </Typography>
                </Box>
            </Paper>
        </Box>
    );
}