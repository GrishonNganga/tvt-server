import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany();
    return res.json(users);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Error fetching users' });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: Number(id) }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json(user);
  } catch (error) {
    return res.status(500).json({ error: 'Error fetching user' });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { email, name } = req.body;
    
    const user = await prisma.user.create({
      data: {
        email,
        name
      }
    });

    return res.status(201).json(user);
  } catch (error) {
    return res.status(500).json({ error: 'Error creating user' });
  }
};
