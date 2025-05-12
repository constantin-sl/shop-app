import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const theme = createTheme({
  palette: {
    primary: {
      main: '#7da7d9',
    },
    secondary: {
      main: '#a1cdff',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <SocketProvider>
      <AuthProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <App />
        </ThemeProvider>
      </AuthProvider>
    </SocketProvider>
  </React.StrictMode>
);