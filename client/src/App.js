import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';  // Импортируем Link
import LoginPage from './pages/LoginPage';
import ProductPage from './pages/ProductPage';
import SellerDashboard from './pages/SellerDashboard';
import { AuthContext } from './contexts/AuthContext';
import RegisterPage from './pages/RegisterPage';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  Toolbar,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import StoreIcon from '@mui/icons-material/Store';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LogoutIcon from '@mui/icons-material/Logout';
import CategoryIcon from '@mui/icons-material/Category';

const drawerWidth = 240;

function App() {
  const { user, logout } = useContext(AuthContext);

  return (
    <Router>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <Toolbar>
            <IconButton edge="start" color="inherit" aria-label="menu" sx={{ mr: 2 }}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
              Магазин одежды
            </Typography>
            {user && (
              <IconButton color="inherit" onClick={logout}>
                <LogoutIcon />
              </IconButton>
            )}
          </Toolbar>
        </AppBar>

        <Drawer
          variant="permanent"
          open
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: {
              width: drawerWidth,
              boxSizing: 'border-box',
            },
          }}
        >
          <Toolbar />
          <Box sx={{ overflow: 'auto' }}>
            <List>
              <ListItem button component={Link} to="/">  {}
                <ListItemIcon>
                  <HomeIcon />
                </ListItemIcon>
                <ListItemText primary="Главная" />
              </ListItem>

              {user?.type === 'customer' && (
                <ListItem button component={Link} to="/">
                  <ListItemIcon>
                    <StoreIcon />
                  </ListItemIcon>
                  <ListItemText primary="Все товары" />
                </ListItem>
              )}

              {user?.type === 'seller' && (
                <ListItem button component={Link} to="/seller">
                  <ListItemIcon>
                    <DashboardIcon />
                  </ListItemIcon>
                  <ListItemText primary="Панель продавца" />
                </ListItem>
              )}

              <ListItem sx={{ pt: 3 }}>
                <ListItemText primary="Категории одежды" />
              </ListItem>

              {[
                { name: 'Рубашки', path: '/category/shirts' },
                { name: 'Футболки', path: '/category/tshirts' },
                { name: 'Брюки', path: '/category/pants' },
                { name: 'Куртки', path: '/category/jackets' },
                { name: 'Обувь', path: '/category/shoes' },
              ].map((item) => (
                <ListItem key={item.path} button component={Link} to={item.path}> {}
                  <ListItemIcon>
                    <CategoryIcon />
                  </ListItemIcon>
                  <ListItemText primary={item.name} />
                </ListItem>
              ))}
            </List>
			
			<ListItem button component={Link} to="/register">
			  <ListItemIcon>
				<StoreIcon />
			  </ListItemIcon>
			  <ListItemText primary="Регистрация" />
			</ListItem>
			
			
          </Box>
        </Drawer>

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            ml: { sm: 0 },
          }}
        >
          <Toolbar />
          <Routes>
            <Route path="/" element={<ProductPage />} />
            <Route path="/category/:category" element={<ProductPage />} />
            <Route path="/login" element={
				user ? <Navigate to="/" replace /> : <LoginPage />
			} />
            <Route
              path="/seller"
              element={
                user && user.type === 'seller' ? (
                  <SellerDashboard />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
			<Route path="/register" element={
				user ? <Navigate to="/" replace /> : <RegisterPage />
			} />
          </Routes>
        </Box>
      </Box>
    </Router>
  );
}

export default App;