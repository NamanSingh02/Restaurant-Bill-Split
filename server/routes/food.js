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

// Add a food item
router.post('/:roomCode', auth, async (req, res) => {
  try {
    const io = req.app.get('io');
    const room = await Room.findOne({ code: req.params.roomCode });
    if (!room) return res.status(404).json({ message: 'Room not found or expired' });

    const { name, price, groupNumbers, percentages } = req.body;
    if (!name || price == null || !Array.isArray(groupNumbers) || !Array.isArray(percentages)) {
      return res.status(400).json({ message: 'Missing fields' });
    }
    if (groupNumbers.length !== percentages.length || groupNumbers.length === 0) {
      return res.status(400).json({ message: 'Groups and percentages must align' });
    }

    const sum = percentages.reduce((a, b) => a + Number(b), 0);
    if (Math.round(sum) !== 100) {
      return res.status(400).json({ message: 'Percentages must sum to 100' });
    }

    const groupMap = new Map(room.groups.map(g => [g.number, g.name]));
    const names = [];
    for (const n of groupNumbers) {
      const nm = groupMap.get(Number(n));
      if (!nm) return res.status(400).json({ message: `Invalid group number ${n}` });
      names.push(nm);
    }

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

    // IMPORTANT: clear shared bill-total input because the bill changed
    room.enteredBillTotal = null;
    await room.save();

    io.to(room.code).emit('foodItemAdded', item);
    io.to(room.code).emit('enteredBillTotalCleared');

    return res.status(201).json({ item });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Delete a food item
router.delete('/:roomCode/:itemId', auth, async (req, res) => {
  try {
    const io = req.app.get('io');
    const { roomCode, itemId } = req.params;

    const room = await Room.findOne({ code: roomCode });
    if (!room) return res.status(404).json({ message: 'Room not found or expired' });

    const item = await FoodItem.findOne({ _id: itemId, roomCode: room.code });
    if (!item) return res.status(404).json({ message: 'Food item not found' });

    await FoodItem.deleteOne({ _id: itemId });

    // Also clear shared bill-total input because the bill changed
    room.enteredBillTotal = null;
    await room.save();

    io.to(room.code).emit('foodItemDeleted', { itemId });
    io.to(room.code).emit('enteredBillTotalCleared');

    return res.json({ message: 'Food item deleted', itemId });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Calculate totals per group (with optional proportional extra charges)
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

    const baseTotal = Number(
      room.groups.reduce((sum, g) => sum + (totals.get(g.number) || 0), 0).toFixed(2)
    );

    let ratio = 1;
    const enteredBillTotal = room.enteredBillTotal;

    if (enteredBillTotal !== null && enteredBillTotal !== undefined) {
      if (Number(enteredBillTotal) < baseTotal) {
        return res.status(400).json({
          message: 'Entered total amount cannot be less than the calculated total bill'
        });
      }

      if (baseTotal > 0) {
        ratio = Number((Number(enteredBillTotal) / baseTotal).toFixed(6));
      }
    }

    const result = room.groups.map(g => {
      const baseBill = Number((totals.get(g.number) || 0).toFixed(2));
      const finalBill = Number((baseBill * ratio).toFixed(2));

      return {
        groupNumber: g.number,
        groupName: g.name,
        baseBill,
        bill: finalBill
      };
    });

    return res.json({
      bills: result,
      ratio,
      baseTotal,
      enteredBillTotal
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;