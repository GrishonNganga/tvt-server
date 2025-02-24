// src/utils/auth.ts
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { User } from '@prisma/client';

export const generateToken = (user: User): string => {
  return jwt.sign(
    { 
      userId: user.id,
      email: user.email,
      role: user.role 
    },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

export const comparePasswords = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};
