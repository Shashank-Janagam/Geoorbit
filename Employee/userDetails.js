// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut, sendPasswordResetEmail } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

// Firebase configuration
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
const db = getFirestore(app);

// Logout functionality
const logoutButton = document.getElementById('logoutButton');
logoutButton.addEventListener('click', async () => {
  try {
    await signOut(auth);
    console.log("User logged out.");
    sessionStorage.removeItem('userUID');
    window.location.href = "/index.html";
  } catch (error) {
    console.error("Logout failed:", error);
    alert("Logout failed. Try again.");
  }
});

// Password reset functionality
const resetPasswordButton = document.getElementById('reset');
resetPasswordButton.addEventListener('click', async (e) => {
  e.preventDefault();
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      alert("No user logged in.");
      return;
    }

    const company = sessionStorage.getItem('company');
    const dep = sessionStorage.getItem('dep');
    const userUID = sessionStorage.getItem('userUID');

    if (!company || !dep || !userUID) {
      alert("Session expired. Please log in again.");
      return;
    }

    const userRef = doc(db, `company/${company}/${dep}/${dep}/Employees`, userUID);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      alert("User data not found.");
      return;
    }

    const userData = userDoc.data();
    const email = userData.email;

    if (!email) {
      alert("Email not found.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      document.getElementById('sent').textContent = "Password reset link sent!";
    } catch (error) {
      console.error("Error sending reset email:", error);
      alert("Error: " + error.message);
    }
  });
});

// Fetch user data
async function fetchUserData() {
  const company = sessionStorage.getItem('company');
  const dep = sessionStorage.getItem('dep');
  const userUID = sessionStorage.getItem('userUID');

  if (!userUID) {
    alert("Please sign in.");
    window.location.href = "/index.html";
    return;
  }

  const pro = document.getElementById('profile');
  try {
    const userRef = doc(db, `company/${company}/${dep}/${dep}/Employees`, userUID);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      alert("User data not found.");
      return;
    }

    const userData = userDoc.data();
    const imgElement = document.getElementById('userPhoto');
    imgElement.src = userData.photoURL || "default-profile-pic.png";
    
    imgElement.onload = function () {
      imgElement.style.display = 'block';
      imgElement.style.opacity = 1;
    };

    document.getElementById("userName").innerText = userData.name || "Not provided";
    document.getElementById("userEmail").innerText = userData.email || "Not provided";
    document.getElementById("dob").innerText = "Date of birth: " + (userData.Dob || "Not provided");
    document.getElementById("userMobile").innerText = "Mobile: " + (userData.mobileNumber || "Not provided");
    document.getElementById('role').innerText = userData.Role || "";
    document.getElementById('company').innerText = userData.Company || "";
    document.getElementById('dep').innerText ="Department: " +userData.department || "";

    setTimeout(() => {
      pro.style.display = 'block';
      pro.style.opacity = 1;
    }, 475);
  } catch (error) {
    console.error("Error fetching user data:", error);
    alert("Failed to fetch user data.");
  }
}

// Call function to fetch user data
fetchUserData();
