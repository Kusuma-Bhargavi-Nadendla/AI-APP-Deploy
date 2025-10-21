import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import  connectDB  from "./config/database"

import authRoutes from "./routes/auth";
import categoryRoutes from "./routes/categories";
import quizRoutes from "./routes/quiz";
import analyticsRoutes from "./routes/analytics";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

connectDB();

app.use('/auth', authRoutes);
app.use('/categories', categoryRoutes);
app.use('/quiz', quizRoutes);
app.use('/analytics', analyticsRoutes);


app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', error);
  
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth routes: http://localhost:${PORT}/api/auth`);
  console.log(`📚 Category routes: http://localhost:${PORT}/api/categories`);
  console.log(`🎯 Quiz routes: http://localhost:${PORT}/api/quiz`);
  console.log(`📈 Analytics routes: http://localhost:${PORT}/api/analytics`);
});

export default app;