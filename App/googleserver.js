// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getAuth, signOut,GoogleAuthProvider, signInWithPopup } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { getFirestore, doc, getDoc, collection, getDocs, query, where, setDoc, addDoc } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import * as faceapi from "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/+esm";

// Replace with your actual Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCib5ywnEJvXXIePdWeKZtrKMIi2-Q_9sM",
  authDomain: "geo-orbit-ed7a7.firebaseapp.com",
  databaseURL: "https://geo-orbit-ed7a7-default-rtdb.firebaseio.com",
  projectId: "geo-orbit-ed7a7",
  storageBucket: "geo-orbit-ed7a7.appspot.com",
  messagingSenderId: "807202826514",
  appId: "1:807202826514:web:5630f581f6f9dff46aebcb",
  measurementId: "G-H15DN69132"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app); // Initialize Firestore

// Function to generate a unique device identifier


// Function to handle Google Sign-In
async function handleSignIn() {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider); // Sign-in
    const user = result.user;

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
      const dep=cmpdata.department;

     sessionStorage.setItem('company',companyName);
     sessionStorage.setItem('dep',dep);

      const userRef = doc(db, `company/${companyName}/${dep}/${dep}/Employees`, user.uid);

      // Check if the user already exists in Firestore
      const userDoc = await getDoc(userRef);

      // Generate the current device ID

      if (userDoc.exists()) {
        // const biometricSuccess = await verifyBiometric();
    
        // if (!biometricSuccess) {
        //     alert("Biometric registration failed. Please try again.");
        //     return; // ❌ Prevent redirection if biometric fails
        //   }  
        const faceverify = await loginUser(user.uid);

        if (!faceverify) {
          // alert("Face registration failed. Please try again.");
          window.location.href="/index.html";
          return; // Stop execution if face registration fails
        }
        const userData = userDoc.data();
        console.log(userData.DeviceId);


      // Save UID in sessionStorage
      sessionStorage.setItem('userEmail', user.email);
      sessionStorage.setItem('userUID', user.uid);
      sessionStorage.setItem("lastAuthTime", Date.now()); // Update last authentication time

      window.location.href="/Employee/home.html";
    
     
      } else {
        const biometricSuccess = await registerBiometric();
    
        if (!biometricSuccess) {
            alert("Biometric registration failed. Please try again.");
            return; // ❌ Prevent redirection if biometric fails
          }                    // If the us
        // er is logging in for the first time, register their device
        
        const faceRegistered = await registerUser(user.uid);

          if (!faceRegistered) {
            alert("Face registration failed. Please try again.");
            return; // Stop execution if face registration fails
          }


        const userDetails = {
          name: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          EmployeeID: user.email.replace("@gmail.com", ""),
          Role: cmpdata.Role,
          Company: companyName,
          Dob:cmpdata.Dob,
          department:dep,
          mobileNumber:cmpdata.mobile, // Store the device ID
        };

        console.log("User not found in Firestore, saving details...");
        await setDoc(userRef, userDetails);
        console.log("User details saved to Firestore!");

        console.log("Login event recorded in Firestore.");

      // Save UID in sessionStorage
      sessionStorage.setItem('userEmail', user.email);

      sessionStorage.setItem('userUID', user.uid);
      sessionStorage.setItem("lastAuthTime", Date.now()); // Update last authentication time

      window.location.href = userDoc.exists() ? "/Employee/home.html" : "/Employee/userDetails.html";
      }

    

  
    }
    else if(!pmanagers.empty){


      console.log("Manager is allowed to log in.");

      const cmpref=doc(db,'allowedManagers',user.email.replace("@gmail.com",""));
                const cmpDoc=await getDoc(cmpref);
                const cmpdata=cmpDoc.data();
                const companyName=cmpdata.company;
                const dep=cmpdata.department;
                const userRef = doc(db, `company/${companyName}/${dep}/${dep}`);

      // Check if the user already exists in Firestore
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        const faceRegistered = await registerUser(user.uid);

          if (!faceRegistered) {
            alert("Face registration failed. Please try again.");
            return; // Stop execution if face registration fails
          }

 // If the user is logging in for the first time, register their device
        const userDetails = {
          name: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          EmployeeID: user.email.replace("@gmail.com", ""),
          Role: "Manager",
          Company: companyName,
          Dob:cmpdata.Dob,
          department:dep,
          mobileNumber:cmpdata.mobile, // Store the device ID
            };

        console.log("User not found in Firestore, saving details...");
        await setDoc(userRef, userDetails);
        console.log("User details saved to Firestore!");
        
        sessionStorage.setItem('userEmail', user.email);
        sessionStorage.setItem('company',companyName);
        sessionStorage.setItem('dep',dep);

  
        sessionStorage.setItem('userUID', user.uid);
        window.location.href = "/Manager/mhome.html";
        
      }else{
        // / Log successful login in Firestore
        const faceverify = await loginUser(user.uid);

        if (!faceverify) {
          // alert("Face registration failed. Please try again.");
          window.location.href="/index.html";
          return; // Stop execution if face registration fails
        }
      // Save UID in sessionStorage
      sessionStorage.setItem('userEmail', user.email);
      sessionStorage.setItem('company',companyName);
      sessionStorage.setItem('dep',dep);


      sessionStorage.setItem('userUID', user.uid);
      window.location.href = "/Manager/mhome.html";
      sessionStorage.setItem("lastAuthTime", Date.now()); // Update last authentication time

      }

       


      


    }
     else {
      console.error("User is not in the allowedUsers collection.");
      window.location.href = "notuser.html"; // Redirect to a page indicating the user is not allowed
    }

  } catch (error) {
    console.error("Error during sign-in:", error);
    alert(error);
    window.location.href = "/index.html"; // Redirect to login page in case of error
  }
}

