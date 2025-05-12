import React, { useEffect, useState } from 'react';
import { useSocket } from '../contexts/SocketContext';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  Button,
  CircularProgress,
  Box
} from '@mui/material';

const MAX_FITTING_ROOMS = 5;

export default function SellerDashboard() {
  const { socket } = useSocket();
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [tryOnRequests, setTryOnRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let loadingTimeout = null;

    const fetchData = (data) => {
      if (!isMounted) return;
      setUsers(data.users.filter(u => u.type === 'customer'));
      setProducts(data.products);
      setTryOnRequests(data.tryOnRequests || []);
      setLoading(false);
    };

    // Подписка на события
    socket.on('initial_data', fetchData);
    socket.on('user_connected', (allUsers) => {
      setUsers(allUsers.filter(u => u.type === 'customer'));
    });
    socket.on('products_updated', setProducts);
    socket.on('try_on_requests_updated', setTryOnRequests);

    // Запрашиваем начальные данные
    socket.emit('request_initial_data');

    // Таймер для предотвращения вечной загрузки
    loadingTimeout = setTimeout(() => {
      if (isMounted && loading) {
        console.warn('Время ожидания данных истекло');
        setLoading(false);
      }
    }, 5000); // 5 секунд

    return () => {
      isMounted = false;
      clearTimeout(loadingTimeout);
      socket.off('initial_data', fetchData);
      socket.off('user_connected');
      socket.off('products_updated');
      socket.off('try_on_requests_updated');
    };
  }, [socket]);

  if (loading) {
    return (
      <Paper sx={{ p: 3, mt: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography>Загрузка данных...</Typography>
      </Paper>
    );
  }

  const fittingRooms = [];
  for (let i = 1; i <= MAX_FITTING_ROOMS; i++) {
    const userInRoom = users.find(u => u.fittingRoom === i);
    fittingRooms.push(userInRoom || null);
  }

  const handleClearRequest = (userId) => {
    socket.emit('clear_try_on_request', { userId });
  };

  return (
    <Paper sx={{ p: 3, mt: 3 }}>
      <Typography variant="h5" gutterBottom>Панель продавца</Typography>

      <Typography variant="h6" sx={{ mt: 2 }}>Примерочные</Typography>
      <Grid container spacing={2}>
        {fittingRooms.map((user, idx) => {
          const roomNumber = idx + 1;
          if (!user) {
            return (
              <Grid item xs={12} sm={6} md={4} key={roomNumber}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">Примерочная #{roomNumber}</Typography>
                    <Typography color="text.secondary">Свободна</Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          }

          const counts = {};
          (user.cart || []).forEach(id => {
            counts[id] = (counts[id] || 0) + 1;
          });

          const total = Object.entries(counts).reduce((sum, [id, count]) => {
            const product = products.find(p => p.id === Number(id));
            return sum + (product ? product.price * count : 0);
          }, 0);

          return (
            <Grid item xs={12} sm={6} md={4} key={user.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6">Примерочная #{user.fittingRoom}</Typography>
                  <Typography color="text.secondary">{user.name}</Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    <strong>Корзина:</strong>
                    {Object.keys(counts).length === 0 ? (
                      ' пуста'
                    ) : (
                      Object.entries(counts).map(([id, count]) => {
                        const product = products.find(p => p.id === Number(id));
                        const price = product ? product.price : 0;
                        const itemTotal = price * count;
                        return (
                          <Typography key={id} variant="body2" component="div" sx={{ display: 'block' }}>
                            {product ? `${product.name} — ${count}шт × ${price} ₽ = ${itemTotal} ₽` : `Товар #${id} — ${count}шт`}
                          </Typography>
                        );
                      })
                    )}
                  </Typography>
                  <Typography variant="body2" color="primary" sx={{ fontWeight: 'bold', mt: 1 }}>
                    Итого: {total} ₽
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Typography variant="h6" sx={{ mt: 4 }}>Запросы "Принести на примерку"</Typography>
      {tryOnRequests.length === 0 ? (
        <Typography>Нет активных запросов</Typography>
      ) : (
        <Grid container spacing={2}>
          {tryOnRequests.map(({ userId, userName, fittingRoom }) => (
            <Grid item xs={12} sm={6} md={4} key={userId}>
              <Paper sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box display="flex" gap={2}>
                  <Typography>
                    {userName} (Примерочная #{fittingRoom}) просит "Принести на примерку"
                  </Typography>
                  <Button variant="contained" color="primary" size="small" onClick={() => handleClearRequest(userId)}>
                    Выполнено
                  </Button>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Paper>
  );
}