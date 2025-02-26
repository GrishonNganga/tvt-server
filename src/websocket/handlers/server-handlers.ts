import { RedisClientType } from "redis";
import prisma from "../../config/prisma";
import { ServerSocket } from "../../config/socket";

export const attachServerHandlers = (
  socket: ServerSocket,
  redisClient: RedisClientType,
) => {

  socket.on("ping", (data) => {
    console.log("Received ping from client:", socket.id);
    socket.emit("pong", {
      message: "Pong!",
      receivedData: data,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on("disconnect", async () => {
    console.log(`Server disconnected: ${socket.id}`);
    try {
      const id = await redisClient.hGet(
        `serverId_${socket.id}`,
        "id"
      );
      if (id) {
        await prisma.device.update({
          where: { id: parseInt(id) },
          data: {
            serverId: null,
            isActive: false,
            lastSeen: new Date(),
          },
        });
        await redisClient.hDel(`serverId_${socket.id}`, "id");
      }
    } catch (error) {
      console.error("Error handling disconnect:", error);
    }
  });

  socket.on("register_device", async (data) => {
    console.log("Register device received:", data);
    let clientIp = socket.handshake.address;

    if (clientIp.startsWith("::ffff:")) {
      clientIp = clientIp.substring(7);
    }
    clientIp = `${clientIp}:${data.port}`;
    const device = await prisma.device.upsert({
      where: { deviceId: data.device_id },
      update: {
        ipAddress: clientIp,
        name: data.name,
        serverId: socket.id,
        isActive: true,
        lastSeen: new Date(),
      },
      create: {
        deviceId: data.device_id,
        name: data.name,
        ipAddress: clientIp,
        isActive: true,
      },
    });

    if (device) {
      socket.emit("register_device_response", {
        status: "success",
        message: "Device registered successfully",
      });
      await redisClient.hSet(`serverId_${socket.id}`, {
        id: device.id,
      });
    }
  });  
  
};
