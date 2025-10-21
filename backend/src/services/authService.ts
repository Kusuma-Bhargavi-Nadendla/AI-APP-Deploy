import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from "../models/User";
import { JWT_CONFIG } from "../config/constants";

export class AuthService {

  static generateToken(user: { id: string; name: string }) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT secret not defined");
    }
    return jwt.sign({ id: user.id, name: user.name }, secret, JWT_CONFIG);
  }

  static async registerUser(name: string, email: string, password: string) {
    if (!name || !email || !password) {
      throw new Error("All fields are required");
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error("User already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });

    const token = this.generateToken({ id: user._id.toString(), name: user.name });

    return {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      }
    };
  }

  static async loginUser(email: string, password: string) {
    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("Invalid credentials");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error("Invalid credentials");
    }

    const token = this.generateToken({ id: user._id.toString(), name: user.name });

    return {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      }
    };
  }

  static validateToken(token: string) {
    if (!token) {
      throw new Error("No token provided");
    }
    let decoded;
    const secret = process.env.JWT_SECRET;
    if (secret) {
      decoded = jwt.verify(token, secret);
    } else {
      throw new Error("JWT secret not defined");
    }
    return decoded;
  }
}