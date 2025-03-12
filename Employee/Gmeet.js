import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { getFirestore, collection,addDoc, query,updateDoc, where, getDocs, doc, getDoc, orderBy } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

// 🚀 Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCib5ywnEJvXXIePdWeKZtrKMIi2-Q_9sM",
    authDomain: "geo-orbit-ed7a7.firebaseapp.com",
    projectId: "geo-orbit-ed7a7",
    storageBucket: "geo-orbit-ed7a7.firebasestorage.app",
    messagingSenderId: "807202826514",
    appId: "1:807202826514:web:5630f581f6f9dff46aebcb",
    measurementId: "G-H15DN69132"
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 🔹 Get Logged-in User Info
const company = sessionStorage.getItem('company');
const userUID = sessionStorage.getItem('userUID');
const dep = sessionStorage.getItem('dep');

// ✅ Redirect if User is Not Logged In
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        alert("User not authenticated! Redirecting...");
        window.location.href = "/index.html";
    } else {
        console.log("User is signed in:", user.uid);
        listenForMeetingUpdates();
        // fetchActiveMeetings();

    }
});

// ✅ Fetch Active Meetings
// ✅ Fetch Active Meetings
const userRef = doc(db, `company/${company}/${dep}/${dep}/Employees`, userUID);
const userDoc = await getDoc(userRef);
var userData = userDoc.data();
async function fetchActiveMeetings() {
    if (!company || !userUID) {
        alert("Invalid session! Redirecting...");
        window.location.href = "/index.html";
        return;
    }

    const historyContainer = document.getElementById('aa');
    historyContainer.innerHTML="";

    try {
        // 🔹 Query only active meetings (Status = "true"), ordered by date
        const meetsRef = collection(db, `company/${company}/${dep}/${dep}/Gmeet`);
        const q = query(meetsRef, where("Status", "==", "true"), orderBy("date", "desc"));
        const querySnapshot = await getDocs(q);
        let count=true;

        if (querySnapshot.empty) {
            // alert('No active meetings found.');
            document.getElementById('a').style.color="orange";

            document.getElementById('a').innerHTML="No Active Meetings";
            // console.log("no meeting");
            return;
        }
        document.getElementById('a').style.color="black";

            document.getElementById('a').innerHTML="Active Meetings";


        querySnapshot.forEach(docSnap => {
            const meetData = docSnap.data();
            const meetId = docSnap.id; // Get document ID to update later

            console.log(meetData);
            const { link, purpose, createdBy, date,empuid ,members,role} = meetData;
            if (!members || !members[userData.EmployeeID]) {
                return; // 🚀 Skip this iteration
            }

            // ✅ Format Date & Time
            let formattedDateTime = "N/A";
            if (date && date.seconds) { // Check if timestamp exists
                formattedDateTime = new Date(date.seconds * 1000).toLocaleString(); // Convert to readable format
            }

            // 🔹 Create Meeting Card
            let meetingDiv = document.createElement("div");
            meetingDiv.classList.add("meeting-card");
            let end="none";
            if(empuid==userUID){
                end="block";
            }
            count=false;

            meetingDiv.innerHTML = `
               <div class="meeting-header">
        <div class="creator-info">
            <p class="label">Created By:</p>
            <p class="creator-name">${createdBy}</p>
            <p class="creator-role">${role}</p>
        </div>
    </div>

    <div class="meeting-body">
        <p><span>📌 Purpose:</span> ${purpose}</p>
        <p><span>📅 Created On:</span> ${formattedDateTime}</p>
    </div>

    <div class="meeting-footer">
        <button class="join-btn" onclick="window.open('${link}', '_blank', 'noopener,noreferrer')">
            🚀 Join Meeting
        </button>
        <button class="end-btn" data-id="${meetId}" style="display:${end}">
            ❌ End Meeting
        </button>
    </div>
            `;
            
            // 🔹 Append to container
            historyContainer.appendChild(meetingDiv);
        });
        document.querySelectorAll(".end-btn").forEach(btn => {
            btn.addEventListener("click", function () {
                let meetId = this.getAttribute("data-id");
                endMeeting(meetId);
            });
        });
        if(count){
            document.getElementById('a').style.color="orange";

            document.getElementById('a').innerHTML="No Active Meetings";
        }
    } catch (error) {
        console.error("Error fetching meetings:", error);
        alert("Error fetching active meetings.");
    }
}
const instantMeetingBtn = document.getElementById('instant');
const selectMembersModal = document.getElementById("selectMembersModal");
const confirmMembersBtn = document.getElementById("confirmMembersBtn");
let selectedEmployees = new Set(); // Store selected employee IDs

instantMeetingBtn.addEventListener("click", () => {


    // Open the modal to select members
    selectMembersModal.style.display = "block";
    loadEmployeeList();
});
let membersObj = {};

