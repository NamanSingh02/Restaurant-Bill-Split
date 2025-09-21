import mongoose from 'mongoose';


const FoodItemSchema = new mongoose.Schema({
roomCode: { type: String, required: true, index: true },
name: { type: String, required: true },
price: { type: Number, required: true, min: 0 },
groupNumbers: { type: [Number], required: true },
groupNames: { type: [String], required: true },
percentages: { type: [Number], required: true },
personName: { type: String, required: true },
createdAt: { type: Date, default: Date.now },
expiresAt: { type: Date, required: true }
});


FoodItemSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });


export default mongoose.model('FoodItem', FoodItemSchema);