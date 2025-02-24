import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { generateToken, hashPassword, comparePasswords } from '../utils/auth';
import { loginSchema, signupSchema } from '../validators/auth-validators';
import { cookieConfig } from '../config/cookie';
import { LoginRequest, SignupRequest } from '../types/auth';

export const login = async (
  req: Request<{}, {}, LoginRequest>,
  res: Response
) => {
  try {
    const validatedData = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValidPassword = await comparePasswords(
      validatedData.password,
      user.password
    );

    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user);

    res.cookie('auth-token', token, cookieConfig);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: error.errors });
    }
    res.status(500).json({ message: 'Login failed' });
  }
};

export const signup = async (
  req: Request<{}, {}, SignupRequest>,
  res: Response
) => {
  try {
    const validatedData = signupSchema.parse(req.body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await hashPassword(validatedData.password);

    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        name: validatedData.name,
        role: 'USER'
      }
    });

    // Generate token
    const token = generateToken(user);

    // Set cookie
    res.cookie('auth-token', token, cookieConfig);

    // Return user data
    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.log(error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: error.errors });
    }
    res.status(500).json({ message: 'Registration failed' });
  }
};

export const logout = async (req: Request, res: Response) => {
  res.cookie('token', '', {
    ...cookieConfig,
    maxAge: 0
  });
  res.json({ message: 'Logged out successfully' });
};

// Optional: Get current user info
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user data' });
  }
};
