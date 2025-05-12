import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { List, ListItem, ListItemText, Button, Paper, Typography, Box } from '@mui/material';

export default function Cart() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [products, setProducts] = React.useState([]);
  const [tryOnRequested, setTryOnRequested] = React.useState(false);

  React.useEffect(() => {
    fetch('http://localhost:5000/products')
      .then(res => res.json())
      .then(setProducts)
      .catch(console.error);
  }, []);

  React.useEffect(() => {
    if (!user) return;
    const handleTryOnRequestsUpdated = (tryOnRequests) => {
      const found = tryOnRequests.some(r => r.userId === user.id);
      setTryOnRequested(found);
    };
    socket.on('try_on_requests_updated', handleTryOnRequestsUpdated);
    socket.emit('get_try_on_requests');
    return () => {
      socket.off('try_on_requests_updated', handleTryOnRequestsUpdated);
    };
  }, [socket, user]);

  if (!user || !user.cart || user.cart.length === 0) {
    return <Typography align="center">Ваша корзина пуста</Typography>;
  }

  const counts = {};
  user.cart.forEach(id => {
    counts[id] = (counts[id] || 0) + 1;
  });

  // Общая сумма
  const total = Object.entries(counts).reduce((sum, [id, count]) => {
    const product = products.find(p => p.id === Number(id));
    return sum + (product ? product.price * count : 0);
  }, 0);

  const handleRemove = (productId) => {
    const idx = user.cart.indexOf(productId);
    if (idx !== -1) {
      const newCart = [...user.cart];
      newCart.splice(idx, 1);
      socket.emit('update_cart', { userId: user.id, cart: newCart });
    }
  };

  const handleCheckout = () => {
    socket.emit('checkout', user.id);
  };

  const handleRequestTryOn = () => {
    if (user && user.id && !tryOnRequested) {
      socket.emit('request_try_on', { userId: user.id });
    }
  };

  return (
    <Paper sx={{ p: 2, mt: 3 }}>
      <Typography variant="h6">Корзина</Typography>
      <List>
        {Object.entries(counts).map(([id, count]) => {
          const product = products.find(p => p.id === Number(id));
          const price = product ? product.price : 0;
          const itemTotal = price * count;

          return (
            <ListItem key={id} divider>
              <ListItemText
                primary={`${product ? product.name : `Товар #${id}`} - ${count} шт.`}
                secondary={`Цена: ${price} ₽ | Сумма: ${itemTotal} ₽`}
              />
              <Button color="error" onClick={() => handleRemove(Number(id))}>Удалить</Button>
            </ListItem>
          );
        })}
      </List>

      <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
        <Typography variant="subtitle1"><strong>Итого:</strong> {total} ₽</Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleRequestTryOn}
            disabled={tryOnRequested}
          >
            {tryOnRequested ? 'Запрос отправлен' : 'Принести на примерку'}
          </Button>
          <Button variant="contained" color="primary" onClick={handleCheckout}>
            Оплатить
          </Button>
        </Box>
      </Box>
	  
    </Paper>
  );
}