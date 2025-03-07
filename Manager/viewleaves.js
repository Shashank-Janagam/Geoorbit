// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { getFirestore, collection,addDoc,query, where, orderBy,getDocs,getDoc } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import { doc, setDoc } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

// Replace with your Firebase configuration
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

// // // Check if the user is authenticated
// onAuthStateChanged(auth, async (user) => {
//     if (!user) {
//       alert("Access Denied. Please log in.");
//       window.location.href = "/index.html"; // Redirect to login page
//     }
//     alert(user);
// });
// Check if user is authenticated
// Get userEmail from sessionStorage
const userUID=sessionStorage.getItem('userUID');
const company=sessionStorage.getItem('company');
const dep=sessionStorage.getItem('dep');
 console.log(company);
 if(!userUID){
    alert("Access Denied. Please log in.");
      window.location.href = "/index.html"; 

 }
 const cuser =doc(db,`company/${company}/managers`,userUID);
 const cuserdata=await getDoc(cuser);
 if(!cuserdata.exists()){
    // alert("Your are Not Authorized to Access this page");
    window.location.href = "../Employee/home.html"; 

 }

const userEmail=sessionStorage.getItem('userEmail')


try{
const leaves = collection(db, `company/${company}/${dep}/${dep}/Leave_Approvals`);
const querySnapshot = await getDocs(leaves);
if (!querySnapshot.empty) {
    console.log(doc);
    const history=document.getElementById('requests');
     // Assume the first result is the correct one
    // Display the selected employee's details in the profile form
    querySnapshot.forEach(doc=>{
        const leavedata=doc.data();
        const Date=leavedata.Date;
        const reason=leavedata.Reason;
        const status=leavedata.Status;
        const dateArray=leavedata.SelectedDates;
        let dateDiv = document.createElement("div");
        dateDiv.classList.add("leaves");
        if(status=="false"){
            dateDiv.style.backgroundColor="rgb(248, 221, 188)";
       
        let state=null;
        if(status=="true"){
            state="Approved";
        }else if(status=="false"){
            state="Pending";
        }else{
            state="Declined";
        }
        let leaveDetailsHTML = `
    <div class="leave-details" onclick="displayreq('${doc.id}')">
            <p class="name"><strong>EmployeeID: ${leavedata.EmployeeID}</strong></p>
            <p class="rdate"><strong>Requested on: ${Date}</strong></p>
            <p class="status"><strong>Status: ${state}</strong></p>
        </div>
        <div class="dates-section">
        </div>
    `;
    
    


    
    dateDiv.innerHTML = leaveDetailsHTML;
        // Append to selected dates container inside leavedet
        history.appendChild(dateDiv);

    }   

    });
  } else {
    document.getElementById("fell").style.display="block";
    document.getElementById("fell").innerHTML="No Leave Records";


  }


}catch(error){
    alert(error);
}

window.displayreq = async function (id) {
    const leaves1 = doc(db, `company/${company}/${dep}/${dep}/Leave_Approvals`, id);
    
         

    try {
        const leave = await getDoc(leaves1);

        if (leave.exists()) {
            document.getElementById('eachreq').style.display="block";
            const leavedata = leave.data();
            const dateArray = leavedata.SelectedDates;

            console.log(leavedata.EmployeeID);
        const usersCollection = collection(db, `/company/${company}/${dep}/${dep}/Employees`);
          const q = query(usersCollection, where("EmployeeID", "==",leavedata.EmployeeID));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0].data(); // Assume the first result is the correct one
            // Display the selected employee's details in the profile form
            displayEmployeeProfile(doc);
          } else {
            alert("Employee not found.");
          }
            // Clear previous dates to avoid duplicates
            
            const datesContainer = document.getElementById("selecteddates");
            datesContainer.innerHTML = "";

            dateArray.forEach(date => {
                let dateDiv = document.createElement("div");
                dateDiv.classList.add("dates");
                dateDiv.setAttribute("data-date", date); // Store date as an attribute
                dateDiv.innerText = date;

                datesContainer.appendChild(dateDiv);
            });
            document.getElementById("reason").innerHTML=`Reason :${leavedata.Reason}`;

            document.getElementById('approved').addEventListener('click', async () => {
                await setDoc(leaves1, { Status: "true" }, { merge: true });
                document.getElementById('fel').innerHTML="Approved Successfully";
                markOnLeave(leavedata.EmployeeID,dateArray);
            });
            document.getElementById('declain').addEventListener('click', async () => {
                await setDoc(leaves1, { Status: "declined" }, { merge: true });
                document.getElementById('fel').innerHTML="Declined Successfully";
            });

        } else {
            console.log("No such document!");
        }
    } catch (error) {
        console.error("Error fetching document:", error);
    }
};


async function markOnLeave(id, datesArray) {
    try {
        // Fetch employee details based on EmployeeID
        const employeesCollection = collection(db, `/company/${company}/${dep}/${dep}/Employees`);
        const q = query(employeesCollection, where("EmployeeID", "==", id));
        const employeesSnapshot = await getDocs(q);

        if (employeesSnapshot.empty) {
            console.error(`No employee found with ID: ${id}`);
            alert(`No employee found with ID: ${id}`);
            return;
        }

        // Get employee details
        const employee = employeesSnapshot.docs[0].data();

        // Loop through each date in the array and mark as 'On Leave'
        for (const leaveDate of datesArray) {
            try {
                const dateParts = leaveDate.split("-");
                if (dateParts.length !== 3) {
                    console.error(`Invalid date format: ${leaveDate}`);
                    continue;
                }

                const year = dateParts[0];
                const month = dateParts[1].padStart(2, '0');
                const day = dateParts[2].padStart(2, '0');
                const date2 = `${day}-${month}-${year}`;

                const attendanceDocRef = doc(db, `company/${company}/${dep}/${dep}/Attendance/${id}_${leaveDate}`);
                await setDoc(attendanceDocRef, {
                    EmployeeID: id,
                    Date: leaveDate,    
                    Date2:date2,
                    Status: "On Leave",
                    Role: employee.Role,
                });

                console.log(`Leave marked for ${id} on ${leaveDate}`);
            } catch (error) {
                console.error(`Error marking leave for ${id} on ${leaveDate}:`, error);
                alert(`Failed to mark leave for ${leaveDate}.`);
            }
        }

        setTimeout(() => location.reload(), 3000);
    } catch (error) {
        console.error("Error marking leave:", error);
        alert("Error marking leave. Please try again.");
    }
}



  // Function to display employee profile details (same as before)
  function displayEmployeeProfile(data) {
    const imgElement = document.getElementById('userPhoto');
    
    // Set the image source to the fetched URL
    imgElement.src = data.photoURL;
  
    // Make the image visible after it's loaded
    imgElement.onload = function() {
      imgElement.style.display = 'block';   // Ensure it's visible
      imgElement.style.opacity = 1;   
    };
    
    const pro = document.getElementById('profile');
    pro.style.display = 'block';
    pro.style.opacity = 1;
  
    // Update the UI with employee data
    document.getElementById("userName").innerText = data.name || "Not provided";
    document.getElementById("userEmail").innerText = data.email || "Not provided";
    document.getElementById("Dob").innerText = "Date of birth: " + (data.Dob || "Not provided");
    document.getElementById("userMobile").innerText = "Mobile: " + (data.mobileNumber || "Not provided");
    document.getElementById('Role').innerText = data.Role || "Not provided";
    document.getElementById('company').innerText = data.Company || "Not provided";
  }
  

