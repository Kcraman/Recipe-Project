function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleButton = document.querySelector('.password-toggle i');
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleButton.classList.remove('fa-eye');
        toggleButton.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleButton.classList.remove('fa-eye-slash');
        toggleButton.classList.add('fa-eye');
    }
}
window.togglePassword = togglePassword;

// Firebase Admin Authentication
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

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

function showError(message) {
    const errorContainer = document.getElementById('errorContainer');
    errorContainer.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    errorContainer.style.display = 'block';
    setTimeout(() => {
        errorContainer.style.display = 'none';
    }, 5000);
}

function showSuccess(message) {
    const successContainer = document.getElementById('successContainer');
    successContainer.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    successContainer.style.display = 'block';
    setTimeout(() => {
        successContainer.style.display = 'none';
    }, 5000);
}

// Check if user is admin
async function checkAdminStatus(email) {
    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", email));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            return userData.isAdmin === true;
        }
        return false;
    } catch (error) {
        console.error("Error checking admin status:", error);
        return false;
    }
}

document.getElementById('adminLoginForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const submitBtn = document.querySelector('.admin-login-btn');
    
    // Disable button and show loading
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showError("Please enter a valid email address");
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Access Admin Panel';
        return;
    }

    try {
        // First authenticate with Firebase
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // Check if user has admin privileges
        const isAdmin = await checkAdminStatus(email);
        
        if (!isAdmin) {
            showError("Access denied. This account does not have admin privileges.");
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Access Admin Panel';
            return;
        }
        
        showSuccess("Admin authentication successful! Redirecting to dashboard...");
        
        // Store admin session
        sessionStorage.setItem('adminEmail', email);
        sessionStorage.setItem('adminUID', userCredential.user.uid);
        
        setTimeout(() => {
            window.location.href = "../adminhome/adminhome.html";
        }, 2000);
        
    } catch (error) {
        let errorMessage;
        
        switch (error.code) {
            case 'auth/invalid-email':
                errorMessage = "Please enter a valid email address.";
                break;
            case 'auth/user-disabled':
                errorMessage = "This account has been disabled. Please contact support.";
                break;
            case 'auth/user-not-found':
                errorMessage = "No account found with this email. Please check your credentials.";
                break;
            case 'auth/wrong-password':
                errorMessage = "Incorrect password. Please try again.";
                break;
            case 'auth/invalid-credential':
                errorMessage = "Incorrect email or password. Please try again.";
                break;
            case 'auth/too-many-requests':
                errorMessage = "Too many failed attempts. Please try again later.";
                break;
            default:
                errorMessage = "An error occurred during authentication. Please try again.";
        }
        
        showError(errorMessage);
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Access Admin Panel';
    }
});

// Check if already logged in as admin
auth.onAuthStateChanged(async (user) => {
    if (user) {
        const isAdmin = await checkAdminStatus(user.email);
        if (isAdmin) {
            sessionStorage.setItem('adminEmail', user.email);
            sessionStorage.setItem('adminUID', user.uid);
            window.location.href = "../adminhome/adminhome.html";
        }
    }
});
