import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { v4 as uuidV4 } from "uuid";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";
import { ExpressPeerServer } from "peer";

// Load environment variables
dotenv.config();

// Convert __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

// ✅ Configure WebSockets (Ensure compatibility)
const io = new Server(server, {
    cors: {
        origin: "*", // Allow frontend connections
        methods: ["GET", "POST"],
        credentials: true,
    },
    transports: ["websocket", "polling"], // Explicitly set transports
});

// ✅ Enable CORS
app.use(cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
}));

// ✅ Serve static files from "public"
app.use(express.static(path.join(__dirname, "public")));

// ✅ PeerJS Server Setup
const peerServer = ExpressPeerServer(server, {
    debug: true, // Enable debugging logs
    path: "/peerjs",
    allow_discovery: true,
});
app.use("/peerjs", peerServer);
console.log("✅ PeerJS server initialized at /peerjs");

// ✅ Home route (generates a unique meeting ID)
app.get("/", (req, res) => {
    res.redirect(`/${uuidV4()}`);
});

// ✅ Serve the meeting page
app.get("/:room", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "meet.html"), (err) => {
        if (err) {
            console.error("❌ Error sending file:", err);
            res.status(500).send("Meeting page could not be loaded.");
        }
    });
});

// ✅ WebSocket Connection Handling
io.on("connection", (socket) => {
    console.log("🟢 New WebSocket connection established");

    socket.on("join-room", (roomId, userId) => {
        socket.join(roomId);
        console.log(`👤 User ${userId} joined room ${roomId}`);

        socket.to(roomId).emit("user-connected", userId);

        socket.on("disconnect", () => {
            console.log(`❌ User ${userId} disconnected`);
            socket.to(roomId).emit("user-disconnected", userId);
        });
    });
});

// ✅ Dynamic port for deployment
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
