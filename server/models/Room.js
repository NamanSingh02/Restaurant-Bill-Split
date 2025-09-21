import mongoose from 'mongoose';


const GroupSchema = new mongoose.Schema({
number: { type: Number, required: true },
name: { type: String, required: true }
}, { _id: false });


const RoomSchema = new mongoose.Schema({
code: { type: String, required: true, unique: true },
groups: { type: [GroupSchema], required: true },
createdAt: { type: Date, default: Date.now },
expiresAt: { type: Date, required: true }
});


// TTL index — document is removed when expiresAt <= now
RoomSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });


export default mongoose.model('Room', RoomSchema);