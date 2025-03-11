import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { v4 as uuidV4 } from "uuid";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Convert __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow frontend to connect (update for security)
        methods: ["GET", "POST"],
    },
});

// ✅ Serve static files from "public"
app.use(express.static(path.join(__dirname, "public")));

// ✅ Enable CORS
app.use(cors());

// ✅ Serve the home route (generate a unique meeting ID)
app.get("/", (req, res) => {
    res.redirect(`/${uuidV4()}`);
});

// ✅ Serve the meeting page
app.get("/:room", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "meet.html"), (err) => {
        if (err) {
            console.error("Error sending file:", err);
            res.status(500).send("Meeting page could not be loaded.");
        }
    });
});

// ✅ WebSocket Connection Handling
io.on("connection", (socket) => {
    console.log("New user connected");

    socket.on("join-room", (roomId, userId) => {
        socket.join(roomId);
        console.log(`User ${userId} joined room ${roomId}`);

        socket.to(roomId).emit("user-connected", userId);

        socket.on("disconnect", () => {
            socket.to(roomId).emit("user-disconnected", userId);
        });
    });
});

// ✅ Dynamic port for deployment
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
