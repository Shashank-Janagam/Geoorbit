
// 🔥 Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCib5ywnEJvXXIePdWeKZtrKMIi2-Q_9sM",
    authDomain: "geo-orbit-ed7a7.firebaseapp.com",
    databaseURL: "https://geo-orbit-ed7a7-default-rtdb.firebaseio.com",
    projectId: "geo-orbit-ed7a7",
    storageBucket: "geo-orbit-ed7a7.firebasestorage.app",
    messagingSenderId: "807202826514",
    appId: "1:807202826514:web:5630f581f6f9dff46aebcb",
    measurementId: "G-H15DN69132"
  };// 📌 Import Firebase Modules// 📌 Import Firebase Modules// 📌 Import Firebase Modules// 📌 Import Firebase Modules
  // 📌 Import Firebase Modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, doc, setDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 🎥 Camera & Canvas Setup
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
// Attach startCamera to window to make it accessible globally
window.startCamera = async function () {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        document.getElementById("video").srcObject = stream;
        console.log("✅ Camera started successfully.");
    } catch (err) {
        alert("❌ Camera access denied! Please allow camera permissions.");
        console.error(err);
    }
};

// Ensure the function is available globally
console.log("✅ face.js loaded, startCamera function is now available.");

// ✅ Detect Face & Extract Features using OpenCV.js
async function captureFace() {
    return new Promise((resolve, reject) => {
        try {
            // Draw video frame on canvas
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            let src = cv.imread(canvas); // Read from canvas
            let gray = new cv.Mat();
            cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0); // Convert to grayscale

            // Load face cascade model
            let faceCascade = new cv.CascadeClassifier();
            faceCascade.load('haarcascade_frontalface_default.xml');

            let faces = new cv.RectVector();
            let msize = new cv.Size(200, 200);
            faceCascade.detectMultiScale(gray, faces, 1.1, 3, 0, msize, msize);

            if (faces.size() === 0) {
                reject("No face detected. Please try again.");
                return;
            }

            // Extract face region
            let face = faces.get(0);
            let roi = gray.roi(face);
            let resizedFace = new cv.Mat();
            cv.resize(roi, resizedFace, new cv.Size(100, 100));

            let faceData = resizedFace.data; // Convert to feature vector
            resolve(Array.from(faceData)); // Return as array

            // Cleanup
            src.delete();
            gray.delete();
            roi.delete();
            resizedFace.delete();
        } catch (err) {
            reject(err);
        }
    });
}

// 👤 Register New User
document.getElementById("registerBtn").addEventListener("click", async () => {
    try {
        const username = document.getElementById("username").value.trim();
        if (!username) return alert("⚠️ Please enter your name.");

        const faceDescriptor = await captureFace();
        if (!faceDescriptor) return;

        await setDoc(doc(collection(db, "users"), username), { faceData: faceDescriptor });
        alert("✅ Registration Successful!");
    } catch (err) {
        alert("❌ Error: " + err);
    }
});

// 🔑 Login User
document.getElementById("loginBtn").addEventListener("click", async () => {
    try {
        const detectedDescriptor = await captureFace();
        if (!detectedDescriptor) return;

        const usersSnapshot = await getDocs(collection(db, "users"));

        let matchedUser = null;
        usersSnapshot.forEach((doc) => {
            const savedDescriptor = doc.data().faceData;
            const distance = euclideanDistance(savedDescriptor, detectedDescriptor);
            if (distance < 1000) { // Threshold for match
                matchedUser = doc.id;
            }
        });

        if (matchedUser) {
            alert(`✅ Login Successful! Welcome, ${matchedUser}`);
        } else {
            alert("❌ Face not recognized. Please register first.");
        }
    } catch (err) {
        alert("❌ Error: " + err);
    }
});

// ✅ Euclidean Distance Function
function euclideanDistance(arr1, arr2) {
    let sum = 0;
    for (let i = 0; i < arr1.length; i++) {
        sum += (arr1[i] - arr2[i]) ** 2;
    }
    return Math.sqrt(sum);
}

// Ensure OpenCV is ready before calling cv.imread()
function waitForOpenCV(callback) {
    if (typeof cv !== "undefined" && cv.getBuildInformation) {
        callback(); // OpenCV is ready, proceed
    } else {
        console.warn("⏳ Waiting for OpenCV.js to initialize...");
        setTimeout(() => waitForOpenCV(callback), 500); // Retry every 500ms
    }
}

// ✅ Capture Face (Ensures OpenCV is Loaded First)
async function captureFace() {
    return new Promise((resolve, reject) => {
        waitForOpenCV(() => {
            try {
                // Draw video frame on canvas
                let canvas = document.getElementById("canvas");
                let ctx = canvas.getContext("2d");
                ctx.drawImage(document.getElementById("video"), 0, 0, canvas.width, canvas.height);

                // Read from canvas using OpenCV
                let src = cv.imread(canvas); // Ensure OpenCV is ready before calling this
                let gray = new cv.Mat();
                cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);

                // Face detection
                let faceCascade = new cv.CascadeClassifier();
                faceCascade.load('haarcascade_frontalface_default.xml');

                let faces = new cv.RectVector();
                let msize = new cv.Size(200, 200);
                faceCascade.detectMultiScale(gray, faces, 1.1, 3, 0, msize, msize);

                if (faces.size() === 0) {
                    reject("No face detected. Try again.");
                    return;
                }

                // Extract the detected face
                let face = faces.get(0);
                let roi = gray.roi(face);
                let resizedFace = new cv.Mat();
                cv.resize(roi, resizedFace, new cv.Size(100, 100));

                let faceData = resizedFace.data; // Convert to feature vector
                resolve(Array.from(faceData));

                // Cleanup
                src.delete();
                gray.delete();
                roi.delete();
                resizedFace.delete();
            } catch (err) {
                reject(err);
            }
        });
    });
}