// Wait for confirmation before creating the meeting
confirmMembersBtn.addEventListener("click", async () => {
    selectMembersModal.style.display = "none";

    console.log(selectedEmployees);
    if (selectedEmployees.size === 0) {
        alert("Select at least one employee for the meeting.");
        return;
    }

    // ✅ Convert selected employees into an object & add creator
    selectedEmployees.forEach(empID => {
        membersObj[empID] = true;
    });

    const mref = doc(db, `company/${company}/${dep}/${dep}`);
    const mdoc = await getDoc(mref);
    var mdata = mdoc.data();
    membersObj[userData.EmployeeID] = true;
    membersObj[mdata.EmployeeID] = true;

    // ✅ Open the Google Meet page
    let newMeetWindow = window.open("https://meet.google.com/new", '_blank', 'noopener,noreferrer');

    // ✅ Display the meeting link modal after confirming members
    document.getElementById("meetLinkModal").style.display = "block";
});

// ✅ Event listener for saving the Google Meet link
document.getElementById("saveMeetLinkBtn").addEventListener("click", async () => {
    let meetUrl = document.getElementById("meetLinkInput").value.trim();

    if (!meetUrl || !meetUrl.includes("meet.google.com")) {
        alert("Please enter a valid Google Meet link.");
        return;
    }

    try {
        await addDoc(collection(db, `company/${company}/${dep}/${dep}/Gmeet`), {
            link: meetUrl,
            createdBy: auth.currentUser.displayName,
            date: new Date(),
            Status: "true",
            purpose: document.getElementById("textmessage").value.trim(),
            empuid: userUID,
            members: membersObj,
            role: userData.Role, 
        });

        // ✅ Clear input fields
        document.getElementById("textmessage").value = "";
        selectedEmployees.clear();
        document.getElementById("selectMembersModal").style.display = "none";
        document.getElementById("meetLinkModal").style.display = "none";

    } catch (error) {
        console.error("Error saving Meet link:", error);
    }
});


async function loadEmployeeList() {
    try {
        const employeeListContainer = document.getElementById("employeeList");
        employeeListContainer.innerHTML = ""; // Clear previous data

        const usersCollection = collection(db, `company/${company}/${dep}/${dep}/Employees`);
        const querySnapshot = await getDocs(usersCollection);

        querySnapshot.forEach(docSnap => {
            const employeeData = docSnap.data();
            const empID = employeeData.EmployeeID;

            if (docSnap.id !== userUID) {
                // ✅ Create employee selection card
                let card = document.createElement("div");
                card.classList.add("employee-card");
                card.dataset.id = empID; // Store employee ID

                let img = document.createElement("img");
                img.src = employeeData.photoURL || "default-profile.png"; 
                img.alt = `${employeeData.name}'s photo`;
                img.classList.add("employee-photo");

                let nameContainer = document.createElement("div");
                nameContainer.classList.add("employee-info");

                let name = document.createElement("p");
                name.textContent = employeeData.name;
                name.classList.add("employee-name");

                let role = document.createElement("p");
                role.textContent = employeeData.Role;
                role.classList.add("employee-role");

                nameContainer.appendChild(name);
                nameContainer.appendChild(role);
                card.appendChild(img);
                card.appendChild(nameContainer);
                employeeListContainer.appendChild(card);

                // ✅ Click event to select/deselect employee
                card.addEventListener("click", function () {
                    if (selectedEmployees.has(empID)) {
                        selectedEmployees.delete(empID);
                        card.classList.remove("selected");
                    } else {
                        selectedEmployees.add(empID);
                        card.classList.add("selected");
                    }
                });
            }
        });
    } catch (error) {
        console.error("Error fetching employees:", error);
    }
}


  
  async function endMeeting(meetId) {
    // alert(meetId);
    if (confirm("Are you sure you want to end this meeting?\nAfter Ending the meeting in orbit the meeting may still alive in Google meet")) {
        try {
            const meetDocRef = doc(db, `company/${company}/${dep}/${dep}/Gmeet`, meetId);
            await updateDoc(meetDocRef, { Status: "false" });
            // alert("Meeting ended successfully.");
            fetchActiveMeetings(); // Refresh meetings list
        } catch (error) {
            console.error("Error ending meeting:", error);
            alert("Error ending the meeting.");
        }
    }
}

import { onSnapshot } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

function listenForMeetingUpdates() {
    if (!company || !userUID) {
        alert("Invalid session! Redirecting...");
        window.location.href = "/index.html";
        return;
    }

    const meetsRef = collection(db, `company/${company}/${dep}/${dep}/Gmeet`);
    const q = query(meetsRef, where("Status", "==", "true"));

    onSnapshot(q, (querySnapshot) => {
        console.log("Database updated! Fetching latest meetings...");
        fetchActiveMeetings(); // ✅ Instead of refreshing, update the meetings list
    }, (error) => {
        console.error("Error listening to meetings:", error);
    });
}

// ✅ Call it on page load
// 🔹 Open & Close Modal

document.querySelector(".close").addEventListener("click", () => {
    document.getElementById("selectMembersModal").style.display = "none";
});

// 🔹 Load Employees with Checkboxes

// 🔹 Get Selected Members

