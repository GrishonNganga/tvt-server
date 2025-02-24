-- CreateTable
CREATE TABLE "Session" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "deviceId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Session_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SessionOnUser" (
    "userId" INTEGER NOT NULL,
    "gameId" INTEGER NOT NULL,

    PRIMARY KEY ("userId", "gameId"),
    CONSTRAINT "SessionOnUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SessionOnUser_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Session" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
