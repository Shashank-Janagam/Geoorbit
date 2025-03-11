const BACKEND_URL = "https://geoorbit.onrender.com"; // Ensure this is correct

// ✅ Fix WebSocket Connection
const socket = io(BACKEND_URL, {
    transports: ["websocket"], // ✅ Ensure WebSocket transport only
    withCredentials: true,
    secure: true,
});

const ROOM_ID = window.location.pathname.substring(1);
const myVideo = document.createElement("video");
myVideo.muted = true;
let myStream;
const peers = {};

// ✅ Fix PeerJS Path
const peer = new Peer(undefined, {
    host: "geoorbit.onrender.com",
    secure: true,
    port: 443,
    path: "/peerjs",
});

peer.on("open", (id) => {
    console.log("✅ Peer Connected. ID:", id);
    socket.emit("join-room", ROOM_ID, id);
});

// ✅ Fix User Media Issues
navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then((stream) => {
    console.log("✅ User Media Accessed");
    myStream = stream;
    addVideoStream(myVideo, stream, "You");

    peer.on("call", (call) => {
        call.answer(myStream);
        const video = document.createElement("video");

        call.on("stream", (userStream) => {
            addVideoStream(video, userStream, call.peer);
        });

        call.on("close", () => {
            video.remove();
        });

        peers[call.peer] = call;
    });

    socket.on("user-connected", (userId) => {
        setTimeout(() => {
            connectToNewUser(userId, myStream);
        }, 1000);
    });

    socket.on("user-disconnected", (userId) => {
        if (peers[userId]) peers[userId].close();
    });
}).catch((err) => {
    console.error("❌ Error accessing media:", err);
});

// ✅ Fix Video Streaming
function addVideoStream(video, stream, userId = "Unknown") {
    video.srcObject = stream;
    video.setAttribute("data-user", userId);
    video.setAttribute("autoplay", true);
    video.setAttribute("playsinline", true);

    video.addEventListener("loadedmetadata", () => {
        video.play();
    });

    document.getElementById("video-grid").appendChild(video);
}

// ✅ Fix Chat
document.getElementById("send-btn").addEventListener("click", sendMessage);
document.getElementById("chat-input").addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
});

function sendMessage() {
    const message = document.getElementById("chat-input").value.trim();
    if (!message) return;

    socket.emit("message", { roomId: ROOM_ID, message, userId: peer.id });
    appendMessage(`<b>You:</b> ${message}`);
    document.getElementById("chat-input").value = "";
}

function appendMessage(message) {
    const msgElement = document.createElement("p");
    msgElement.innerHTML = message;
    document.getElementById("chat-box").appendChild(msgElement);
}

socket.on("receive-message", ({ message, userId }) => {
    appendMessage(`<b>User ${userId}:</b> ${message}`);
});
