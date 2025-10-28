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

app.get('/', (req, res) => {
  res.json({ 
    message: 'AI Quiz Backend is running successfully!',
    status: 'active',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', error);
  
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    service: 'AI Quiz API',
    timestamp: new Date().toISOString()
  });
});

const PORT: number = parseInt(process.env.PORT ?? '5000', 10);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Connected to MongoDB');
});

export default app;