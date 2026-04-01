import express from 'express';
import jwt from 'jsonwebtoken';
import Room from '../models/Room.js';
import { generateFiveDigitCode } from '../utils/generateCode.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Helper to compute expiry date
function expiryDate() {
  const hours = Number(process.env.ROOM_TTL_HOURS || 5);
  const d = new Date();
  d.setHours(d.getHours() + hours);
  return d;
}

// Create Room
router.post('/', async (req, res) => {
  try {
    const { numGroups, groupNames, creatorName, creatorGroupNumber } = req.body;
    if (!numGroups || !Array.isArray(groupNames) || groupNames.length !== Number(numGroups)) {
      return res.status(400).json({ message: 'numGroups and groupNames length must match' });
    }
    if (!creatorName || !creatorGroupNumber || creatorGroupNumber < 1 || creatorGroupNumber > numGroups) {
      return res.status(400).json({ message: 'Invalid creator details' });
    }

    const groups = groupNames.map((name, idx) => ({
      number: idx + 1,
      name: String(name).trim()
    }));

    let code;
    for (let i = 0; i < 6; i++) {
      const candidate = generateFiveDigitCode();
      const exists = await Room.findOne({ code: candidate });
      if (!exists) {
        code = candidate;
        break;
      }
    }

    if (!code) {
      return res.status(500).json({ message: 'Unable to allocate room code. Try again.' });
    }

    await Room.create({
      code,
      groups,
      expiresAt: expiryDate(),
      enteredBillTotal: null
    });

    const token = jwt.sign(
      { name: creatorName, groupNumber: Number(creatorGroupNumber), roomCode: code },
      process.env.JWT_SECRET,
      { expiresIn: `${process.env.ROOM_TTL_HOURS || 5}h` }
    );

    return res.json({ roomCode: code, groups, token });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Public — fetch room groups by code (for join flow + portal shared room data)
router.get('/:code', async (req, res) => {
  try {
    const room = await Room.findOne({ code: req.params.code });
    if (!room) return res.status(404).json({ message: 'Room not found or expired' });

    return res.json({
      roomCode: room.code,
      groups: room.groups,
      enteredBillTotal: room.enteredBillTotal
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Join Room
router.post('/join', async (req, res) => {
  try {
    const { roomCode, name, groupNumber } = req.body;
    const room = await Room.findOne({ code: roomCode });
    if (!room) return res.status(404).json({ message: 'Room not found or expired' });

    const gnum = Number(groupNumber);
    const valid = room.groups.some(g => g.number === gnum);
    if (!name || !valid) return res.status(400).json({ message: 'Invalid name or groupNumber' });

    const token = jwt.sign(
      { name, groupNumber: gnum, roomCode },
      process.env.JWT_SECRET,
      { expiresIn: `${process.env.ROOM_TTL_HOURS || 5}h` }
    );

    return res.json({ token, groups: room.groups });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Update shared total bill amount (including taxes/service/tips)
router.put('/:code/entered-total', auth, async (req, res) => {
  try {
    const io = req.app.get('io');
    const { enteredBillTotal } = req.body;

    const room = await Room.findOne({ code: req.params.code });
    if (!room) return res.status(404).json({ message: 'Room not found or expired' });

    let nextValue = null;
    if (enteredBillTotal !== '' && enteredBillTotal !== null && enteredBillTotal !== undefined) {
      const num = Number(enteredBillTotal);
      if (Number.isNaN(num) || num < 0) {
        return res.status(400).json({ message: 'Entered total must be a valid non-negative number' });
      }
      nextValue = num;
    }

    room.enteredBillTotal = nextValue;
    await room.save();

    io.to(room.code).emit('enteredBillTotalUpdated', {
      enteredBillTotal: room.enteredBillTotal
    });

    return res.json({ enteredBillTotal: room.enteredBillTotal });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;