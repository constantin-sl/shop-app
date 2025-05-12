import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { TextField, Button, Container, Typography, Box } from '@mui/material';

export default function LoginPage() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [fittingRoom, setFittingRoom] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

const handleSubmit = (e) => {
  e.preventDefault();
  const isSeller = name === 'seller';
  let fittingRoomNumber = null;
  if (!isSeller && fittingRoom) {
    fittingRoomNumber = Number(fittingRoom);
    if (!Number.isInteger(fittingRoomNumber) || fittingRoomNumber < 1 || fittingRoomNumber > 5) {
      setError('Номер кабинки должен быть от 1 до 5');
      return;
    }
  }
  const credentials = {
    name,
    password,
  };
  if (!isSeller) {
    credentials.fittingRoom = fittingRoomNumber;
  }
  socket.emit('user_login', credentials);
  socket.once('login_success', (user) => {
    login(user);
    navigate('/');
  });
  socket.once('login_error', (message) => {
    setError(message);
  });
};


  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 8 }}>
        <Typography variant="h4" gutterBottom>Вход</Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Имя пользователя"
            value={name}
            onChange={(e) => setName(e.target.value)}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Пароль"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Номер кабинки"
            value={fittingRoom}
            onChange={(e) => setFittingRoom(e.target.value)}
            margin="normal"
          />
          {error && <Typography color="error">{error}</Typography>}
          <Button
            fullWidth
            type="submit"
            variant="contained"
            sx={{ mt: 3 }}
          >
            Войти
          </Button>
        </form>
      </Box>
    </Container>
  );
}
