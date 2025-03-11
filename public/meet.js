// ✅ Set up Socket.io with the correct backend URL
const BACKEND_URL = "https://geoorbit.onrender.com"; // ✅ Ensure this is correct
const socket = io(BACKEND_URL, {
    transports: ["websocket", "polling"], // ✅ Fix WebSocket connection issue
    withCredentials: true,
    secure: true,
});

const ROOM_ID = window.location.pathname.substring(1);
const videoGrid = document.getElementById("video-grid");
const chatBox = document.getElementById("chat-box");
const chatInput = document.getElementById("chat-input");
const sendButton = document.getElementById("send-btn");
const meetingIdDisplay = document.getElementById("meeting-id");

const myVideo = document.createElement("video");
myVideo.muted = true;

let myStream;
const peers = {};

// ✅ Fix PeerJS Path Issue for Render
const peer = new Peer(undefined, {
    host: "geoorbit.onrender.com",
    secure: true,
    port: 443,
    path: "/peerjs", // ✅ Ensure correct path
});

// ✅ Show Meeting ID
peer.on("open", (id) => {
    console.log("✅ Peer Connected. ID:", id);
    meetingIdDisplay.innerText = `Meeting ID: ${ROOM_ID}`;
    socket.emit("join-room", ROOM_ID, id);
});

// ✅ Get User Media (Camera & Mic)
navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then((stream) => {
    console.log("✅ User Media Accessed");
    myStream = stream;
    addVideoStream(myVideo, stream, "You");

    // ✅ Handle Incoming Calls
    peer.on("call", (call) => {
        console.log(`📞 Incoming call from ${call.peer}`);
        call.answer(myStream);
        const video = document.createElement("video");

        call.on("stream", (userStream) => {
            console.log(`✅ Received stream from ${call.peer}`);
            addVideoStream(video, userStream, call.peer);
        });

        call.on("close", () => {
            console.log(`❌ Call closed from ${call.peer}`);
            video.remove();
        });

        peers[call.peer] = call;
    });

    // ✅ Handle New Users
    socket.on("user-connected", (userId) => {
        console.log(`🆕 New user connected: ${userId}`);
        setTimeout(() => {
            connectToNewUser(userId, myStream);
        }, 1000);
    });

    // ✅ Handle User Disconnection
    socket.on("user-disconnected", (userId) => {
        console.log(`❌ User disconnected: ${userId}`);
        if (peers[userId]) peers[userId].close();
    });
}).catch((err) => {
    console.error("❌ Error accessing media:", err);
});

// ✅ Function to Add Video Stream
function addVideoStream(video, stream, userId = "Unknown") {
    console.log(`🎥 Adding video for ${userId}`);
    
    video.srcObject = stream;
    video.setAttribute("data-user", userId);
    video.setAttribute("autoplay", true);
    video.setAttribute("playsinline", true);
    
    video.addEventListener("loadedmetadata", () => {
        video.play();
        console.log(`▶️ Playing video for ${userId}`);
    });

    document.getElementById("video-grid").appendChild(video);
}

// ✅ Connect to New User
function connectToNewUser(userId, stream) {
    console.log(`📞 Calling ${userId}`);
    const call = peer.call(userId, stream);

    if (!call) {
        console.error("❌ Call failed:", userId);
        return;
    }

    const video = document.createElement("video");
    call.on("stream", (userStream) => {
        console.log(`✅ Connected to ${userId}, adding stream`);
        addVideoStream(video, userStream, userId);
    });

    call.on("close", () => {
        console.log(`❌ User ${userId} disconnected`);
        video.remove();
    });

    peers[userId] = call;
}

// ✅ Send Chat Message
sendButton.addEventListener("click", sendMessage);
chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
});

function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    socket.emit("message", { roomId: ROOM_ID, message, userId: peer.id });
    appendMessage(`<b>You:</b> ${message}`);
    chatInput.value = "";
}

// ✅ Append Chat Message
function appendMessage(message) {
    const msgElement = document.createElement("p");
    msgElement.innerHTML = message;
    chatBox.appendChild(msgElement);
}

// ✅ Receive Chat Messages
socket.on("receive-message", ({ message, userId }) => {
    appendMessage(`<b>User ${userId}:</b> ${message}`);
});
 