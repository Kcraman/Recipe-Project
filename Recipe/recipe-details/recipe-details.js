import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, doc, getDoc, collection, query, where, getDocs, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
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

let userSavedRecipeIds = [];

onAuthStateChanged(auth, async (user) => {
    const userIcon = document.getElementById('userIcon');
    const userText = document.getElementById('userText');
    if (user) {
        userIcon.href = "../user/User.html";
        const userDoc = await getDocs(query(collection(db, "users"), where("email", "==", user.email)));
        if (!userDoc.empty) {
            const userData = userDoc.docs[0].data();
            userText.textContent = userData.firstname;
        }
        userSavedRecipeIds = await fetchUserSavedRecipeIds(user.uid);
        renderRecipe();
    } else {
        userIcon.href = "../login/Login.html";
        userText.textContent = "Login";
        userSavedRecipeIds = [];
        renderRecipe();
    }
});

async function fetchUserSavedRecipeIds(userId) {
    const savedRecipesRef = collection(db, 'users', userId, 'savedRecipes');
    const savedRecipesSnap = await getDocs(savedRecipesRef);
    return savedRecipesSnap.docs.map(docSnap => docSnap.id);
}

const urlParams = new URLSearchParams(window.location.search);
const recipeId = urlParams.get('id');

async function renderRecipe() {
    const recipeRef = doc(db, "Recipes", recipeId);
    const recipeSnap = await getDoc(recipeRef);
    const saveBtn = document.getElementById('saveRecipeBtn');
    if (recipeSnap.exists()) {
        const recipeData = recipeSnap.data();
        document.getElementById('recipeName').textContent = recipeData.name.charAt(0).toUpperCase() + recipeData.name.slice(1);
        // ... (ingredients and instructions rendering unchanged) ...
        const ingredientsList = document.getElementById('ingredientsList');
        ingredientsList.innerHTML = '';
        if (recipeData.ingredients && Array.isArray(recipeData.ingredients)) {
            recipeData.ingredients.forEach(ingredient => {
                const li = document.createElement('li');
                li.innerHTML = `<i class="fas fa-check"></i> ${ingredient}`;
                ingredientsList.appendChild(li);
            });
        } else {
            ingredientsList.innerHTML = '<li>No ingredients available</li>';
        }
        const instructionsList = document.getElementById('instructionsList');
        instructionsList.innerHTML = '';
        if (recipeData.instructions && Array.isArray(recipeData.instructions)) {
            recipeData.instructions.forEach(instruction => {
                const li = document.createElement('li');
                li.textContent = instruction;
                instructionsList.appendChild(li);
            });
        } else {
            instructionsList.innerHTML = '<li>No instructions available</li>';
        }
        // Set save button state
        if (userSavedRecipeIds.includes(recipeId)) {
            saveBtn.classList.add('saved');
            saveBtn.innerHTML = '<i class="fas fa-check"></i><span>Saved</span>';
        } else {
            saveBtn.classList.remove('saved');
            saveBtn.innerHTML = '<i class="fas fa-bookmark"></i><span>Save Recipe</span>';
        }
    } else {
        document.getElementById('recipeName').textContent = 'Recipe not found';
    }
}

function toggleMenu() {
    document.getElementById('sidebar').classList.toggle('active');
}
document.querySelectorAll('.sidebar a').forEach(link => {
    link.addEventListener('click', () => {
        document.getElementById('sidebar').classList.remove('active');
    });
});
document.addEventListener('click', function(event) {
    const sidebar = document.querySelector('.sidebar');
    const menuIcon = document.querySelector('.menu-icon');
    if (sidebar.classList.contains('active') && 
        !sidebar.contains(event.target) && 
        !menuIcon.contains(event.target)) {
        sidebar.classList.remove('active');
    }
});

window.toggleSaveRecipe = async function() {
    const saveBtn = document.getElementById('saveRecipeBtn');
    const recipeName = document.getElementById('recipeName').textContent;
    const saveErrorContainer = document.getElementById('saveErrorContainer');
    saveErrorContainer.innerHTML = '';
    const user = getAuth().currentUser;
    if (!user) {
        saveErrorContainer.innerHTML = `<div class=\"simple-login-notification\">Please log in to save.</div>`;
        saveErrorContainer.style.display = 'block';
        setTimeout(() => {
            saveErrorContainer.style.display = 'none';
            saveErrorContainer.innerHTML = '';
        }, 5000);
        return;
    }
    const recipeRef = doc(db, 'users', user.uid, 'savedRecipes', recipeId);
    if (userSavedRecipeIds.includes(recipeId)) {
        // Unsave
        await deleteDoc(recipeRef);
        userSavedRecipeIds = userSavedRecipeIds.filter(id => id !== recipeId);
        saveBtn.classList.remove('saved');
        saveBtn.innerHTML = '<i class="fas fa-bookmark"></i><span>Save Recipe</span>';
    } else {
        // Save
        await setDoc(recipeRef, {
            name: recipeName,
            savedAt: new Date()
        });
        userSavedRecipeIds.push(recipeId);
        saveBtn.classList.add('saved');
        saveBtn.innerHTML = '<i class="fas fa-check"></i><span>Saved</span>';
    }
};
window.toggleMenu = toggleMenu;
window.toggleSaveRecipe = window.toggleSaveRecipe;