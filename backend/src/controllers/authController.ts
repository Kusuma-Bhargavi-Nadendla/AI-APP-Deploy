import { Request, Response } from 'express';
import {AuthService} from "../services/authService"

export const authController = {
  async register(req: Request, res: Response) {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
         res.status(400).json({ 
          success: false,
          error: 'Please provide a valid email address' 
        });
      }

      const result = await AuthService.registerUser(name, email, password);
      res.status(201).json({
        message: 'User registered successfully',
        ...result
      });
    } catch (error: any) {
      if (error.message === 'User already exists') {
        return res.status(409).json({ error: error.message });
      }
      if (error.message === 'All fields are required') {
        return res.status(400).json({ error: error.message });
      }
      console.error('Register error:', error);
      res.status(500).json({ error: 'Server error during registration' });
    }
  },

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const result = await AuthService.loginUser(email, password);
      res.json({
        message: 'Login successful',
        ...result
      });
    } catch (error: any) {
      if (error.message === 'Invalid credentials') {
        return res.status(401).json({ error: error.message });
      }
      if (error.message === 'Email and password are required') {
        return res.status(400).json({ error: error.message });
      }
      console.error('Login error:', error);
      res.status(500).json({ error: 'Server error during login' });
    }
  },

  validateToken(req: Request, res: Response) {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ valid: false, error: 'No token provided' });
      }

      const decoded = AuthService.validateToken(token);
      res.json({ 
        valid: true, 
        user: decoded,
        message: 'Token is valid' 
      });
    } catch (error: any) {
      res.status(401).json({ 
        valid: false, 
        error: 'Invalid or expired token' 
      });
    }
  }
};