// Trigger the function on page load
window.onload = () => {
  setTimeout(() => {
    handleSignIn();
  }, 500); // Delay for 1 second
};


async function registerBiometric() {
  if (!window.PublicKeyCredential) {
      alert("WebAuthn is not supported in this browser.");
      return false;
  }

  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);

  const options = {
      publicKey: {
          challenge: challenge,
          rp: { name: "GeoOrbit" },
          user: {
              id: new Uint8Array(16), // Must be consistent
              name: auth.currentUser ? auth.currentUser.email : "guest",
              displayName: auth.currentUser ? auth.currentUser.displayName : "Guest User"
          },
          pubKeyCredParams: [{ type: "public-key", alg: -7 }], // ECDSA with SHA-256
          authenticatorSelection: {
              authenticatorAttachment: "platform",
              userVerification: "required"
          },
          timeout: 60000,
      }
  };

  try {
      const credential = await navigator.credentials.create(options);
      if (!credential) {
          alert("Failed to create credential.");
          return false;

      }

      const credentialID = btoa(String.fromCharCode(...new Uint8Array(credential.rawId))); // Convert to base64
      console.log("Credential ID:", credentialID);

      // ✅ Store the credential ID in Firestore
      const userRef = doc(db, "biometricData", auth.currentUser.uid);
      await setDoc(userRef, { credentialID: credentialID });

      // alert("Biometric registered successfully!");
      return true;
  } catch (error) {
      console.error("Error during biometric registration:", error);
      alert("Biometric registration failed.");
      return false;
  }
}

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
      // window.location.href = "/Employee/home.html";
      //       //  ✅ Redirect after success
      sessionStorage.setItem("lastAuthTime", Date.now()); // Update last authentication time
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









//Face DEtection

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

// Register 
async function registerUser(id) {

  console.log("Registering user:", id);
  statusText.style.display="block";
  statusText.innerText = "Smile for registration!";
  
  let smileDetected = await detectExpression("happy");

  while (!smileDetected) {
    console.log("Smile not detected. Waiting...");
    statusText.innerText = "Smile not detected. Try again!";
    smileDetected = await detectExpression("happy");
  }

  console.log("Smile detected!");

  let detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

  while (!detection) {
    console.log("No face detected. Trying again...");
    statusText.innerText = "No face detected. Try again!";
    detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();
  }

  console.log("Face detected:", detection);

  try {
    await setDoc(doc(db, "face", id), {
      name: id,
      faceDescriptor: Array.from(detection.descriptor)
    });
    console.log("✅ Face registered in Firestore!");
    // alert("Registered in Firestore");
    return true;
  } catch (error) {
    console.error("❌ Error saving to Firestore:", error);
    alert("Error saving face data!");
    return false;
  }
}
async function loginUser(id) {
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
