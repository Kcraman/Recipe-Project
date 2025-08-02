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
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

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
        
        // Calculate how many input ingredients match recipe ingredients
        let matchingIngredientsCount = 0;
        
        ingredients.forEach(inputIngredient => {
            let ingredientMatched = false;
            recipeIngredients.forEach(recipeIngredient => {
                if (recipeIngredient.includes(inputIngredient.toLowerCase()) || 
                    inputIngredient.toLowerCase().includes(recipeIngredient)) {
                    ingredientMatched = true;
                }
            });
            if (ingredientMatched) {
                matchingIngredientsCount++;
            }
        });
        
        // Check if recipe has at least 75% of the entered ingredients
        const requiredMatchPercentage = 0.75;
        const requiredMatches = Math.ceil(ingredients.length * requiredMatchPercentage);
        
        if (matchingIngredientsCount >= requiredMatches) {
            matchingRecipes.push({
                id: doc.id,
                data: recipeData
            });
        }
    });
    
    if (matchingRecipes.length === 0) {
        errorDiv.textContent = 'No recipes found with at least 75% of those ingredients.';
        errorDiv.style.display = 'block';
        container.innerHTML = '<p class="no-results">No recipes found matching at least 75% of your ingredients.</p>';
    } else {
        displaySearchResults(matchingRecipes, input);
    }
});

// Function to display search results
function displaySearchResults(matchingRecipes, searchTerm) {
    const container = document.getElementById("recipe-details");
    
    let html = `<div class="search-results">
        <h3>Recipes with at least 75% of "${searchTerm}" (${matchingRecipes.length} recipe${matchingRecipes.length > 1 ? 's' : ''})</h3>
        <div class="recipes-grid">`;
    
    matchingRecipes.forEach(recipe => {
        const isSaved = userSavedRecipeIds.includes(recipe.id);
        const isCreator = recipe.data.createdByEmail && recipe.data.createdByEmail === auth.currentUser?.email;
        html += `
            <div class="recipe-card-item" data-id="${recipe.id}">
                <div class="recipe-header">
                    <h4 class="recipe-title">${capitalize(recipe.data.name)}</h4>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <button class="save-recipe-btn ${isSaved ? 'saved' : ''}" onclick="toggleSaveRecipe('${recipe.id}', '${recipe.data.name}')">
                            <i class="fas ${isSaved ? 'fa-check' : 'fa-bookmark'}"></i>
                            <span>${isSaved ? 'Saved' : 'Save'}</span>
                        </button>
                        ${isCreator ? `
                            <button class="delete-recipe-btn" onclick="showDeleteConfirmation('${recipe.id}', '${recipe.data.name}')" style="background: #dc3545; color: white; border: none; border-radius: 20px; padding: 8px 16px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; display: flex; align-items: center; gap: 5px;">
                                <i class="fas fa-trash"></i>
                                <span>Delete</span>
                            </button>
                        ` : ''}
                    </div>
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

// Delete recipe functionality
window.showDeleteConfirmation = function(recipeId, recipeName) {
    // Create modal
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;
    
    modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 15px; max-width: 400px; width: 90%; text-align: center;">
            <h3 style="color: #dc3545; margin-bottom: 20px;">
                <i class="fas fa-exclamation-triangle"></i> Delete Recipe
            </h3>
            <p style="margin-bottom: 20px; color: #666;">
                Are you sure you want to delete "<strong>${recipeName}</strong>"?<br>
                This action cannot be undone.
            </p>
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 10px; color: #5B4B3A; font-weight: 600;">
                    Enter your password to confirm:
                </label>
                <input type="password" id="deletePassword" placeholder="Enter password" 
                       style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 16px;">
            </div>
            <div id="deleteError" style="color: #dc3545; margin-bottom: 15px; display: none;"></div>
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button id="confirmDelete" style="background: #dc3545; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer;">
                    Delete Recipe
                </button>
                <button id="cancelDelete" style="background: #6c757d; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer;">
                    Cancel
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners
    const confirmBtn = modal.querySelector('#confirmDelete');
    const cancelBtn = modal.querySelector('#cancelDelete');
    const passwordInput = modal.querySelector('#deletePassword');
    const errorDiv = modal.querySelector('#deleteError');
    
    cancelBtn.onclick = () => {
        document.body.removeChild(modal);
    };
    
    confirmBtn.onclick = async () => {
        const password = passwordInput.value.trim();
        if (!password) {
            errorDiv.textContent = 'Please enter your password.';
            errorDiv.style.display = 'block';
            return;
        }
        
        try {
            const user = auth.currentUser;
            if (!user) {
                errorDiv.textContent = 'You must be logged in to delete recipes.';
                errorDiv.style.display = 'block';
                return;
            }
            
            // Verify password
            await signInWithEmailAndPassword(auth, user.email, password);
            
            // Delete the recipe
            await deleteDoc(doc(db, 'Recipes', recipeId));
            
            // Show success message
            const saveErrorContainer = document.getElementById('saveErrorContainer');
            saveErrorContainer.innerHTML = `
                <div style="background: #28a745; color: #fff; padding: 16px 32px; border-radius: 8px; font-size: 1.1rem; font-family: 'Poppins', sans-serif; box-shadow: 0 4px 15px rgba(0,0,0,0.12); text-align: center; max-width: 350px; margin: 0 auto; animation: fadeIn 0.5s; letter-spacing: 0.5px;">
                    Recipe deleted successfully!
                </div>
            `;
            saveErrorContainer.style.display = 'block';
            setTimeout(() => {
                saveErrorContainer.style.display = 'none';
                saveErrorContainer.innerHTML = '';
            }, 3000);
            
            // Remove modal and reload search results
            document.body.removeChild(modal);
            document.getElementById('search-btn').click();
            
                    } catch (error) {
                if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                    errorDiv.textContent = 'Your password is incorrect';
                } else {
                    errorDiv.textContent = 'Error deleting recipe: ' + error.message;
                }
                errorDiv.style.display = 'block';
            }
    };
    
    // Allow Enter key to confirm
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            confirmBtn.click();
        }
    });
    
    // Focus on password input
    passwordInput.focus();
};
