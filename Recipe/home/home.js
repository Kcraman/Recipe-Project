// Sidebar and menu logic
function toggleMenu() {
  document.getElementById('sidebar').classList.toggle('active');
}
document.querySelectorAll('.sidebar a').forEach(link => {
  link.addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('active');
  });
});

// Add click event listener to close sidebar when clicking outside
document.addEventListener('click', function(event) {
  const sidebar = document.getElementById('sidebar');
  const menuIcon = document.querySelector('.menu-icon');
  // Check if sidebar is active and click is outside both sidebar and menu icon
  if (sidebar.classList.contains('active') && 
      !sidebar.contains(event.target) && 
      !menuIcon.contains(event.target)) {
    sidebar.classList.remove('active');
  }
});

// Firebase logic
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAYWtxU8MhK1BKgwrRViZ5GM9RyvVtAOfc",
  authDomain: "recipe-finder-sign-in.firebaseapp.com",
  projectId: "recipe-finder-sign-in",
  storageBucket: "recipe-finder-sign-in.firebasestorage.app",
  messagingSenderId: "883935562264",
  appId: "1:883935562264:web:627cabc25e42c13f0ed16d",
  measurementId: "G-G5YCPWNZDQ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Check authentication state
onAuthStateChanged(auth, async (user) => {
  const userIcon = document.getElementById('userIcon');
  const userText = document.getElementById('userText');

  if (user) {
    // User is signed in
    userIcon.href = "../user/User.html";
    const userDoc = await getDocs(query(collection(db, "users"), where("email", "==", user.email)));
    if (!userDoc.empty) {
      const userData = userDoc.docs[0].data();
      userText.textContent = userData.firstname;
    }
  } else {
    // User is signed out
    userIcon.href = "../login/Login.html";
    userText.textContent = "Login";
  }
});

document.querySelector("#search-btn").addEventListener("click", async () => {
  const inputBox = document.querySelector("#inputbox1");
  const searchValue = inputBox.value.trim().toLowerCase();
  if (!searchValue) {
    inputBox.value = '';
    inputBox.placeholder = 'Please enter recipes';
    inputBox.style.borderColor = '#dc3545';
    inputBox.style.background = '#fff3f3';
    // Remove previous input event if any
    inputBox.oninput = null;
    inputBox.addEventListener('input', function handleInput() {
      if (inputBox.value.trim() !== '') {
        inputBox.style.borderColor = '';
        inputBox.style.background = '';
        inputBox.placeholder = 'Search Recipes';
        inputBox.removeEventListener('input', handleInput);
      }
    });
    return;
  }
  const recipesRef = collection(db, "Recipes");
  const recipesSnapshot = await getDocs(recipesRef);
  let found = false;
  recipesSnapshot.forEach((doc) => {
    const recipeName = doc.data().name.toLowerCase();
    if (recipeName.includes(searchValue)) {
      found = true;
      window.location.href = `../recipe/Recipe.html?id=${doc.id}`;
    }
  });
  if (!found) {
    const errorContainer = document.getElementById('errorContainer');
    errorContainer.innerHTML = `<i class="fas fa-exclamation-circle"></i> Recipe "${searchValue}" not found.`;
    errorContainer.style.display = 'block';
    setTimeout(() => {
      errorContainer.style.display = 'none';
    }, 5000);
  }
}); 
window.toggleMenu = toggleMenu;