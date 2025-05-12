const express = require('express');
const { Server } = require('socket.io');
const cors = require('cors');
const { products, users } = require('./data');

const app = express();
app.use(cors());
app.use(express.json());

// REST-эндпоинт для получения товаров с поддержкой фильтрации по категории
app.get('/products', (req, res) => {
  const { category } = req.query;
  if (category) {
    const filtered = products.filter(p => p.category === category);
    return res.json(filtered);
  }
  res.json(products);
});

const server = app.listen(5000, () => {
  console.log('Server running on port 5000');
});

const MAX_FITTING_ROOMS = 5;
const tryOnRequests = [];

// Массив для хранения онлайн-пользователей
const onlineUsers = [];
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Генерация следующего ID для новых пользователей
let nextUserId = Math.max(...users.map(u => u.id)) + 1; // Регистрация: генерация новых ID

io.on('connection', (socket) => {
  console.log('Новое подключение:', socket.id);

  const calculateCartTotal = (user) => {
    return (user.cart || []).reduce((total, productId) => {
      const product = products.find(p => p.id === Number(productId));
      return product ? total + product.price : total;
    }, 0);
  };

  const enrichUsersWithTotal = (usersList) => {
    return usersList.map(user => ({
      ...user,
      cartTotal: calculateCartTotal(user)
    }));
  };

  // При подключении отправляем начальные данные
  socket.emit('initial_data', {
    products,
    users: enrichUsersWithTotal(users),
    tryOnRequests
  });

  socket.emit('products_updated', products);

//---
socket.on("request_initial_data", () => {
  socket.emit("initial_data", {
    users: onlineUsers.map(user => ({
      ...user,
      cartTotal: calculateCartTotal(user)
    })),
    products,
    tryOnRequests
  });
});
//----


  // Регистрация: обработка события user_register
  socket.on('user_register', ({ name, password, fittingRoom }) => {
    const existingUser = users.find(u => u.name === name);
    if (existingUser) {
      return socket.emit('register_error', 'Пользователь с таким именем уже существует');
    }

    const occupant = onlineUsers.find(u => u.fittingRoom === fittingRoom);
    if (occupant) {
      return socket.emit('register_error', 'Кабинка занята');
    }

    const newUser = {
      id: nextUserId++,
      name,
      password,
      type: 'customer',
      fittingRoom,
      cart: []
    };

    users.push(newUser);

    // Вход автоматически после регистрации
    socket.emit('login_success', newUser);
    io.emit('user_connected', [...onlineUsers, newUser]);
    socket.userId = newUser.id;

    console.log('Новый пользователь зарегистрирован:', newUser);
  });

  // Авторизация
  socket.on('user_login', (credentials) => {
    const user = users.find(u =>
      u.name === credentials.name &&
      u.password === credentials.password
    );
    if (!user) {
      return socket.emit('login_error', 'Неверное имя пользователя или пароль');
    }

    let fittingRoom = null;
    if (user.type === 'customer') {
      fittingRoom = Number(credentials.fittingRoom);
      if (!fittingRoom || fittingRoom < 1 || fittingRoom > MAX_FITTING_ROOMS) {
        return socket.emit('login_error', 'Номер примерочной должен быть от 1 до 5');
      }

      const occupant = onlineUsers.find(u => u.fittingRoom === fittingRoom && u.id !== user.id);
      if (occupant) {
        return socket.emit('login_error', 'Кабинка занята');
      }
    }

    const existingIndex = onlineUsers.findIndex(u => u.id === user.id);
    const onlineUserData = { ...user, fittingRoom, socketId: socket.id };

    if (existingIndex !== -1) {
      onlineUsers[existingIndex] = onlineUserData;
    } else {
      onlineUsers.push(onlineUserData);
    }
    socket.userId = user.id;
    io.emit('user_connected', onlineUsers);
    socket.emit('login_success', onlineUserData);
  });

  // Обработка запроса на примерку
  socket.on('request_try_on', ({ userId }) => {
    const user = onlineUsers.find(u => u.id === userId);
    if (user) {
      const existing = tryOnRequests.find(r => r.userId === user.id);
      if (!existing) {
        tryOnRequests.push({
          userId: user.id,
          userName: user.name,
          fittingRoom: user.fittingRoom
        });
        io.emit('try_on_requests_updated', tryOnRequests);
      }
    }
  });

  // Очистка запроса на примерку
  socket.on('clear_try_on_request', ({ userId }) => {
    const idx = tryOnRequests.findIndex(r => r.userId === userId);
    if (idx !== -1) {
      tryOnRequests.splice(idx, 1);
      io.emit('try_on_requests_updated', tryOnRequests);
    }
  });

  // Обновление корзины
  socket.on('update_cart', ({ userId, cart }) => {
    const userIndex = onlineUsers.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      onlineUsers[userIndex].cart = cart;
      io.emit('cart_updated', { userId, cart });
      io.emit('user_connected', onlineUsers);
    }
  });

  // Покупка
  socket.on('checkout', (userId) => {
    const userIndex = onlineUsers.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      const user = onlineUsers[userIndex];
      const cart = user.cart || [];
      const counts = {};
      cart.forEach(id => {
        counts[id] = (counts[id] || 0) + 1;
      });

      let canCheckout = true;
      for (const id in counts) {
        const product = products.find(p => p.id === Number(id));
        if (product && product.stock < counts[id]) {
          canCheckout = false;
          break;
        }
      }

      if (canCheckout) {
        for (const id in counts) {
          const product = products.find(p => p.id === Number(id));
          if (product) {
            product.stock -= counts[id];
          }
        }
        onlineUsers[userIndex].cart = [];
        io.emit('cart_updated', { userId, cart: [] });
        io.emit('products_updated', products);
      }
    }
  });

  // Выход
  socket.on('user_logout', (userId) => {
    const idx = onlineUsers.findIndex(u => u.id === userId);
    if (idx !== -1) {
      onlineUsers.splice(idx, 1);
      io.emit('user_connected', onlineUsers);
    }
  });

  // Отключение
  socket.on('disconnect', () => {
    if (socket.userId) {
      const idx = onlineUsers.findIndex(u => u.id === socket.userId);
      if (idx !== -1) {
        onlineUsers.splice(idx, 1);
        io.emit('user_connected', onlineUsers);
      }
    }
  });
});