import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { Card, CardContent, CardMedia, Typography, Button, Grid } from '@mui/material';

export default function ProductCard({ product }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  let inCart = 0;

  if (user && user.cart) {
    inCart = user.cart.filter(id => Number(id) === Number(product.id)).length;
  }

  const isDisabled = inCart >= product.stock;

  const handleAddToCart = () => {
    if (user && user.type === 'customer' && !isDisabled) {
      const newCart = [...(user.cart || []), product.id];
      socket.emit('update_cart', { userId: user.id, cart: newCart });
    }
  };

  return (
    <Grid item xs={12} sm={6} md={4}>
      <Card sx={{ maxWidth: 345, margin: 'auto' }}>
        <CardMedia
          component="img"
          height="140"
          image={`/images/${product.image}`} // Correct path to the image
          alt={product.name}
        />
        <CardContent>
          <Typography gutterBottom variant="h5" component="div">
            {product.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Цена: {product.price} ₽
          </Typography>
          <Typography variant="body2" color="text.secondary">
            На складе: {product.stock}
          </Typography>
          {user?.type === 'customer' && (
            <Button
              fullWidth
              variant="contained"
              color="primary"
              disabled={isDisabled}
              onClick={handleAddToCart}
              sx={{ mt: 2 }}
            >
              {isDisabled ? 'Нет в наличии' : 'Добавить в корзину'}
            </Button>
          )}
        </CardContent>
      </Card>
    </Grid>
  );
}