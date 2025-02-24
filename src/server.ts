import express, { Express, Request, Response } from "express";
import cors from "cors";
import routes from "./routes";
import prisma from "./config/prisma";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { AuthenticatedSocket, initializeSocket, ServerSocket } from "./config/socket";
import socketService from "./websocket/services/socket-service";
import { attachClientHandlers } from './websocket/handlers/client-handlers';
import { attachServerHandlers } from './websocket/handlers/server-handlers';

const app: Express = express();
const httpServer = createServer(app);

// Configure Express middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: [
      process.env.CLIENT_URL || "http://localhost:3000",
      "http://localhost:3001", "http://localhost:5000", "0.0.0.0:5000"
    ],
    credentials: true,
  })
);

app.use("/api", routes);

app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "healthy" });
});

app.use((err: Error, req: Request, res: Response, next: Function) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

// Initialize WebSocket with the HTTP server
const initializeServer = async () => {
  try {
    const { io, clientNamespace, serverNamespace } = await initializeSocket(httpServer);
    socketService.setIO(io);

    clientNamespace.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`Client connected: ${socket.id}, User ID: ${socket.userId}`);
      attachClientHandlers(socket);

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });

    serverNamespace.on('connection', (socket: ServerSocket) => {
      console.log(`Server connected: ${socket.id}, Server ID: ${socket.serverId}`);
      attachServerHandlers(socket);

      socket.on('disconnect', () => {
        console.log(`Server disconnected: ${socket.id}`);
      });
    });

    // Start the server
    httpServer.listen(PORT, () => {
      console.log(`HTTP Server running on http://${HOST}:${PORT}`);
      console.log(`WebSocket server running on ws://${HOST}:${PORT}`);
    });

  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
};

initializeServer().catch(console.error);

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM signal received: closing HTTP server");
  await prisma.$disconnect();
  httpServer.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });
});
