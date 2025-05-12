import React, { useEffect, useState } from 'react';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../contexts/AuthContext';
import Cart from '../components/Cart';
import { useSocket } from '../contexts/SocketContext';
import { useParams } from 'react-router-dom';

export default function ProductPage() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [products, setProducts] = useState([]);
  const { category } = useParams();

  useEffect(() => {
    let url = 'http://localhost:5000/products';
    if (category) {
      url += `?category=${category}`;
    }

    fetch(url)
      .then((res) => res.json())
      .then(setProducts)
      .catch(console.error);

    socket.on('products_updated', setProducts);
    return () => {
      socket.off('products_updated', setProducts);
    };
  }, [socket, category]);

  const getCategoryTitle = (category) => {
    switch (category) {
      case 'shirts': return 'Рубашки';
      case 'tshirts': return 'Футболки';
      case 'pants': return 'Брюки';
      case 'jackets': return 'Куртки';
      case 'shoes': return 'Обувь';
      default: return 'Магазин одежды';
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>{getCategoryTitle(category)}</h1>
      </div>

      {user ? (
        <p style={{ fontSize: '1.25rem' }}>
          Добро пожаловать, {user.name}! Ваша примерочная: #{user.fittingRoom}
        </p>
      ) : (
        <p>Пожалуйста, <a href="/login">войдите</a>, чтобы совершать покупки</p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
        {products.length > 0 ? (
          products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))
        ) : (
          <p>Нет товаров в этой категории.</p>
        )}
      </div>

      {user && user.type === 'customer' && <Cart />}
    </div>
  );
}