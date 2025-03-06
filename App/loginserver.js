// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getAuth,signOut, signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import { sendPasswordResetEmail } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import * as faceapi from "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/+esm";


// Replace with your actual Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCib5ywnEJvXXIePdWeKZtrKMIi2-Q_9sM",
  authDomain: "geo-orbit-ed7a7.firebaseapp.com",
  databaseURL: "https://geo-orbit-ed7a7-default-rtdb.firebaseio.com",
  projectId: "geo-orbit-ed7a7",
  storageBucket: "geo-orbit-ed7a7.firebasestorage.app",
  messagingSenderId: "807202826514",
  appId: "1:807202826514:web:5630f581f6f9dff46aebcb",
  measurementId: "G-H15DN69132"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app); // Initialize Firestore

const fixedFontList = [
  "Arial", "Verdana", "Courier New", "Georgia", "Times New Roman", "Tahoma", "Trebuchet MS"
];

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

// Canvas Fingerprinting
function generateCanvasFingerprint() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = "top";
  ctx.font = "14px 'Arial'";
  ctx.fillText('Hello World!', 2, 2);
  const data = canvas.toDataURL();
  return hashString(data);
}

// WebGL Fingerprinting
function getWebGLFingerprint() {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
  const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
  return hashString(renderer + vendor);
}

// Gathering all data for fingerprint
function generateFingerprint() {
  const userAgent = navigator.userAgent;
  const platform = navigator.platform;
  const screenRes = `${screen.width}x${screen.height}`;
  const fonts = fixedFontList.join(','); // Use the fixed font list
  const canvasFingerprint = generateCanvasFingerprint();
  const webglFingerprint = getWebGLFingerprint();

  const fingerprintData = `${userAgent}-${platform}-${screenRes}-${fonts}-${canvasFingerprint}-${webglFingerprint}`;
  return hashString(fingerprintData);
}

