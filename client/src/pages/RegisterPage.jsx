import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import { TextField, Button, Container, Typography, Box } from '@mui/material';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [fittingRoom, setFittingRoom] = useState('');
  const [error, setError] = useState('');
  const { socket } = useSocket();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    // Проверка номера примерочной
    let fittingRoomNumber = Number(fittingRoom);
    if (!Number.isInteger(fittingRoomNumber) || fittingRoomNumber < 1 || fittingRoomNumber > 5) {
      setError('Номер кабинки должен быть от 1 до 5');
      return;
    }

    // Отправляем запрос на регистрацию
    socket.emit('user_register', { name, password, fittingRoom: fittingRoomNumber });
    
    socket.once('register_success', (user) => {
      navigate('/login');
    });

    socket.once('register_error', (message) => {
      setError(message);
    });
  };

  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 8 }}>
        <Typography variant="h4" gutterBottom>Регистрация</Typography>
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
            label="Номер кабинки (1-5)"
            value={fittingRoom}
            onChange={(e) => setFittingRoom(e.target.value)}
            margin="normal"
            required
          />
          {error && <Typography color="error">{error}</Typography>}
          <Button
            fullWidth
            type="submit"
            variant="contained"
            sx={{ mt: 3 }}
          >
            Зарегистрироваться
          </Button>
        </form>
        <Box sx={{ mt: 2 }}>
          <Typography>
            Уже есть аккаунт? <a href="/login">Войдите</a>
          </Typography>
        </Box>
      </Box>
    </Container>
  );
}