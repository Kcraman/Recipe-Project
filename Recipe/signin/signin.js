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

function toggleConfirmPassword() {
    const confirmPasswordInput = document.getElementById('confirmPassword');
    // Find the toggle button within the same password-container
    const toggleButton = confirmPasswordInput.parentElement.querySelector('.password-toggle i');
    if (confirmPasswordInput.type === 'password') {
        confirmPasswordInput.type = 'text';
        toggleButton.classList.remove('fa-eye');
        toggleButton.classList.add('fa-eye-slash');
    } else {
        confirmPasswordInput.type = 'password';
        toggleButton.classList.remove('fa-eye-slash');
        toggleButton.classList.add('fa-eye');
    }
}

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-analytics.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

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
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth();

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

document.getElementById('signupForm').addEventListener('submit', function (e) {
    e.preventDefault();
    
    const firstname = document.getElementById('firstname').value;
    const lastname = document.getElementById('lastname').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validate password match
    if (password !== confirmPassword) {
        showError("Passwords do not match. Please re-enter.");
        return;
    }

    // Validate password strength
    if (password.length < 6) {
        showError("Password should be at least 6 characters long");
        return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@gmail\.com$/;
    if (!emailRegex.test(email)) {
        showError("Please enter a valid Gmail address (example@gmail.com)");
        return;
    }
    
    createUserWithEmailAndPassword(auth, email, password)
    .then(async (userCredential) => {
        const user = userCredential.user;

        await setDoc(doc(db, "users", user.uid), {
            firstname: firstname,
            lastname: lastname,
            email: email
        });

        showSuccess("Account created successfully! Redirecting to login...");
        setTimeout(() => {
            window.location.href = "../login/Login.html";
        }, 2000);
    })
    .catch((error) => {
        let errorMessage = "An error occurred during sign up. ";
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = "This email is already registered. Please try logging in instead.";
                break;
            case 'auth/invalid-email':
                errorMessage = "Please enter a valid email address.";
                break;
            case 'auth/operation-not-allowed':
                errorMessage = "Email/password accounts are not enabled. Please contact support.";
                break;
            case 'auth/weak-password':
                errorMessage = "Please choose a stronger password (at least 6 characters).";
                break;
            default:
                errorMessage += "Please try again.";
        }
        
        showError(errorMessage);
    });
});
window.togglePassword = togglePassword;
window.toggleConfirmPassword = toggleConfirmPassword;