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
let userFavouriteRecipeIds = [];

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
        userFavouriteRecipeIds = await fetchUserFavouriteRecipeIds(user.uid);
        renderRecipe();
    } else {
        userIcon.href = "../login/Login.html";
        userText.textContent = "Login";
        userSavedRecipeIds = [];
        userFavouriteRecipeIds = [];
        renderRecipe();
    }
});

async function fetchUserSavedRecipeIds(userId) {
    const savedRecipesRef = collection(db, 'users', userId, 'savedRecipes');
    const savedRecipesSnap = await getDocs(savedRecipesRef);
    return savedRecipesSnap.docs.map(docSnap => docSnap.id);
}

async function fetchUserFavouriteRecipeIds(userId) {
    const favouriteRecipesRef = collection(db, 'users', userId, 'favouriteRecipes');
    const favouriteRecipesSnap = await getDocs(favouriteRecipesRef);
    return favouriteRecipesSnap.docs.map(docSnap => docSnap.id);
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
        
        // Check if current user is the creator of this recipe
        const isCreator = recipeData.createdByEmail && recipeData.createdByEmail === auth.currentUser?.email;
        
        // Add delete button if user is the creator
        if (isCreator) {
            const recipeActions = document.querySelector('.recipe-actions');
            const deleteBtn = document.createElement('button');
            deleteBtn.id = 'deleteRecipeBtn';
            deleteBtn.className = 'delete-recipe-btn';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i><span>Delete Recipe</span>';
            deleteBtn.onclick = () => showDeleteConfirmation(recipeId, recipeData.name);
            deleteBtn.style.cssText = `
                background: #dc3545;
                color: white;
                border: none;
                border-radius: 8px;
                padding: 12px 20px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 8px;
            `;
            recipeActions.appendChild(deleteBtn);
        }
        // ... (ingredients and instructions rendering unchanged) ...
        const ingredientsList = document.getElementById('ingredientsList');
        ingredientsList.innerHTML = '';
        if (recipeData.ingredients && Array.isArray(recipeData.ingredients)) {
            recipeData.ingredients.forEach((ingredient, index) => {
                const li = document.createElement('li');
                
                // Check if quantities exist
                if (recipeData.quantities && Array.isArray(recipeData.quantities) && recipeData.quantities[index]) {
                    li.innerHTML = `
                        <div class="ingredient-content">
                            <span class="ingredient-name"><i class="fas fa-check"></i> ${ingredient}</span>
                            <span class="ingredient-quantity">${recipeData.quantities[index]}</span>
                        </div>
                    `;
                } else {
                    // Fallback for old recipes without quantities
                    li.innerHTML = `<i class="fas fa-check"></i> ${ingredient}`;
                }
                
                ingredientsList.appendChild(li);
            });
        } else {
            ingredientsList.innerHTML = '<li>No ingredients available</li>';
        }
        const instructionsList = document.getElementById('instructionsList');
        instructionsList.innerHTML = '';
        let totalTime = 0;
        
        if (recipeData.instructions && Array.isArray(recipeData.instructions)) {
            recipeData.instructions.forEach((instruction, index) => {
                const li = document.createElement('li');
                if (typeof instruction === 'object' && instruction.text && instruction.time !== undefined) {
                    // New format with time
                    li.innerHTML = `
                        <div class="instruction-content">
                            <span class="instruction-text">${instruction.text}</span>
                            <span class="instruction-time">${formatTime(instruction.time)}</span>
                        </div>
                    `;
                    li.dataset.time = instruction.time;
                    totalTime += instruction.time;
                } else {
                    // Old format (just text)
                    li.textContent = instruction;
                    li.dataset.time = 60; // Default 1 minute for old recipes
                    totalTime += 60;
                }
                li.dataset.step = index + 1;
                instructionsList.appendChild(li);
            });
            
            // Display total time
            document.getElementById('totalTimeDisplay').textContent = formatTime(totalTime);
        } else {
            instructionsList.innerHTML = '<li>No instructions available</li>';
            document.getElementById('totalTimeDisplay').textContent = '00:00';
        }
        // Set save button state
        if (userSavedRecipeIds.includes(recipeId)) {
            saveBtn.classList.add('saved');
            saveBtn.innerHTML = '<i class="fas fa-check"></i><span>Saved</span>';
        } else {
            saveBtn.classList.remove('saved');
            saveBtn.innerHTML = '<i class="fas fa-bookmark"></i><span>Save Recipe</span>';
        }

        // Set favourite button state
        const favouriteBtn = document.getElementById('favouriteRecipeBtn');
        if (userFavouriteRecipeIds.includes(recipeId)) {
            favouriteBtn.classList.add('favourited');
            favouriteBtn.innerHTML = '<i class="fas fa-heart"></i><span>Favourited</span>';
        } else {
            favouriteBtn.classList.remove('favourited');
            favouriteBtn.innerHTML = '<i class="fas fa-heart"></i><span>Favourite Recipe</span>';
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

window.toggleFavouriteRecipe = async function() {
    const favouriteBtn = document.getElementById('favouriteRecipeBtn');
    const recipeName = document.getElementById('recipeName').textContent;
    const saveErrorContainer = document.getElementById('saveErrorContainer');
    saveErrorContainer.innerHTML = '';
    const user = getAuth().currentUser;
    if (!user) {
        saveErrorContainer.innerHTML = `<div class=\"simple-login-notification\">Please log in to favourite.</div>`;
        saveErrorContainer.style.display = 'block';
        setTimeout(() => {
            saveErrorContainer.style.display = 'none';
            saveErrorContainer.innerHTML = '';
        }, 5000);
        return;
    }
    const recipeRef = doc(db, 'users', user.uid, 'favouriteRecipes', recipeId);
    if (userFavouriteRecipeIds.includes(recipeId)) {
        // Unfavourite
        await deleteDoc(recipeRef);
        userFavouriteRecipeIds = userFavouriteRecipeIds.filter(id => id !== recipeId);
        favouriteBtn.classList.remove('favourited');
        favouriteBtn.innerHTML = '<i class="fas fa-heart"></i><span>Favourite Recipe</span>';
    } else {
        // Favourite
        await setDoc(recipeRef, {
            name: recipeName,
            favouritedAt: new Date()
        });
        userFavouriteRecipeIds.push(recipeId);
        favouriteBtn.classList.add('favourited');
        favouriteBtn.innerHTML = '<i class="fas fa-heart"></i><span>Favourited</span>';
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
                    Recipe deleted successfully! Redirecting...
                </div>
            `;
            saveErrorContainer.style.display = 'block';
            
            // Redirect back to recipes page after 2 seconds
            setTimeout(() => {
                window.location.href = '../recipe/Recipe.html';
            }, 2000);
            
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
// Real-time Guide Variables
let currentStep = 0;
let timer = null;
let isPaused = false;
let totalTime = 0;
let elapsedTime = 0;
let instructions = [];

// Helper function to format time
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Notification function
function showStepNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `step-notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Real-time Guide Functions
function startGuide() {
    const startBtn = document.getElementById('startGuideBtn');
    const pauseBtn = document.getElementById('pauseGuideBtn');
    const finishBtn = document.getElementById('finishGuideBtn');
    const timerDisplay = document.getElementById('timerDisplay');
    
    startBtn.style.display = 'none';
    pauseBtn.style.display = 'flex';
    finishBtn.style.display = 'flex';
    timerDisplay.style.display = 'block';
    
    // Get all instructions
    const instructionElements = document.querySelectorAll('#instructionsList li');
    instructions = Array.from(instructionElements).map(li => ({
        element: li,
        time: parseInt(li.dataset.time) || 60,
        step: parseInt(li.dataset.step)
    }));
    
    currentStep = 0;
    elapsedTime = 0;
    isPaused = false;
    
    if (instructions.length > 0) {
        showStepNotification('Guide started!', 'info');
        startStep(0);
    }
}

function startStep(stepIndex) {
    if (stepIndex >= instructions.length) {
        finishGuide();
        return;
    }
    
    currentStep = stepIndex;
    const step = instructions[stepIndex];
    
    // Calculate cumulative time up to this step
    let cumulativeTime = 0;
    for (let i = 0; i < stepIndex; i++) {
        cumulativeTime += instructions[i].time;
    }
    
    // Update UI with step info and cumulative time
    document.getElementById('currentStepText').textContent = `Step ${step.step} (${formatTime(cumulativeTime)} elapsed)`;
    document.getElementById('timerText').textContent = formatTime(step.time);
    
    // Calculate and display total remaining time
    let totalRemaining = step.time;
    for (let i = stepIndex + 1; i < instructions.length; i++) {
        totalRemaining += instructions[i].time;
    }
    document.getElementById('totalRemainingText').textContent = formatTime(totalRemaining);
    
    // Highlight current step
    instructions.forEach((s, index) => {
        s.element.classList.remove('active', 'completed');
        if (index < stepIndex) {
            s.element.classList.add('completed');
        } else if (index === stepIndex) {
            s.element.classList.add('active');
        }
    });
    
    // Reset progress
    document.getElementById('progressFill').style.width = '0%';
    
    // Start timer
    totalTime = step.time;
    elapsedTime = 0;
    
    if (timer) clearInterval(timer);
    
    timer = setInterval(() => {
        if (!isPaused) {
            elapsedTime++;
            const remainingTime = totalTime - elapsedTime;
            
            if (remainingTime <= 0) {
                // Step completed
                clearInterval(timer);
                
                // Show completion notification with cumulative time
                const newCumulativeTime = cumulativeTime + step.time;
                showStepNotification(`Step ${step.step} completed! (${formatTime(newCumulativeTime)} total)`, 'success');
                
                // Auto-advance to next step after 2 seconds
                setTimeout(() => {
                    startStep(stepIndex + 1);
                }, 2000);
            } else {
                // Update timer display
                document.getElementById('timerText').textContent = formatTime(remainingTime);
                
                // Calculate and update total remaining time
                let totalRemaining = remainingTime;
                for (let i = stepIndex + 1; i < instructions.length; i++) {
                    totalRemaining += instructions[i].time;
                }
                document.getElementById('totalRemainingText').textContent = formatTime(totalRemaining);
                
                // Update progress bar
                const progress = ((totalTime - remainingTime) / totalTime) * 100;
                document.getElementById('progressFill').style.width = progress + '%';
            }
        }
    }, 1000);
}

function pauseGuide() {
    isPaused = !isPaused;
    const pauseBtn = document.getElementById('pauseGuideBtn');
    
    if (isPaused) {
        pauseBtn.innerHTML = '<i class="fas fa-play"></i><span>Resume</span>';
        pauseBtn.classList.remove('pause-btn');
        pauseBtn.classList.add('resume-btn');
    } else {
        pauseBtn.innerHTML = '<i class="fas fa-pause"></i><span>Pause</span>';
        pauseBtn.classList.remove('resume-btn');
        pauseBtn.classList.add('pause-btn');
    }
}

function finishGuide() {
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
    
    const startBtn = document.getElementById('startGuideBtn');
    const pauseBtn = document.getElementById('pauseGuideBtn');
    const finishBtn = document.getElementById('finishGuideBtn');
    const timerDisplay = document.getElementById('timerDisplay');
    
    startBtn.style.display = 'flex';
    pauseBtn.style.display = 'none';
    finishBtn.style.display = 'none';
    timerDisplay.style.display = 'none';
    
    // Reset all highlights
    instructions.forEach(step => {
        step.element.classList.remove('active', 'completed');
    });
    
    // Reset variables
    currentStep = 0;
    isPaused = false;
    totalTime = 0;
    elapsedTime = 0;
    instructions = [];
    
    showStepNotification('Your Recipe is Ready!', 'info');
}

// Add event listeners for guide controls
document.addEventListener('DOMContentLoaded', function() {
    const startBtn = document.getElementById('startGuideBtn');
    const pauseBtn = document.getElementById('pauseGuideBtn');
    const finishBtn = document.getElementById('finishGuideBtn');
    
    if (startBtn) startBtn.addEventListener('click', startGuide);
    if (pauseBtn) pauseBtn.addEventListener('click', pauseGuide);
    if (finishBtn) finishBtn.addEventListener('click', finishGuide);
});

window.toggleMenu = toggleMenu;
window.toggleSaveRecipe = window.toggleSaveRecipe;