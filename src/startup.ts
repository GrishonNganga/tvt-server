import { createServer } from "http";
import express, { Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import {
  AuthenticatedSocket,
  initializeSocket,
  ServerSocket,
} from "./config/socket";
import { PrismaClient } from "@prisma/client";
import { attachServerHandlers } from "./websocket/handlers/server-handlers";
import { attachClientHandlers } from "./websocket/handlers/client-handlers";
import prisma from "./config/prisma";
import routes from "./routes";

async function configureMiddleware(app: Express) {
  // Basic middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Configure CORS
  app.use(
    cors({
      origin: [
        process.env.CLIENT_URL || "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5000",
        "http://localhost:8080",
      ],
      credentials: true,
    })
  );

  // Health check route
  app.get("/health", (req, res) => {
    res.json({ status: "healthy" });
  });

  // API routes
  app.use("/api", routes);
}

async function startup() {
  try {
    const app = express();
    const httpServer = createServer(app);

    await configureMiddleware(app);

    // Initialize Socket.IO with Redis adapter
    const { io, clientNamespace, serverNamespace, pubClient } =
      await initializeSocket(httpServer);

    const PORT = process.env.PORT || 3000;
    const HOST = process.env.HOST || "localhost";

    httpServer.listen(PORT, () => {
      console.log(`HTTP Server running on http://${HOST}:${PORT}`);
      console.log(`WebSocket server running on ws://${HOST}:${PORT}`);
      console.log(`Socket.IO client namespace ready at /clients`);
      console.log(`Socket.IO server namespace ready at /servers`);
    });

    clientNamespace.on("connection", async (socket: AuthenticatedSocket) => {
      console.log(
        `Client connected: ${socket.id}, User ID: ${socket?.user?.userId}`
      );

      await pubClient.hSet(`clientId_${socket.id}`, {
        id: socket?.user?.userId,
      });

      attachClientHandlers(socket, pubClient, serverNamespace);

      socket.on("disconnect", () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });

    serverNamespace.on("connection", (socket: ServerSocket) => {
      console.log(
        `Server connected: ${socket.id}, Server ID: ${socket.serverId}`
      );
     
      attachServerHandlers(socket, pubClient);
    });

    // Error handling middleware - should be last
    app.use((err: Error, req: any, res: any, next: any) => {
      console.error(err.stack);
      res.status(500).json({ error: "Something went wrong!" });
    });
  } catch (error) {
    console.error("Startup failed:", error);
    process.exit(1);
  }
}

// Keep your existing process handlers
process.on("SIGTERM", async () => {
  console.log("SIGTERM signal received: closing HTTP server");
  try {
    const prisma = new PrismaClient();
    await prisma.$disconnect();
    console.log("Database connection closed");
    process.exit(0);
  } catch (error) {
    console.error("Shutdown error:", error);
    process.exit(1);
  }
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

startup();
