// Menu toggle functionality
function toggleMenu() {
    document.getElementById('sidebar').classList.toggle('active');
}

document.querySelectorAll('.sidebar a').forEach(link => {
    link.addEventListener('click', () => {
        document.getElementById('sidebar').classList.remove('active');
    });
});

// Close sidebar when clicking outside
document.addEventListener('click', function(event) {
    const sidebar = document.getElementById('sidebar');
    const menuIcon = document.querySelector('.menu-icon');
    
    if (sidebar.classList.contains('active') && 
        !sidebar.contains(event.target) && 
        !menuIcon.contains(event.target)) {
        sidebar.classList.remove('active');
    }
});

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
        initializePage();
    } else {
        userIcon.href = "../login/Login.html";
        userText.textContent = "Login";
        userSavedRecipeIds = [];
        initializePage();
    }
});

async function fetchUserSavedRecipeIds(userId) {
    const savedRecipesRef = collection(db, 'users', userId, 'savedRecipes');
    const savedRecipesSnap = await getDocs(savedRecipesRef);
    return savedRecipesSnap.docs.map(docSnap => docSnap.id);
}

// Initialize page based on URL parameters and session storage
function initializePage() {
    // Check if there's an ingredient search term from homepage
    const ingredientSearchTerm = sessionStorage.getItem('ingredientSearchTerm');
    if (ingredientSearchTerm) {
        // Clear the search term from sessionStorage
        sessionStorage.removeItem('ingredientSearchTerm');
        // Set the search box value and trigger search
        document.getElementById('search-box').value = ingredientSearchTerm;
        // Show loading state
        document.getElementById("recipe-details").innerHTML = '<div class="loading">Searching recipes...</div>';
        // Use setTimeout to ensure DOM is ready
        setTimeout(() => {
            document.getElementById('search-btn').click();
        }, 100);
    } else {
        document.getElementById("recipe-details").innerHTML = "<p>Enter ingredients to find recipes.</p>";
    }
}

function capitalize(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
}

