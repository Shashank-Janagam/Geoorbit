import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { v4 as uuidV4 } from "uuid";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";
import { ExpressPeerServer } from "peer";

dotenv.config();

// Convert __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

// ✅ Fix CORS Issues
app.use(cors({
    origin: ["https://geoorbit.netlify.app"], // Ensure frontend domain is correct
    methods: ["GET", "POST"],
    credentials: true
}));

// ✅ WebSockets Fix (Force WebSockets Only)
const io = new Server(server, {
    cors: {
        origin: "https://geoorbit.netlify.app",
        methods: ["GET", "POST"],
        credentials: true
    },
    transports: ["websocket"], // ✅ Fix "Invalid frame header"
});

// ✅ Serve static files from "public"
app.use(express.static(path.join(__dirname, "public")));

// ✅ PeerJS Server Fix
const peerServer = ExpressPeerServer(server, {
    debug: true,
    path: "/peerjs",
    allow_discovery: true
});
app.use("/peerjs", peerServer);

// ✅ Generate Unique Meeting ID for Home Route
app.get("/", (req, res) => {
    res.redirect(`/${uuidV4()}`);
});

// ✅ Serve Meeting Page
app.get("/:room", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "meet.html"));
});

// ✅ WebSocket Connection Handling
io.on("connection", (socket) => {
    console.log("✅ WebSocket connected:", socket.id);

    socket.on("join-room", (roomId, userId) => {
        socket.join(roomId);
        console.log(`📢 User ${userId} joined room ${roomId}`);
        socket.to(roomId).emit("user-connected", userId);

        socket.on("disconnect", () => {
            console.log(`❌ User ${userId} disconnected`);
            socket.to(roomId).emit("user-disconnected", userId);
        });
    });

    // ✅ Chat Messaging
    socket.on("message", ({ roomId, message, userId }) => {
        io.to(roomId).emit("receive-message", { message, userId });
    });

    // ✅ Fix for Render WebSocket Timeout
    setInterval(() => {
        socket.emit("heartbeat", "ping");
    }, 25000);
});

// ✅ Dynamic Port for Deployment
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
    