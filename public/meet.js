const BACKEND_URL = "https://geoorbit.netlify.app"; // ✅ Proxy WebSocket via Netlify

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
            const call = peer.call(userId, myStream);
            const video = document.createElement("video");

            call.on("stream", (userStream) => {
                addVideoStream(video, userStream, userId);
            });

            call.on("close", () => {
                video.remove();
            });

            peers[userId] = call;
        }, 1000);
    });
});

// ✅ Handle Disconnection
socket.on("user-disconnected", (userId) => {
    if (peers[userId]) peers[userId].close();
});

// ✅ Helper Function: Add Video Stream
function addVideoStream(video, stream, userId) {
    video.srcObject = stream;
    video.addEventListener("loadedmetadata", () => {
        video.play();
    });
    document.getElementById("video-grid").append(video);
}
