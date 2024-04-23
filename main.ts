import http from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
// import { cors } from 'socket.io/dist/socket.io';

const server = http.createServer();
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  },
});

const STUN_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" }, // Google's public STUN server
  // Add more STUN servers here if needed
];

io.on("connection", (socket: Socket) => {
  console.log("A user connected");

  socket.emit("stun-servers", STUN_SERVERS);

  socket.on("offer", ({ offer, uuid }) => {
    console.log("Received offer:", offer);
    console.log(uuid);
    socket.broadcast.emit(`verified-offer-${uuid}`, { offer, uuid }); // Broadcast the offer to the client
  });

  socket.on("answer", (answer: any) => {
    console.log("Received answer:");
    socket.broadcast.emit("answer", answer); // Broadcast the answer to the Raspberry Pi
  });

  socket.on("ice-candidate", ({ candidate, uuid }) => {
    console.log("uuid from ice", uuid);
    console.log("Received ICE candidate:", candidate);
    socket.broadcast.emit("ice-candidate", { candidate, uuid }); // Broadcast the ICE candidate to the other peer
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });

  socket.on("browser-connected", ({ uuid }) => {
    console.log("Browser connected", uuid);
    socket.broadcast.emit("browser-connected", { uuid });
  });

  socket.on("browser-requires-stream", ({cameraId, streamName, sessionUuid}) => {
    console.log('browser requires stream', streamName, sessionUuid)
    socket.broadcast.emit(`browser-requires-stream-${cameraId}`, {streamName, sessionUuid});
  });

  socket.on("pi-offers-stream", ({cameraId, share, pwd, sessionUuid}) => {
    console.log('pi-offers-stream', cameraId);
    socket.broadcast.emit(`pi-offers-stream-${cameraId}-${sessionUuid}`, {cameraId, share, pwd});
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Signaling server is running on port ${PORT}`);
});
