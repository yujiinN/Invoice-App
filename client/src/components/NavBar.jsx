import { useState } from 'react';
import { useAuth } from '../context/AuthContext'; // <-- STEP 1: IMPORT useAuth
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  AppBar, Toolbar, Typography, Button, Box, IconButton, Drawer, List, ListItem, ListItemButton,
  ListItemText, useTheme, useMediaQuery, Avatar, Menu, MenuItem, Divider, Badge
} from '@mui/material';
import {
  Menu as MenuIcon, Dashboard, Receipt, People, Notifications, Settings, Logout, Close as CloseIcon
} from '@mui/icons-material';

export default function NavBar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  
  const { logout } = useAuth(); // <-- STEP 2: GET THE LOGOUT FUNCTION

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleProfileMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleProfileMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    handleProfileMenuClose();
    logout();
  };

  const navItems = [
    { text: 'Dashboard', path: '/', icon: <Dashboard /> },
    { text: 'Invoices', path: '/invoices', icon: <Receipt /> },
    { text: 'Clients', path: '/clients', icon: <People /> },
  ];

  const isActiveRoute = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const MobileDrawer = (
    <Box sx={{ width: 280, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Receipt sx={{ fontSize: 28, color: 'primary.main' }} />
          <Typography variant="h6" fontWeight="bold">InvoiceApp</Typography>
        </Box>
        <IconButton onClick={handleDrawerToggle} size="small"><CloseIcon /></IconButton>
      </Box>
      <List sx={{ flex: 1, pt: 0 }}>
        {navItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ px: 2, mb: 1 }}>
            <ListItemButton component={RouterLink} to={item.path} selected={isActiveRoute(item.path)} onClick={handleDrawerToggle} sx={{ borderRadius: 2, py: 1.5 }}>
              <Box sx={{ mr: 2, display: 'flex', color: isActiveRoute(item.path) ? 'primary.main' : 'inherit' }}>{item.icon}</Box>
              <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: isActiveRoute(item.path) ? 600 : 500 }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary" align="center" display="block">© 2024 InvoiceApp</Typography>
      </Box>
    </Box>
  );

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          color: 'text.primary',
          borderBottom: 1,
          borderColor: 'divider',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 64, sm: 70 }, px: { xs: 2, sm: 3 } }}>
          {isMobile && <IconButton color="inherit" aria-label="open drawer" edge="start" onClick={handleDrawerToggle} sx={{ mr: 1 }}><MenuIcon /></IconButton>}
          
          <Typography variant="h5" component={RouterLink} to="/" sx={{ textDecoration: 'none', color: 'primary.main', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Receipt sx={{ fontSize: 30 }} />
            {!isMobile && "InvoiceApp"}
          </Typography>
          
          <Box sx={{ flexGrow: 1 }} /> {/* This spacer pushes content to the sides */}

          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {navItems.map((item) => (
                <Button key={item.text} component={RouterLink} to={item.path} startIcon={item.icon} variant={isActiveRoute(item.path) ? "contained" : "text"}>
                  {item.text}
                </Button>
              ))}
            </Box>
          )}

          <Box sx={{ flexGrow: 1 }} /> {/* This spacer pushes content to the sides */}

          {/* --- STEP 3: ADD BACK THE PROFILE & NOTIFICATION ICONS --- */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={handleProfileMenuOpen} size="small">
              <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.light' }} />
            </IconButton>
          </Box>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
            PaperProps={{ elevation: 2, sx: { mt: 1, minWidth: 180 } }}
          >
            <MenuItem onClick={handleProfileMenuClose}>
              <Settings sx={{ mr: 1.5 }} fontSize="small" /> Settings
            </MenuItem>
            <Divider />
            {/* --- STEP 4: IMPLEMENT LOGOUT --- */}
            <MenuItem onClick={handleLogout}>
              <Logout sx={{ mr: 1.5 }} fontSize="small" /> Logout
            </MenuItem>
          </Menu>

        </Toolbar>
      </AppBar>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 280, borderRight: 'none' },
        }}
      >
        {MobileDrawer}
      </Drawer>
    </>
  );
}