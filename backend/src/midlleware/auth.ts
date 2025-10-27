import { Request, Response, NextFunction } from 'express';
import { AuthService }  from "../services/authService"
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    console.log("Auth middleware invoked",req.body,req.method,req.url);
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
        console.log("No token provided");
      return res.status(401).json({ 
        success: false,
        error: 'Access denied. No token provided.' 
      });
    }

    const decoded = AuthService.validateToken(token);
    req.user = decoded; 
    next();
    console.log("peoceeding")
    
  } catch (error: any) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ 
      success: false,
      error: 'Invalid or expired token' 
    });
  }
};