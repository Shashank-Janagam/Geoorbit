// Function to check if a point is within a polygon (box)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getFirestore, doc,getDoc, setDoc,Timestamp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';

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
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth();



function isPointInPolygon(point, polygon) {
  const x = point.lat;
  const y = point.lng;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lat, yi = polygon[i].lng;
    const xj = polygon[j].lat, yj = polygon[j].lng;

    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }

  return inside;
}

// Function to draw a polygon (box) on the map
function drawPolygon(map, polygon) {
  const path = polygon.map(point => ({ lat: point.lat, lng: point.lng }));
  new google.maps.Polygon({
    paths: path,
    map: map,
    strokeColor: "#FF0000",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#FF0000",
        fillOpacity: 0.35,
  });
}
const company=sessionStorage.getItem('company');
const dep=sessionStorage.getItem('dep');
// Function to get current location and check if it's within the polygon
const locref=doc(db,`company/${company}/${dep}/${dep}/Location/PolygonData`);
const loco=await getDoc(locref);
const data=loco.data();
function getLocationAndCheckRadius() {
  const polygon = [
    // { lat: 17.1975195, lng: 78.5983140 }, // Top-left corner
    // { lat: 17.1976073, lng: 78.5991066 }, // Top-right corner
    // { lat: 17.1969238, lng: 78.5992008 }, // Bottom-right corner
    // { lat: 17.1968527, lng: 78.5983751 }  // Bottom-left corner

    { lat: data.lat1, lng: data.lng1 }, // Top-left corner
    { lat: data.lat2, lng: data.lng2 }, // Top-right corner
    { lat: data.lat3, lng: data.lng3}, // Bottom-right corner
    { lat: data.lat4, lng: data.lng4 }



    // { lat: 17.2115389, lng: 78.6033113 }, // Top-left corner
    // { lat: 17.2118795, lng: 78.6034384 }, // Top-right corner
    // { lat: 17.2117314, lng: 78.6037210}, // Bottom-right corner
    // { lat: 17.2113842, lng: 78.6035983}, // Bottom-right corner
  ]; // Replace with your fixed office coordinates

  const defaultLocation = { lat: polygon[0].lat, lng: polygon[0].lng };
  const map = new google.maps.Map(document.getElementById("map"), {
    center: defaultLocation,
    zoom: 18,
    // mapTypeId: google.maps.MapTypeId.SATELLITE, // Set the map to Satellite view
    
  });
  const map2 = new google.maps.Map(document.getElementById("map2"), {
    center: defaultLocation,
    zoom: 16,
    // mapTypeId: google.maps.MapTypeId.SATELLITE, // Set to satellite view
  });

  drawPolygon(map, polygon);
  drawPolygon(map2, polygon);

// setInterval(() => {
  
// document.getElementById('blocks').style.display='flex';
  if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
      position => {
        const currentLat = position.coords.latitude;
        const currentLon = position.coords.longitude;
        // console.log("Your current location: Latitude:", currentLat, "Longitude:", currentLon);

        // const userLocation = { lat: currentLat, lng: currentLon };
        const userLocation = { lat:17.197443, lng:78.598715 };

        // Create a custom icon for the user's location (blue dot)

        // Create a marker for the user's location
        new google.maps.Marker({
          position: userLocation,
          map: map2,
          title: "You are here",
          // icon: userLocationIcon,
          
        });
        const targetLocation={ 
          // lat: 17.1976073,
          //  lng: 78.5991066 
          
          //  lat: 17.4002726, 
          //  lng: 78.5901558 
          lat: data.lat4,
           lng: data.lng4


          //  lat: 17.2117314,
          //   lng: 78.6037210, // Bottom-right corner

          };

        

        // Check if the user is within the polygon
        const inside = isPointInPolygon(userLocation, polygon);
        if (inside) {
          document.getElementById("result").textContent = "You are within the office range.";
          console.log("You are within the polygon area.");
          logAttendance(); // Replace "user123" with the actual user ID


        } else {
          document.getElementById("result").textContent = "You are outside the office range.";
          console.log("You are outside the polygon area.");
          // logAttendance(); // Replace "user123" with the actual user ID

        }

        map2.setCenter(userLocation); // Set map center to the user's location
        map.setCenter(targetLocation);
      },
      error => {
        console.error("Error getting location:", error);
        alert("There was an error retrieving your location. Please enable location services and try again.");
      }
    );
  } else {
    alert("Geolocation is not supported by this browser.");
  }
// }, 5000);
}

// Call the function to get location and check polygon

let formattedDate=null;
let time=null;

