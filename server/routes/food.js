// server/routes/food.js
import express from 'express';
import Room from '../models/Room.js';
import FoodItem from '../models/FoodItem.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Get all food items for a room
router.get('/:roomCode', async (req, res) => {
  try {
    const room = await Room.findOne({ code: req.params.roomCode });
    if (!room) return res.status(404).json({ message: 'Room not found or expired' });

    const items = await FoodItem.find({ roomCode: room.code }).sort({ createdAt: 1 });
    return res.json({ items });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Add a food item (requires auth)
router.post('/:roomCode', auth, async (req, res) => {
  try {
    // Socket.IO instance was attached in server.js via app.set('io', io)
    const io = req.app.get('io');

    const room = await Room.findOne({ code: req.params.roomCode });
    if (!room) return res.status(404).json({ message: 'Room not found or expired' });

    const { name, price, groupNumbers, percentages } = req.body;

    // Basic validation
    if (!name || price == null || !Array.isArray(groupNumbers) || !Array.isArray(percentages)) {
      return res.status(400).json({ message: 'Missing fields' });
    }
    if (groupNumbers.length !== percentages.length || groupNumbers.length === 0) {
      return res.status(400).json({ message: 'Groups and percentages must align' });
    }

    // Percentages must sum to 100 (allow rounding)
    const sum = percentages.reduce((a, b) => a + Number(b), 0);
    if (Math.round(sum) !== 100) {
      return res.status(400).json({ message: 'Percentages must sum to 100' });
    }

    // Validate groups and derive names in same order
    const groupMap = new Map(room.groups.map(g => [g.number, g.name]));
    const names = [];
    for (const n of groupNumbers) {
      const nm = groupMap.get(Number(n));
      if (!nm) return res.status(400).json({ message: `Invalid group number ${n}` });
      names.push(nm);
    }

    // Create item (share expiry with room for TTL cleanup)
    const item = await FoodItem.create({
      roomCode: room.code,
      name: String(name).trim(),
      price: Number(price),
      groupNumbers: groupNumbers.map(Number),
      groupNames: names,
      percentages: percentages.map(Number),
      personName: req.user.name,
      expiresAt: room.expiresAt
    });

    // Notify all clients in this room (safe-guard if io missing)
    if (io) io.to(room.code).emit('foodItemAdded', item);

    return res.status(201).json({ item });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Calculate totals per group
router.get('/:roomCode/calc', async (req, res) => {
  try {
    const room = await Room.findOne({ code: req.params.roomCode });
    if (!room) return res.status(404).json({ message: 'Room not found or expired' });

    const items = await FoodItem.find({ roomCode: room.code });
    const totals = new Map(room.groups.map(g => [g.number, 0]));

    for (const it of items) {
      const price = Number(it.price);
      it.groupNumbers.forEach((gnum, idx) => {
        const pct = Number(it.percentages[idx] || 0) / 100;
        totals.set(gnum, (totals.get(gnum) || 0) + price * pct);
      });
    }

    const result = room.groups.map(g => ({
      groupNumber: g.number,
      groupName: g.name,
      bill: Number((totals.get(g.number) || 0).toFixed(2))
    }));

    return res.json({ bills: result });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;
