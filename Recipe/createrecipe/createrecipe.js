function toggleMenu() {
    document.getElementById('sidebar').classList.toggle('active');
}

function addIngredient() {
    const list = document.getElementById('ingredientsList');
    const item = document.createElement('div');
    item.className = 'list-item';
    item.innerHTML = `
        <input type="text" placeholder="Enter ingredient" required>
        <button type="button" class="remove-btn" onclick="removeItem(this)">
            <i class="fas fa-times"></i>
        </button>
    `;
    list.appendChild(item);
}

function addInstruction() {
    const list = document.getElementById('instructionsList');
    const item = document.createElement('div');
    item.className = 'list-item';
    item.innerHTML = `
        <input type="text" placeholder="Enter instruction step" required>
        <button type="button" class="remove-btn" onclick="removeItem(this)">
            <i class="fas fa-times"></i>
        </button>
    `;
    list.appendChild(item);
}

function removeItem(button) {
    const list = button.parentElement.parentElement;
    if (list.children.length > 1) {
        button.parentElement.remove();
    }
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
    
    if (sidebar.classList.contains('active') && 
        !sidebar.contains(event.target) && 
        !menuIcon.contains(event.target)) {
        sidebar.classList.remove('active');
    }
});
//Firebase logic
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, addDoc, query, where, getDocs, doc, setDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
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
    const recipeForm = document.getElementById('recipeForm');

    if (user) {
        // User is signed in
        userIcon.href = "User.html";
        const userDoc = await getDocs(query(collection(db, "users"), where("email", "==", user.email)));
        if (!userDoc.empty) {
            const userData = userDoc.docs[0].data();
            userText.textContent = userData.firstname;
        }

        // Handle form submission
        recipeForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const recipeName = document.getElementById('recipeName').value;
            const ingredients = Array.from(document.querySelectorAll('#ingredientsList input')).map(input => input.value);
            const instructions = Array.from(document.querySelectorAll('#instructionsList input')).map(input => input.value);

            try {
                // Get user's name
                const userDoc = await getDocs(query(collection(db, "users"), where("email", "==", user.email)));
                let userName = "Unknown User";
                if (!userDoc.empty) {
                    const userData = userDoc.docs[0].data();
                    userName = `${userData.firstname} ${userData.lastname}`;
                }

                // Create document with recipe name as ID
                const recipeId = recipeName.toLowerCase().replace(/\s+/g, '-');
                await setDoc(doc(db, "Recipes", recipeId), {
                    name: recipeName,
                    ingredients: ingredients,
                    instructions: instructions,
                    createdBy: userName,
                    createdAt: new Date()
                });

                showSuccess("Recipe created successfully!");
                recipeForm.reset();
                // Clear all but first ingredient and instruction
                while (document.querySelectorAll('#ingredientsList .list-item').length > 1) {
                    document.querySelector('#ingredientsList .list-item:last-child').remove();
                }
                while (document.querySelectorAll('#instructionsList .list-item').length > 1) {
                    document.querySelector('#instructionsList .list-item:last-child').remove();
                }
            } catch (error) {
                showError("Error creating recipe: " + error.message);
            }
        });
    } else {
        // User is signed out
        userIcon.href = "Login.html";
        userText.textContent = "Login";
        recipeForm.innerHTML = `
            <div class="login-message">
                <i class="fas fa-lock"></i>
                <p>Please log in to create and share your recipes with the community.</p>
                <a href="Login.html">Log In Now</a>
            </div>
        `;
    }
});

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
window.toggleMenu = toggleMenu;