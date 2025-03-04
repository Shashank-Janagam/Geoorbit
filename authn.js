// Import Firebase modules
import { initializeApp, getApps,getApp} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getAuth,onAuthStateChanged ,signOut,GoogleAuthProvider, signInWithPopup } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { getFirestore, doc, getDoc, collection, getDocs, query, where, setDoc, addDoc } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
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
console.log("Working");
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app); // Initialize Firestore

let currentUser = null;  // Store the authenticated user

// ✅ Listen for authentication state
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User authenticated:", user.uid);
        currentUser = user; // Store the authenticated user
        checkAndAuthenticate(); // Run biometric check after login
    } else {
        console.error("User not authenticated. Redirecting to login.");
        window.location.href = "/index.html"; // Redirect to login page
    }
});

function checkAndAuthenticate() {
    if (!currentUser) return; // Don't run if user is not authenticated

    const lastAuthTime = sessionStorage.getItem("lastAuthTime");
    const currentTime = Date.now();
    
    if (!lastAuthTime || (currentTime - lastAuthTime) > 300000) {  
        console.log("Running biometric check...");
        verifyBiometric().then(success => {
            if (success) {
                sessionStorage.setItem("lastAuthTime", Date.now()); // ✅ Update on success
            }
        });
    }
}

setInterval(checkAndAuthenticate, 20000);



async function verifyBiometric() {
  if (!window.PublicKeyCredential) {
      alert("WebAuthn is not supported in this browser.");
      return false;
  }

  const user = auth.currentUser;
  if (!user) {
      console.log("User is not authenticated.");
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
          console.log("Authentication failed.");
          logout();
          window.location.href="/index.html";
          return false;
      }

      const assertionID = btoa(String.fromCharCode(...new Uint8Array(assertion.rawId))); // Convert assertion ID to base64
      console.log("Assertion ID:", assertionID);

      // ✅ Check if the assertion ID matches the stored credential ID
      if (assertionID !== storedCredentialID) {
          console.log("Unauthorized biometric detected! Stored ID and assertion ID do not match.");
          logout();
          window.location.href="/index.html";
          return false;
      }

      console.log("Biometric verification successful!");
      //  ✅ Redirect after success
      sessionStorage.setItem("lastAuthTime", Date.now()); // Update last authentication time
      return true;
  } catch (error) {
      console.error("Biometric authentication failed:", error);
      console.log("Biometric authentication failed. Please try again.");
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
    console.log("Logout failed. Please try again.");
  }
}