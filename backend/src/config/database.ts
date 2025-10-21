import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_DB_URI!, {
      maxPoolSize: 10,
      minPoolSize: 5,
      socketTimeoutMS: 45000,
    });
    console.log('Connected to MongoDB');
  } catch (err: any) {
    console.error('DB Connection Error:', err.message);
    process.exit(1);
  }
};

export default connectDB;