import { RedisClientType } from "redis";
import { AuthenticatedSocket, ServerSocket } from "../../config/socket";
import prisma from "../../config/prisma";

export const attachClientHandlers = (
  socket: AuthenticatedSocket,
  redisClient: RedisClientType,
  serverNamespace: ServerSocket
) => {
  socket.on("getActiveDevices", async (data) => {
    console.log("getActiveDevices data", data);
    try {
      const devices = await prisma.device.findMany({
        where: {
          isActive: true,
        },
        include: {
          sessions: {
            where: {
              isActive: true,
            },
            include: {
              participants: {
                include: {
                  participants: true,
                },
              },
            },
          },
        },
      });

      // Transform the data to include session information
      const formattedDevices = devices.map((device) => {
        const activeSession = device.sessions[0]; // There can only be one active session
        return {
          ...device,
          inUse: !!activeSession,
          availableSlots: activeSession
            ? 4 - activeSession.participants.length
            : 4,
          currentUsers: activeSession
            ? activeSession.participants.map((p) => p.participants)
            : [],
          sessionId: activeSession?.id || null,
        };
      });
      console.log("Emitting getActiveDevices", formattedDevices);
      socket.emit("getActiveDevices", {
        status: "success",
        devices: formattedDevices,
      });
    } catch (err) {
      console.log(err);
      socket.emit("getActiveDevices", {
        status: "error",
        message: "Error fetching active devices",
      });
    }
  });

  socket.on("getDevice", async (data: { deviceId: number }) => {
    try {
      const device = await prisma.device.findUnique({
        where: {
          deviceId: data.deviceId,
        },
        include: {
          sessions: {
            where: {
              isActive: true,
            },
            include: {
              participants: {
                include: {
                  participants: true,
                },
              },
            },
          },
        },
      });

      if (!device) {
        return socket.emit("getDevice", {
          status: "error",
          message: "Device not found",
        });
      }
      const activeSession = device.sessions[0];
      const formattedDevice = {
        ...device,
        inUse: !!activeSession,
        availableSlots: activeSession
          ? 4 - activeSession.participants.length
          : 4,
        currentUsers: activeSession
          ? activeSession.participants.map((p) => p.participants)
          : [],
        sessionId: activeSession?.id || null,
        isUserParticipant: activeSession
          ? activeSession.participants.some(
              (p) => p.userId === socket.user?.userId
            )
          : false,
      };

      socket.emit("getDevice", {
        status: "success",
        device: formattedDevice,
      });
    } catch (err) {
      console.log(err);
      socket.emit("getDevice", {
        status: "error",
        message: "Error fetching device",
      });
    }
  });

  socket.on("createSessionForDevice", async (data) => {
    try {
      const activeSession = await prisma.session.findFirst({
        where: {
          deviceId: data.deviceId,
          isActive: true,
        },
        include: {
          participants: {
            include: {
              participants: true,
            },
          },
        },
      });

      // No active session - create new one
      if (!activeSession) {
        const newSession = await prisma.session.create({
          data: {
            deviceId: data.deviceId,
            isActive: true,
            participants: {
              create: [{ userId: socket.user?.userId }],
            },
          },
          include: {
            participants: {
              include: {
                participants: true,
              },
            },
          },
        });

        return socket.emit("createSessionForDevice", {
          status: "success",
          session: newSession,
        });
      }

      // Check if session is full (4 participants)
      if (activeSession.participants.length >= 4) {
        return socket.emit("createSessionForDevice", {
          status: "error",
          message: "Session is full",
        });
      }

      // Add user to existing session if not already a participant
      const isUserParticipant = activeSession.participants.some(
        (p) => p.userId === socket?.user?.userId
      );

      if (!isUserParticipant) {
        await prisma.sessionOnUser.create({
          data: {
            userId: data.userId,
            sessionId: activeSession.id,
          },
        });
      }

      return socket.emit("createSessionForDevice", {
        status: "success",
        session: activeSession,
      });
    } catch (err) {
      console.log(err);
      socket.emit("createSessionForDevice", {
        status: "error",
        message: "Error creating session for device",
      });
    }
  });

  socket.on("rangeStop", async (data) => {
    try {
      console.log("rangeStop data from client:", data);
      await prisma.device.updateMany({
        data: {
          rangeStop: data.range_stop,
        },
      });
      serverNamespace.emit("range_data", {
        type: "range_data",
        status: "success",
        message: "Range Stop Status Updated",
        data: data,
      });
      console.log("Published rangeStop");
    } catch (err) {
      console.log(err);
    }
  });

  socket.on("processFeed", async (data) => {
    try {
      console.log("processFeed data from client:", data);
      const device = await prisma.device.findFirst({
        where: {
          id: data.deviceId,
        }
      });
      if(device && device.serverId){
        serverNamespace.to(device.serverId).emit("process_feed", {
          type: "process_feed",
          status: "success",
          message: "Process Feed Status Updated",
          data: data,
        });
        console.log("Published processFeed");
      }
      
    } catch (err) {
      console.log(err);
    }
  });
};
