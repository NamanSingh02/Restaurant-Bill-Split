import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { Server as SocketIOServer } from 'socket.io';

import roomsRouter from './routes/rooms.js';
import foodRouter from './routes/food.js';
import Room from './models/Room.js';
import jwt from 'jsonwebtoken';


const app = express();
const server = http.createServer(app);


const io = new SocketIOServer(server, {
cors: {
origin: process.env.CLIENT_ORIGIN || '*',
methods: ['GET', 'POST']
}
});


// Socket auth & room join
io.use((socket, next) => {
try {
const token = socket.handshake.auth?.token;
if (!token) return next(new Error('No token'));
const payload = jwt.verify(token, process.env.JWT_SECRET);
socket.user = payload; // { name, groupNumber, roomCode }
return next();
} catch (e) {
return next(new Error('Invalid token'));
}
});


io.on('connection', async (socket) => {
const roomCode = socket.user?.roomCode || socket.handshake.query.roomCode;
if (roomCode) {
// verify the room exists
const room = await Room.findOne({ code: roomCode });
if (room) {
socket.join(roomCode);
}
}
socket.on('disconnect', () => {});
});


app.set('io', io);


// Middleware
app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*', credentials: true }));
app.use(express.json());
app.use(morgan('dev'));


// DB
mongoose.connect(process.env.MONGO_URI, { dbName: 'billsplit' })
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB error', err));


// Routes
app.use('/api/rooms', roomsRouter);
app.use('/api/food', foodRouter);


app.get('/', (req, res) => res.send('Bill Split API is running'));


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));