async function logAttendance() {
  try {
    const company=sessionStorage.getItem('company');
    const dep=sessionStorage.getItem('dep');
    const collectionName = `company/${company}/${dep}/${dep}/Attendance`; // Firestore collection for attendance

    if (!userUID) {
      console.log("No user is authenticated!");
      alert("Please sign in to proceed.");
      window.location.href = "/index.html"; // Redirect to login page
    }else{
      
        // console.log("User is logged in:", user.uid);
        
        // Create an async function inside the callback
        (async () => {
          const userRef = doc(db, `/company/${company}/${dep}/${dep}/Employees`, userUID); // Reference to the user's document

          try {
            const userDoc = await getDoc(userRef);

            if (userDoc.exists()) {
              // User data exists, retrieve and
              //  display it
              
              const userData = userDoc.data();
              try {
                const response = await fetch("https://www.timeapi.io/api/Time/current/zone?timeZone=Asia/Kolkata");
                const data = await response.json();
          
                // Extract date components
                const [month,day,year] = data.date.split("/"); // API returns YYYY-MM-DD
          
                // Format as YYYY/MM/DD
                 formattedDate = `${day}-${month}-${year}`;

                 time=data.time;
          
                console.log("Correct IST Time:", `${formattedDate} ${data.time}`);
            } catch (error) {
                console.error("Error fetching time:", error);
            }
      // Format as YYYY/MM/DD

      const docId = `${userData.EmployeeID}_${formattedDate}`;
              const attendanceDocRef = doc(db, collectionName, docId);
              const attendanceDoc = await getDoc(attendanceDocRef);
              // const timedata=attendanceDoc.data();
              const currentDate = new Date();

              const year = currentDate.getFullYear();
              const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Months are zero-based
              const day = String(currentDate.getDate()).padStart(2, '0'); // Day of the month
              const date = `${year}-${month}-${day}`; // Format as YYYY-MM-DD

            

              if(!attendanceDoc.exists()){

              
              // console.log("Local date:", date);


             
              // console.log(currentDate.split("T")[0]);

              // console.log(docId);
              const attendanceData = {
                Name:userData.name,
                EmployeeID: userData.EmployeeID,
                Role: userData.Role,
                Date: formattedDate,
                Date2:date,
                Status:"Present",
                Firstlogin:time,
                Lastlogin:time,
              };

              await setDoc(doc(db, collectionName, docId), attendanceData);
              console.log("Attendance logged successfully!");
              sendEmail(userData.email,userData.name);
            }else{
              if(attendanceDoc.data().Status=="Absent"){
                window.location.href="Absent.html";
              }else if(attendanceDoc.data().Status=="On Leave"){
                sendEmail(userData.email,userData.name);
                const attendanceData = {
                  Name:userData.name,
                  EmployeeID: userData.EmployeeID,
                  Role: userData.Role,
                  Date: formattedDate,
                  Date2:date,
                  Status:"Present",
                  Firstlogin:time,
                  Lastlogin:time,
                };
  
                await setDoc(doc(db, collectionName, docId), attendanceData);

                
              }else{
              console.log("alredy updated");
              console.log(formattedDate);
              
              await setDoc(attendanceDocRef,{Lastlogin:time},{merge:true});

              console.log("Attendance updated successfully with new time!");
              document.getElementById('result').textContent="Already attended"

              }

            }
            } else {
              console.log("No user data found in Firestore.");
            }
          } catch (error) {
            console.error("Error fetching user data from Firestore:", error);
          }
        })(); // Immediately invoke the async function
     
    }
  } catch (error) {
    console.error("Error logging attendance:", error);
  }
}

// // Automatically reload the page every 10 seconds
// setInterval(() => {
  // location.reload();

  const userUID = sessionStorage.getItem('userUID');

  if (!userUID) {
    console.log("No user is authenticated!");
    alert("Please sign in to proceed.");
    window.location.href = "/index.html"; // Redirect to login page
  } else {
    console.log("User is authenticated with UID:", userUID);
    

    getLocationAndCheckRadius();

    // Display the user details...
  }

  (function() {
    emailjs.init("HCjaEIZOneTx9xkek"); // Replace with your EmailJS User ID
})();

function sendEmail(to,name) {
    const subject = "Regarding Your Presence";
    const message = "Your Attendance marked Successfully..!";
    console.log("Mail sent");
    const templateParams = {
        name:name,
        to_email: to,
        subject: subject,
        message: message,
    };

    emailjs.send("service_x561nxp", "template_hf5tx8c", templateParams)
        .then(response => {
        }, error => {
        });
}

// }, 10000); // 10000 milliseconds = 10 seconds


