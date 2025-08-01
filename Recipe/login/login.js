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
//Firebase logic
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
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

document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Validate email format
    const emailRegex = /^[^\s@]+@gmail\.com$/;
    if (!emailRegex.test(email)) {
        showError("Please enter a valid Gmail address (example@gmail.com)");
        return;
    }

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            showSuccess("Login successful! Redirecting to home page...");
            setTimeout(() => {
                window.location.href = "../home/home.html";
            }, 2000);
        })
        .catch((error) => {
            let errorMessage;
            
            switch (error.code) {
                case 'auth/invalid-email':
                    errorMessage = "Please enter a valid Gmail address.";
                    break;
                case 'auth/user-disabled':
                    errorMessage = "This account has been disabled. Please contact support.";
                    break;
                case 'auth/user-not-found':
                    errorMessage = "No account found with this email. Please sign up first.";
                    break;
                case 'auth/wrong-password':
                    errorMessage = "Incorrect password. Please try again.";
                    break;
                case 'auth/invalid-credential':
                    errorMessage = "Incorrect email or password. Please try again or sign up if you don't have an account.";
                    break;
                default:
                    errorMessage = "An error occurred during login. Please try again.";
            }
            
            showError(errorMessage);
        });
});

// Modal functionality
const modal = document.getElementById('forgotPasswordModal');
const forgotPasswordLink = document.getElementById('forgotPasswordLink');
const closeBtn = document.querySelector('.close');

// Open modal
forgotPasswordLink.addEventListener('click', function(e) {
    e.preventDefault();
    modal.style.display = 'block';
});

// Close modal when clicking on X
closeBtn.addEventListener('click', function() {
    modal.style.display = 'none';
});

// Close modal when clicking outside of it
window.addEventListener('click', function(e) {
    if (e.target === modal) {
        modal.style.display = 'none';
    }
});

// Forgot password form submission
document.getElementById('forgotPasswordForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('resetEmail').value;
    const forgotErrorContainer = document.getElementById('forgotErrorContainer');
    const forgotSuccessContainer = document.getElementById('forgotSuccessContainer');

    // Validate email format
    const emailRegex = /^[^\s@]+@gmail\.com$/;
    if (!emailRegex.test(email)) {
        forgotErrorContainer.innerHTML = `<i class="fas fa-exclamation-circle"></i> Please enter a valid Gmail address (example@gmail.com)`;
        forgotErrorContainer.style.display = 'block';
        setTimeout(() => {
            forgotErrorContainer.style.display = 'none';
        }, 5000);
        return;
    }

    // Send password reset email
    sendPasswordResetEmail(auth, email)
        .then(() => {
            forgotSuccessContainer.innerHTML = `<i class="fas fa-check-circle"></i> Password reset email sent! Please check your inbox and spam folder.`;
            forgotSuccessContainer.style.display = 'block';
            setTimeout(() => {
                forgotSuccessContainer.style.display = 'none';
                modal.style.display = 'none';
                document.getElementById('resetEmail').value = '';
            }, 5000);
        })
        .catch((error) => {
            let errorMessage;
            
            switch (error.code) {
                case 'auth/invalid-email':
                    errorMessage = "Please enter a valid Gmail address.";
                    break;
                case 'auth/user-not-found':
                    errorMessage = "No account found with this email address.";
                    break;
                case 'auth/too-many-requests':
                    errorMessage = "Too many requests. Please try again later.";
                    break;
                default:
                    errorMessage = "An error occurred. Please try again.";
            }
            
            forgotErrorContainer.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${errorMessage}`;
            forgotErrorContainer.style.display = 'block';
            setTimeout(() => {
                forgotErrorContainer.style.display = 'none';
            }, 5000);
        });
});