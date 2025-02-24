import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import jwt from 'jsonwebtoken';
import { User } from '../types';

export interface AuthenticatedSocket extends Socket {
  user?: User
}

export interface ServerSocket extends Socket {
  serverId?: string;
}

export const initializeSocket = async (httpServer: HTTPServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: [process.env.CLIENT_URL || 'http://localhost:3001', "http://localhost:8080"],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Redis setup for scaling
  const pubClient = createClient({ url: process.env.REDIS_URL });
  const subClient = pubClient.duplicate();

  await Promise.all([pubClient.connect(), subClient.connect()]);

  console.log('Redis connected');
  
  io.adapter(createAdapter(pubClient, subClient));

  const clientNamespace = io.of('/clients');
  
  clientNamespace.use(async (socket: AuthenticatedSocket, next) => {
    try {
      console.log('Authenticating client socket...');
      const token = socket.handshake.auth.token || 
                    socket.handshake.headers.cookie?.split('auth-token=')[1];

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      socket.user = decoded;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  const serverNamespace = io.of('/servers');

  serverNamespace.use(async (socket: ServerSocket, next) => {
    try {
      console.log('Authenticating server socket...');

      // const apiKey = socket.handshake.auth.apiKey;
      
      // if (!apiKey || apiKey !== process.env.SERVER_API_KEY) {
      //   return next(new Error('Invalid API key'));
      // }

      // socket.serverId = socket.handshake.auth.serverId;
      next();
    } catch (error) {
      next(new Error('Server authentication failed'));
    }
  });

  return {
    io,
    clientNamespace,
    serverNamespace,
    pubClient,
  };
};
