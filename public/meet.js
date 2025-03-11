// ✅ Set up Socket.io with the correct backend URL
const BACKEND_URL = "https://geoorbit.onrender.com"; // ⚠️ Replace with your Render backend URL
const socket = io(BACKEND_URL, {
    transports: ["websocket", "polling"]
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

// ✅ Use a Free PeerJS Server
const peer = new Peer(undefined, {
    host: "geoorbit.onrender.com",  // Free public PeerJS server
    secure: true,
    port: 443,
    path: "/"
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
        connectToNewUser(userId, myStream);
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
    video.setAttribute("playsinline", true); // Prevent fullscreen on mobile
    
    video.addEventListener("loadedmetadata", () => {
        video.play();
        console.log(`▶️ Playing video for ${userId}`);
    });

    document.getElementById("video-grid").appendChild(video);

    // 🔥 Force reflow to ensure rendering
    videoGrid.style.display = "none";
    setTimeout(() => {
        videoGrid.style.display = "flex";
    }, 50);
    
    console.log(`📌 Total Videos: ${videoGrid.children.length}`);
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

// ✅ Mute / Unmute
function muteUnmute() {
    const enabled = myStream.getAudioTracks()[0].enabled;
    myStream.getAudioTracks()[0].enabled = !enabled;
}

// ✅ Video On / Off
function videoOnOff() {
    const enabled = myStream.getVideoTracks()[0].enabled;
    myStream.getVideoTracks()[0].enabled = !enabled;
}

// ✅ Share Screen
function shareScreen() {
    navigator.mediaDevices.getDisplayMedia({ video: true }).then((stream) => {
        console.log("📺 Screen sharing started");
        const screenVideo = document.createElement("video");
        addVideoStream(screenVideo, stream, "Screen");

        screenStream = stream;
        screenStream.getTracks()[0].onended = () => {
            console.log("❌ Screen sharing stopped");
            screenVideo.remove();
        };
    }).catch((err) => {
        console.error("❌ Error sharing screen:", err);
    });
}

// ✅ Copy Room Link
function copyRoomLink() {
    navigator.clipboard.writeText(window.location.href);
    alert("✅ Room link copied!");
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

// ✅ Toggle Chat
function toggleChat() {
    const chatContainer = document.getElementById("chat-container");
    chatContainer.style.display = chatContainer.style.display === "none" ? "block" : "none";
}

// ✅ Receive Chat Messages
socket.on("receive-message", ({ message, userId }) => {
    appendMessage(`<b>User ${userId}:</b> ${message}`);
});