// Manual Sign-In
const signinButton = document.getElementById('signinButton');
if (signinButton) {
  signinButton.addEventListener('click', async (e) => { // Make the event listener function async
    e.preventDefault(); // Prevent default form submission
  
    const emailInput = document.getElementById('signinEmail');
    const passwordInput = document.getElementById('signinPassword');
    const email = emailInput.value;
    const password = passwordInput.value;

    const triggerShake = (input) => {
      input.classList.remove('shake');
      void input.offsetWidth; // Trigger a reflow
      input.classList.add('shake');
    };
  
    if (!email || !password) {
      triggerShake(emailInput);
      triggerShake(passwordInput);
      return;
    }
  
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password); // Use await here
      const user = userCredential.user;
      console.log(user);
         // Query the allowedUsers collection for the authenticated user's UID
         const allowedUsersRef = collection(db, 'allowedUsers');
         const allowedmanagerRef=collection(db,'allowedManagers');
     
         const q = query(allowedUsersRef, where('uid', '==', user.email.replace("@gmail.com", "")));
         const p = query(allowedmanagerRef, where('uid','==', user.email.replace("@gmail.com","")));
         const querySnapshot = await getDocs(q);
         const pmanagers= await getDocs(p);
     
         if (!querySnapshot.empty) { // If user UID exists in allowedUsers
           console.log("User is allowed to log in.");
     
           const cmpref=doc(db,'allowedUsers',user.email.replace("@gmail.com",""));
          const cmpDoc=await getDoc(cmpref);
          const cmpdata=cmpDoc.data();
          const companyName=cmpdata.company;
           const userRef = doc(db, `company/${companyName}/users`, user.uid);
           sessionStorage.setItem('company',companyName);

           // Check if the user already exists in Firestore
           const userDoc = await getDoc(userRef);
     
           
                 if (userDoc.exists()) {
                  const faceverify = await loginUser(user.uid);

                  if (!faceverify) {
                    // alert("Face registration failed. Please try again.");
                    window.location.href="/index.html";
                    return; // Stop execution if face registration fails
                  }
                   const userData = userDoc.data();
                   const finger=generateFingerprint();
                   console.log(finger);
                   console.log(userData.DeviceId);
           if(userData.DeviceId!=finger){
           
        
             
               console.log("Not a registered device"      );
           
                 // window.location.href="/invalidDevice.html";
                 const dev=false;
                 sessionStorage.setItem('rdevice',dev);
                 sessionStorage.setItem('userUID', user.uid);
                 sessionStorage.setItem('userEmail', user.email);
                 window.location.href="/Employee/home.html";
           
           
           
               }else{
                 console.log("Login event recorded in Firestore.");
           
                 // Save UID in sessionStorage
                 sessionStorage.setItem('userEmail', user.email);
                 const dev=true;
                 sessionStorage.setItem('rdevice',dev);
                 sessionStorage.setItem('userUID', user.uid);
                 window.location.href="/Employee/home.html";
               }
                
                 } 
           
         }
         else if(!pmanagers.empty){
     
           console.log("Manager is allowed to log in.");
           const faceverify = await loginUser(user.uid);

           if (!faceverify) {
             // alert("Face registration failed. Please try again.");
             window.location.href="/index.html";
             return; // Stop execution if face registration fails
           }
           const cmpref=doc(db,'allowedManagers',user.email.replace("@gmail.com",""));
          const cmpDoc=await getDoc(cmpref);
          const cmpdata=cmpDoc.data();
          const companyName=cmpdata.company;
           sessionStorage.setItem('company',companyName);
          
           
           // Save UID in sessionStorage
           sessionStorage.setItem('userUID', user.uid);
           window.location.href = "/Manager/mhome.html";
           

           
     
            
           
     
           
     
     
         }
          else {
           console.error("User is not in the allowedUsers collection.");
           window.location.href = "notuser.html"; // Redirect to a page indicating the user is not allowed
         }
    } catch (error) {
      console.error("Error during sign-in:", error);
      const errorCode = error.code;
  
      // Trigger shake effect on incorrect input fields
      if (errorCode === 'auth/invalid-email') {
        triggerShake(emailInput);
      } else if (errorCode === 'auth/wrong-password') {
        triggerShake(passwordInput);
      } else {
        console.error(`Error: ${error.message}`);
        triggerShake(passwordInput);


      }
    }
  });
  
} else {
  console.error("Sign-In button not found in the DOM.");
}



const resetPasswordButton = document.getElementById('forget');

resetPasswordButton.addEventListener('click', async (e) => {
  e.preventDefault();

  const emailInput = document.getElementById('signinEmail');
  const email = emailInput.value;

  const triggerShake = (input) => {
    input.classList.remove('shake');
    void input.offsetWidth; // Trigger a reflow
    input.classList.add('shake');
  };

  if (!email) {
    alert("Please enter your registered email.");
    triggerShake(emailInput);
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    alert("Password reset link sent to your email!");
  } catch (error) {
    console.error("Error sending password reset email:", error);
    const errorCode = error.code;

    if (errorCode === 'auth/user-not-found') {
      alert("No account found with this email.");
    } else if (errorCode === 'auth/invalid-email') {
      alert("Invalid email address. Please check and try again.");
      triggerShake(emailInput);
    } else {
      alert(`Error: ${error.message}`);
    }
  }
});

