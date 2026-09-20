// ===================================================================
// Socket.IO Real-Time Client Singleton
// Manages WebSocket connections for customer status & shop live queues
// ===================================================================

import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "./api";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(API_BASE_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 2000,
    });

    socket.on("connect", () => {
      console.log("🟢 Frontend connected to Socket.IO:", socket?.id);
    });

    socket.on("disconnect", () => {
      console.log("🔴 Frontend disconnected from Socket.IO");
    });
  }

  return socket;
}