// Calculate total time from instructions
function calculateTotalTime(instructions) {
    if (!instructions || !Array.isArray(instructions)) {
        return '00:00';
    }
    
    let totalSeconds = 0;
    instructions.forEach(instruction => {
        if (typeof instruction === 'object' && instruction.time) {
            totalSeconds += instruction.time;
        } else {
            totalSeconds += 60; // Default 1 minute for old recipes
        }
    });
    
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Global function for saving recipes
window.toggleSaveRecipe = async function(recipeId, recipeName) {
    const saveErrorContainer = document.getElementById('saveErrorContainer');
    saveErrorContainer.innerHTML = '';
    const user = auth.currentUser;
    
    if (!user) {
        saveErrorContainer.innerHTML = `<div class="simple-login-notification">Please log in to save.</div>`;
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
        
        // Update the button in the UI
        const saveBtn = document.querySelector(`[data-id="${recipeId}"] .save-recipe-btn`);
        if (saveBtn) {
            saveBtn.classList.remove('saved');
            saveBtn.innerHTML = '<i class="fas fa-bookmark"></i><span>Save</span>';
        }
    } else {
        // Save
        await setDoc(recipeRef, {
            name: recipeName,
            savedAt: new Date()
        });
        userSavedRecipeIds.push(recipeId);
        
        // Update the button in the UI
        const saveBtn = document.querySelector(`[data-id="${recipeId}"] .save-recipe-btn`);
        if (saveBtn) {
            saveBtn.classList.add('saved');
            saveBtn.innerHTML = '<i class="fas fa-check"></i><span>Saved</span>';
        }
    }
};

// Ingredient search functionality
document.querySelector("#search-btn").addEventListener("click", async () => {
    const input = document.querySelector("#search-box").value.trim();
    const errorDiv = document.getElementById('searchError');
    const container = document.getElementById("recipe-details");
    
    errorDiv.style.display = 'none';
    errorDiv.textContent = '';
    
    if (!input) {
        errorDiv.textContent = "Please enter ingredients.";
        errorDiv.style.display = 'block';
        return;
    }
    
    // Show loading message
    container.innerHTML = '<div class="loading">Searching recipes...</div>';
    
    // Split by comma or space, trim, and filter empty
    const ingredients = input.split(/,|\s+/).map(i => i.trim()).filter(i => i);
    if (ingredients.length === 0) {
        errorDiv.textContent = 'Please enter at least one ingredient.';
        errorDiv.style.display = 'block';
        container.innerHTML = '<p class="no-results">No ingredients entered.</p>';
        return;
    }
    
    const recipesRef = collection(db, "Recipes");
    const recipesSnapshot = await getDocs(recipesRef);
    const matchingRecipes = [];
    
    recipesSnapshot.forEach((doc) => {
        const recipeData = doc.data();
        const recipeIngredients = Array.isArray(recipeData.ingredients)
            ? recipeData.ingredients.map(i => i.toLowerCase())
            : (typeof recipeData.ingredients === 'string' ? [recipeData.ingredients.toLowerCase()] : []);
        
        // Check if any input ingredient matches any recipe ingredient
        let hasMatchingIngredient = false;
        ingredients.forEach(inputIngredient => {
            recipeIngredients.forEach(recipeIngredient => {
                if (recipeIngredient.includes(inputIngredient.toLowerCase()) || 
                    inputIngredient.toLowerCase().includes(recipeIngredient)) {
                    hasMatchingIngredient = true;
                }
            });
        });
        
        if (hasMatchingIngredient) {
            matchingRecipes.push({
                id: doc.id,
                data: recipeData
            });
        }
    });
    
    if (matchingRecipes.length === 0) {
        errorDiv.textContent = 'No recipes found with those ingredients.';
        errorDiv.style.display = 'block';
        container.innerHTML = '<p class="no-results">No recipes found matching your ingredients.</p>';
    } else {
        displaySearchResults(matchingRecipes, input);
    }
});

// Function to display search results
function displaySearchResults(matchingRecipes, searchTerm) {
    const container = document.getElementById("recipe-details");
    
    let html = `<div class="search-results">
        <h3>Recipes with "${searchTerm}" (${matchingRecipes.length} recipe${matchingRecipes.length > 1 ? 's' : ''})</h3>
        <div class="recipes-grid">`;
    
    matchingRecipes.forEach(recipe => {
        const isSaved = userSavedRecipeIds.includes(recipe.id);
        html += `
            <div class="recipe-card-item" data-id="${recipe.id}">
                <div class="recipe-header">
                    <h4 class="recipe-title">${capitalize(recipe.data.name)}</h4>
                    <button class="save-recipe-btn ${isSaved ? 'saved' : ''}" onclick="toggleSaveRecipe('${recipe.id}', '${recipe.data.name}')">
                        <i class="fas ${isSaved ? 'fa-check' : 'fa-bookmark'}"></i>
                        <span>${isSaved ? 'Saved' : 'Save'}</span>
                    </button>
                </div>
                <div class="recipe-preview">
                    <div class="recipe-info">
                        <span><i class="fas fa-list"></i> ${recipe.data.ingredients ? (Array.isArray(recipe.data.ingredients) ? recipe.data.ingredients.length : 1) : 0} ingredients</span>
                        <span><i class="fas fa-clock"></i> ${calculateTotalTime(recipe.data.instructions)}</span>
                    </div>
                    <button class="view-recipe-btn" onclick="window.location.href='../recipe-details/recipe-details.html?id=${recipe.id}'">
                        <i class="fas fa-eye"></i> View Recipe
                    </button>
                </div>
            </div>
        `;
    });
    
    html += `</div></div>`;
    container.innerHTML = html;
}

// Add Enter key support for search
document.getElementById('search-box').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        document.getElementById('search-btn').click();
    }
});

// Global function for the back button
window.goBack = function() {
    window.history.back();
};

// Set up back button functionality after DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            window.goBack();
        });
    }
});

window.toggleMenu = toggleMenu;
window.capitalize = capitalize;
window.calculateTotalTime = calculateTotalTime;
