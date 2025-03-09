import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { v4 as uuidV4 } from "uuid";
import path from "path";
import { fileURLToPath } from "url";

// Convert __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server);

// ✅ Serve static files from "public"
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.redirect(`/${uuidV4()}`); // Generate a unique meeting ID
});

// ✅ Correctly serve the meeting page
app.get("/:room", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "meet.html"), (err) => {
        if (err) {
            console.error("Error sending file:", err);
            res.status(500).send("Meeting page could not be loaded.");
        }
    });
});

io.on("connection", (socket) => {
    socket.on("join-room", (roomId, userId) => {
        socket.join(roomId);
        socket.to(roomId).emit("user-connected", userId);

        socket.on("disconnect", () => {
            socket.to(roomId).emit("user-disconnected", userId);
        });
    });
});

server.listen(3000, () => {
    console.log("Server running at https://geoorbit.netlify.app:3000");
});
