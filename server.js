const express = require('express');
const https = require('https');
const fs = require('fs');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cors = require('cors');

const app = express();
const port = 3000;

const options = {
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.crt')
};

app.use(cors());

const server = https.createServer(options, app);

// Socket.io setup
const io = new Server(server, {
    cors: {
        origin: ['http://127.0.0.1:5501', 'http://127.0.0.1:5502'],
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true
    }
});


// yes ik bad practice o kolesh bessa7 woulah ma t7arwit douka
mongoose.connect('mongodb+srv://admin:machipasswordtryagain@hollowd.otzcion.mongodb.net/?retryWrites=true&w=majority&appName=HollowD', { dbName: 'messageApp', connectTimeoutMS: 10000});

// User model
const User = mongoose.model('User', {
  username: String,
  password: String
});

// Message model
const Message = mongoose.model('Message', {
  from: String,
  to: String,
  content: String,
  timestamp: Date
});

app.use(express.json());
app.use(express.static('public'));

app.get('/users', async (req, res) => {
    const exclude = req.query.exclude;
    try {
        const users = await User.find({ username: { $ne: exclude } }, 'username');
        res.json(users);
    } catch (error) {
        res.status(500).send('Error fetching users');
    }
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).send('Username already exists');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();
    res.status(201).send('User registered');
  } catch (error) {
    res.status(500).send('Error registering user');
  }
});

// Login route
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (user && await bcrypt.compare(password, user.password)) {
      res.send('Login successful');
    } else {
      res.status(401).send('Invalid credentials');
    }
  } catch (error) {
    res.status(500).send('Error logging in');
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('user connected', (username) => {
    socket.username = username;
    io.emit('chat message', { from: 'System', content: `${username} has joined the chat` });
  });

  socket.on('chat message', async (msg) => {
    const message = new Message({
      from: msg.from,
      content: msg.content,
      timestamp: new Date()
    });
    await message.save();
    io.emit('chat message', msg);
  });

  socket.on('disconnect', () => {
    if (socket.username) {
      io.emit('chat message', { from: 'System', content: `${socket.username} has left the chat` });
    }
    console.log('User disconnected');
  });
});

server.listen(port, () => {
  console.log(`Server running at https://localhost:${port}/`);
});