async function verifyBiometric() {
  if (!window.PublicKeyCredential) {
      alert("WebAuthn is not supported in this browser.");
      return false;
  }

  const user = auth.currentUser;
  if (!user) {
      alert("User is not authenticated.");
      return false;
  }

  // 🔍 Fetch the stored credential ID from Firestore
  const userRef = doc(db, "biometricData", user.uid);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
      alert("No biometric data found. Please register first.");
      logout();
      window.location.href="/index.html";
      return false;
  }

  const storedCredentialID = userDoc.data().credentialID;
  console.log("Stored Credential ID:", storedCredentialID);

  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);

  const options = {
      publicKey: {
          challenge: challenge,
          allowCredentials: [{
              id: Uint8Array.from(atob(storedCredentialID), c => c.charCodeAt(0)), // Convert back from base64
              type: "public-key"
          }],
          timeout: 60000,
          userVerification: "required"
      }
  };

  try {
      const assertion = await navigator.credentials.get(options);
      if (!assertion) {
          alert("Authentication failed.");
          logout();
          window.location.href="/index.html";
          return false;
      }

      const assertionID = btoa(String.fromCharCode(...new Uint8Array(assertion.rawId))); // Convert assertion ID to base64
      console.log("Assertion ID:", assertionID);

      // ✅ Check if the assertion ID matches the stored credential ID
      if (assertionID !== storedCredentialID) {
          alert("Unauthorized biometric detected! Stored ID and assertion ID do not match.");
          logout();
          window.location.href="/index.html";
          return false;
      }

      console.log("Biometric verification successful!");
      sessionStorage.setItem("lastAuthTime", Date.now()); // Update last authentication time
      window.location.href = "/Employee/home.html"; // ✅ Redirect after success
      return true;
  } catch (error) {
      console.error("Biometric authentication failed:", error);
      alert("Biometric authentication failed. Please try again.");
      logout();
      window.location.href="/index.html";
      return false;
  }
}
async function logout(){
try {
    await signOut(auth); // Sign out the user
    console.log("User successfully logged out.");
    
    // Clear sessionStorage
    sessionStorage.removeItem('userUID');
    
    // Redirect to the login page
    window.location.href = "/index.html";
  } catch (error) {
    console.error("Error during logout:", error);
    alert("Logout failed. Please try again.");
  }
}

const video = document.getElementById("video");
const statusText = document.getElementById("status");
async function startCamera() {
  try {
      const constraints = { 
          video: { 
              facingMode: "user", // Use "environment" for the back camera
              width: { ideal: 640 },
              height: { ideal: 480 }
          }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      video.srcObject = stream;

      // Ensure video plays on mobile
      video.onloadedmetadata = () => {
          video.play().catch(err => console.error("Autoplay error:", err));
      };

  } catch (err) {
      console.error("Camera error:", err);
      alert("Camera access is blocked! Please enable camera permissions.");
  }
}
// Load Face API Models from CDN
async function loadModels() {
    const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/";

    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
    await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL); // Load expressions model

    console.log("✅ Face API models loaded successfully!");
}

// Detect facial expression (smile)
async function detectExpression(requiredExpression) {
    for (let i = 0; i < 10; i++) {
        const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceExpressions();

        if (detection && detection.expressions[requiredExpression] > 0.7) {
            return true;
        }
        await new Promise(resolve => setTimeout(resolve, 300)); // Wait for 300ms
    }
    return false;
}


async function loginUser(id) {
  document.getElementById("lll").style.display="none";
   document.getElementById("mmm").style.display="flex";
  statusText.style.display = "block";
  statusText.innerText = "Show any valid expression to login!";

  const validExpressions = ["happy", "surprised", "neutral"];
  let expressionDetected = false;

  // Keep checking for a valid expression
  while (!expressionDetected) {
      for (const expression of validExpressions) {
          if (await detectExpression(expression)) {
              expressionDetected = true;
              break;  // Exit loop if any expression is detected
          }
      }
      if (!expressionDetected) {
          statusText.innerText = "No valid expression detected. Try again!";
      }
  }

  statusText.innerText = "Expression detected! Now verifying face...";

  let detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

  while (!detection) {
      statusText.innerText = "No face detected. Try again!";
      detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptor();
  }

  const descriptor = detection.descriptor;

  // Fetch user data from Firestore
  const userDoc = await getDoc(doc(db, "face", id));

  if (!userDoc.exists()) {
      alert("Face ID Not registered");
      return false;
  }

  const data = userDoc.data();
  if (!data.faceDescriptor) {
      statusText.innerText = "No face data found for user!";
      return false;
  }

  const storedDescriptor = new Float32Array(data.faceDescriptor);
  const distance = faceapi.euclideanDistance(descriptor, storedDescriptor);

  if (distance < 0.6) {
      statusText.innerText = "Login Successful! Welcome";
      return true;
  } else {
      statusText.innerText = "Face not recognized!";
      return false;
  }
}

// Initialize everything
loadModels().then(startCamera);