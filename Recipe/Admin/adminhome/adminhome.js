// Admin Dashboard JavaScript
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, getDocs, query, where, orderBy, limit } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

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
const auth = getAuth();
const db = getFirestore(app);

// Check admin authentication
function checkAdminAuth() {
    const adminEmail = sessionStorage.getItem('adminEmail');
    const adminUID = sessionStorage.getItem('adminUID');
    
    if (!adminEmail || !adminUID) {
        window.location.href = "../adminlogin/adminlogin.html";
        return false;
    }
    return true;
}

// Load admin name
async function loadAdminName() {
    const adminEmail = sessionStorage.getItem('adminEmail');
    if (adminEmail) {
        try {
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("email", "==", adminEmail));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                const userData = querySnapshot.docs[0].data();
                const adminName = userData.firstname + ' ' + userData.lastname;
                document.getElementById('adminName').textContent = adminName;
            }
        } catch (error) {
            console.error("Error loading admin name:", error);
        }
    }
}

// Load dashboard statistics
async function loadDashboardStats() {
    try {
        // Get total users
        const usersRef = collection(db, "users");
        const usersSnapshot = await getDocs(usersRef);
        const totalUsers = usersSnapshot.size;
        
        // Count admin users
        let adminUsers = 0;
        usersSnapshot.forEach(doc => {
            const userData = doc.data();
            if (userData.isAdmin === true) {
                adminUsers++;
            }
        });
        
        // Get total recipes
        const recipesRef = collection(db, "Recipes");
        const recipesSnapshot = await getDocs(recipesRef);
        const totalRecipes = recipesSnapshot.size;
        
        // Update UI
        document.getElementById('totalUsers').textContent = totalUsers;
        document.getElementById('totalRecipes').textContent = totalRecipes;
        document.getElementById('adminUsers').textContent = adminUsers;
        
    } catch (error) {
        console.error("Error loading dashboard stats:", error);
    }
}



// Logout function
async function logout() {
    try {
        await signOut(auth);
        sessionStorage.removeItem('adminEmail');
        sessionStorage.removeItem('adminUID');
        window.location.href = "../adminlogin/adminlogin.html";
    } catch (error) {
        console.error("Error during logout:", error);
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    if (!checkAdminAuth()) return;
    
    loadAdminName();
    loadDashboardStats();
    
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    // Navigation active state
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
        });
    });
});

// Check authentication state
onAuthStateChanged(auth, (user) => {
    if (!user) {
        sessionStorage.removeItem('adminEmail');
        sessionStorage.removeItem('adminUID');
        window.location.href = "../adminlogin/adminlogin.html";
    }
});
