// Back button functionality will be set up after DOM is loaded
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

const params = new URLSearchParams(window.location.search);
const recipeId = params.get("id");
const ingredientSearch = params.get("ingredientSearch");

// Initialize page based on URL parameters and session storage
function initializePage() {
    if (ingredientSearch === '1') {
        // Ingredient-based search result
        const recipeIds = JSON.parse(sessionStorage.getItem('ingredientSearchResults') || '[]');
        renderRecipesByIds(recipeIds);
    } else if (recipeId) {
        renderRecipe();
    } else {
        // Check if there's a search term from homepage
        const searchTerm = sessionStorage.getItem('recipeSearchTerm');
        if (searchTerm) {
            // Clear the search term from sessionStorage
            sessionStorage.removeItem('recipeSearchTerm');
            // Set the search box value and trigger search
            document.getElementById('search-box').value = searchTerm;
            // Show loading state
            document.getElementById("recipe-details").innerHTML = '<div class="loading">Searching recipes...</div>';
            // Use setTimeout to ensure DOM is ready
            setTimeout(() => {
                document.getElementById('search-btn').click();
            }, 100);
        } else {
            // Check if we have previous search results to restore
            const searchResults = sessionStorage.getItem('searchResults');
            const currentSearchTerm = sessionStorage.getItem('currentSearchTerm');
            
            if (searchResults && currentSearchTerm) {
                document.getElementById('search-box').value = currentSearchTerm;
                const results = JSON.parse(searchResults);
                displaySearchResults(results, currentSearchTerm);
            } else {
                document.getElementById("recipe-details").innerHTML = "<p>No recipe selected.</p>";
            }
        }
    }
}

async function renderRecipesByIds(recipeIds) {
    const container = document.getElementById("recipe-details");
    if (!recipeIds || recipeIds.length === 0) {
        container.innerHTML = '<p>No recipes found with those ingredients.</p>';
        return;
    }
    // Get the user's input ingredients from sessionStorage (store them when searching)
    let inputIngredients = sessionStorage.getItem('ingredientSearchInput');
    inputIngredients = inputIngredients ? JSON.parse(inputIngredients) : [];
    let html = '';
    for (const id of recipeIds) {
        const docRef = doc(db, "Recipes", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            const recipeIngredients = Array.isArray(data.ingredients)
                ? data.ingredients.map(i => i.toLowerCase())
                : (typeof data.ingredients === 'string' ? [data.ingredients.toLowerCase()] : []);
            const usedIngredients = inputIngredients.filter(i => recipeIngredients.includes(i));
            const missedIngredients = recipeIngredients.filter(i => !inputIngredients.includes(i));
            html += `<div class="recipe-result" data-id="${id}">
                <div class="recipe-title">${data.name ? capitalize(data.name) : 'Recipe'}</div>
                <div class="ingredient-list"><span>Used:</span> ${usedIngredients.length > 0 ? usedIngredients.join(', ') : 'None'}</div>
                <div class="ingredient-list"><span>Missed:</span> ${missedIngredients.length > 0 ? missedIngredients.join(', ') : 'None'}</div>
                <button class="view-btn" onclick="window.location.href='../recipe-details/recipe-details.html?id=${id}'">View Recipe</button>
            </div>`;
        }
    }
    container.innerHTML = html;
}

async function renderRecipe() {
    const container = document.getElementById("recipe-details");
    const docRef = doc(db, "Recipes", recipeId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        const data = docSnap.data();
        let html = "";
        if (data.name) {
            html += `<h2><a href="../recipe-details/recipe-details.html?id=${recipeId}" style="text-decoration: none; color: inherit;">${capitalize(data.name)}</a></h2>`;
        }
        const isSaved = userSavedRecipeIds.includes(recipeId);
        html += `<button id="saveRecipeBtn" class="save-recipe-btn${isSaved ? ' saved' : ''}" style="margin-bottom:20px;float:right;">
            <i class="fas ${isSaved ? 'fa-check' : 'fa-bookmark'}"></i>
            <span>${isSaved ? 'Saved' : 'Save'}</span>
        </button>`;
        if (data.ingredients) {
            html += `
                <div class="recipe-section">
                    <h3><i class="fas fa-list"></i> Ingredients</h3>
                    <ul class="ingredients-list">`;
            if (Array.isArray(data.ingredients)) {
                data.ingredients.forEach((ingredient, index) => {
                    // Check if quantities exist
                    if (data.quantities && Array.isArray(data.quantities) && data.quantities[index]) {
                        html += `<li><i class="fas fa-check"></i> ${ingredient} - ${data.quantities[index]}</li>`;
                    } else {
                        html += `<li><i class="fas fa-check"></i> ${ingredient}</li>`;
                    }
                });
            } else {
                html += `<li><i class="fas fa-check"></i> ${data.ingredients}</li>`;
            }
            html += `</ul></div>`;
        }
        if (data.steps || data.instructions) {
            const steps = data.steps || data.instructions;
            html += `
                <div class="recipe-section">
                    <h3><i class="fas fa-clipboard-list"></i> Steps</h3>
                    <ul class="instructions-list">`;
            if (Array.isArray(steps)) {
                steps.forEach(step => {
                    html += `<li>${step}</li>`;
                });
            } else {
                html += `<li>${steps}</li>`;
            }
            html += `</ul></div>`;
        }
        container.innerHTML = html;
        const saveBtn = document.getElementById('saveRecipeBtn');
        if (saveBtn) {
            saveBtn.onclick = async function() {
                const saveErrorContainer = document.getElementById('saveErrorContainer');
                saveErrorContainer.innerHTML = '';
                const user = auth.currentUser;
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
                    saveBtn.innerHTML = '<i class="fas fa-bookmark"></i><span>Save</span>';
                } else {
                    // Save
                    await setDoc(recipeRef, {
                        name: data.name,
                        savedAt: new Date()
                    });
                    userSavedRecipeIds.push(recipeId);
                    saveBtn.classList.add('saved');
                    saveBtn.innerHTML = '<i class="fas fa-check"></i><span>Saved</span>';
                }
            };
        }
    } else {
        container.innerHTML = "<p>Recipe not found.</p>";
    }
}

function capitalize(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
}

// Helper function to calculate total time from instructions
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

// Make functions available globally
window.capitalize = capitalize;
window.calculateTotalTime = calculateTotalTime;

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

document.querySelector("#search-btn").addEventListener("click", async () => {
    const input = document.querySelector("#search-box").value.trim().toLowerCase();
    const errorDiv = document.getElementById('searchError');
    const container = document.getElementById("recipe-details");
    
    errorDiv.style.display = 'none';
    errorDiv.textContent = '';
    
    if (!input) {
        errorDiv.textContent = "Please enter a recipe name.";
        errorDiv.style.display = 'block';
        return;
    }
    
    // Show loading message
    container.innerHTML = '<div class="loading">Searching recipes...</div>';
    
    const recipesRef = collection(db, "Recipes");
    const snapshot = await getDocs(recipesRef);
    const matchingRecipes = [];
    
    snapshot.forEach((docSnap) => {
        const name = (docSnap.data().name || '').toLowerCase();
        if (name.includes(input)) {
            matchingRecipes.push({
                id: docSnap.id,
                data: docSnap.data()
            });
        }
    });
    
    // Store search results and term in sessionStorage for back navigation
    sessionStorage.setItem('searchResults', JSON.stringify(matchingRecipes));
    sessionStorage.setItem('currentSearchTerm', input);
    
    if (matchingRecipes.length === 0) {
        errorDiv.textContent = 'No recipe found with that name.';
        errorDiv.style.display = 'block';
        container.innerHTML = '<p class="no-results">No recipes found matching your search.</p>';
    } else {
        displaySearchResults(matchingRecipes, input);
    }
});

// Function to display search results
function displaySearchResults(matchingRecipes, searchTerm) {
    const container = document.getElementById("recipe-details");
    
    let html = `<div class="search-results">
        <h3>Search Results for "${searchTerm}" (${matchingRecipes.length} recipe${matchingRecipes.length > 1 ? 's' : ''})</h3>
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
window.toggleMenu = toggleMenu;

// Set search bar placeholder and button text based on search type
const searchBox = document.getElementById('search-box');
const searchBtn = document.getElementById('search-btn');
if (ingredientSearch === '1') {
    searchBox.placeholder = 'Enter ingredients...';
    searchBtn.innerHTML = '<i class="fas fa-search"></i> Search Ingredients';
} else {
    searchBox.placeholder = 'Enter recipe name...';
    searchBtn.innerHTML = '<i class="fas fa-search"></i> Search';
}

// Add Enter key support for search
searchBox.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        searchBtn.click();
    }
});

// Global function for the back button
window.goBack = function() {
    console.log('Global goBack function called'); // Debug log
    const searchResults = sessionStorage.getItem('searchResults');
    const searchTerm = sessionStorage.getItem('currentSearchTerm');
    
    console.log('Search results:', searchResults); // Debug log
    console.log('Search term:', searchTerm); // Debug log
    
    if (searchResults && searchTerm) {
        try {
            document.getElementById('search-box').value = searchTerm;
            const results = JSON.parse(searchResults);
            
            // Simple display of results without complex formatting
            const container = document.getElementById("recipe-details");
            let html = `<div class="search-results">
                <h3>Search Results for "${searchTerm}" (${results.length} recipe${results.length > 1 ? 's' : ''})</h3>
                <div class="recipes-grid">`;
            
            results.forEach(recipe => {
                const isSaved = userSavedRecipeIds ? userSavedRecipeIds.includes(recipe.id) : false;
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
            console.log('Search results restored successfully'); // Debug log
        } catch (error) {
            console.error('Error restoring search results:', error); // Debug log
            window.history.back();
        }
    } else {
        console.log('No search results found, using normal back navigation'); // Debug log
        window.history.back();
    }
};

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

// Set up back button functionality after DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            console.log('Back button clicked via event listener'); // Debug log
            window.goBack();
        });
        console.log('Back button event listener added'); // Debug log
    } else {
        console.log('Back button not found'); // Debug log
    }
});