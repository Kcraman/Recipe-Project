// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, addDoc, query, where, getDocs, doc, setDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

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

// DOM elements
const adminNameElement = document.getElementById('adminName');
const logoutBtn = document.getElementById('logoutBtn');
const recipeForm = document.getElementById('recipeForm');

// Check if user is admin
async function checkAdminAuth() {
    const adminEmail = sessionStorage.getItem('adminEmail');
    const adminUID = sessionStorage.getItem('adminUID');
    
    if (!adminEmail || !adminUID) {
        window.location.href = '../adminlogin/adminlogin.html';
        return false;
    }
    
    return true;
}

// Load admin name
async function loadAdminName() {
    const adminEmail = sessionStorage.getItem('adminEmail');
    if (adminEmail) {
        try {
            const userQuery = query(collection(db, "users"), where("email", "==", adminEmail));
            const userSnapshot = await getDocs(userQuery);
            
            if (!userSnapshot.empty) {
                const userData = userSnapshot.docs[0].data();
                adminNameElement.textContent = `${userData.firstname} ${userData.lastname}`;
            }
        } catch (error) {
            console.error("Error loading admin name:", error);
        }
    }
}

// Add ingredient function
function addIngredient() {
    const list = document.getElementById('ingredientsList');
    const item = document.createElement('div');
    item.className = 'list-item';
    item.innerHTML = `
        <div class="ingredient-inputs">
            <input type="text" placeholder="Enter ingredient" required>
            <input type="text" placeholder="Quantity (e.g., 2 cups)" required>
        </div>
        <button type="button" class="remove-btn">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add event listener to the remove button
    const removeBtn = item.querySelector('.remove-btn');
    removeBtn.addEventListener('click', () => removeItem(removeBtn));
    
    list.appendChild(item);
}

// Add instruction function
function addInstruction() {
    const list = document.getElementById('instructionsList');
    const item = document.createElement('div');
    item.className = 'list-item';
    item.innerHTML = `
        <div class="instruction-inputs">
            <input type="text" placeholder="Enter instruction step" required>
            <div class="time-input-group">
                <input type="number" min="0" placeholder="Min" class="time-input minutes" required>
                <span class="time-separator">:</span>
                <input type="number" min="0" max="59" placeholder="Sec" class="time-input seconds" required>
            </div>
        </div>
        <button type="button" class="remove-btn">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add event listener to the remove button
    const removeBtn = item.querySelector('.remove-btn');
    removeBtn.addEventListener('click', () => removeItem(removeBtn));
    
    // Add input validation for time fields
    const minutesInput = item.querySelector('.minutes');
    const secondsInput = item.querySelector('.seconds');
    
    minutesInput.addEventListener('input', function() {
        if (this.value < 0) this.value = 0;
    });
    
    secondsInput.addEventListener('input', function() {
        if (this.value < 0) this.value = 0;
        if (this.value > 59) this.value = 59;
    });
    
    list.appendChild(item);
}

// Remove item function
function removeItem(button) {
    const list = button.parentElement.parentElement;
    if (list.children.length > 1) {
        button.parentElement.remove();
    }
}

// Show error message
function showError(message) {
    const errorContainer = document.getElementById('errorContainer');
    errorContainer.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    errorContainer.style.display = 'block';
    setTimeout(() => {
        errorContainer.style.display = 'none';
    }, 5000);
}

// Show success message
function showSuccess(message) {
    const successContainer = document.getElementById('successContainer');
    successContainer.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    successContainer.style.display = 'block';
    setTimeout(() => {
        successContainer.style.display = 'none';
    }, 5000);
}

// Logout function
function logout() {
    signOut(auth).then(() => {
        sessionStorage.removeItem('adminEmail');
        sessionStorage.removeItem('adminUID');
        window.location.href = '../adminlogin/adminlogin.html';
    }).catch((error) => {
        console.error("Error signing out:", error);
    });
}

// Initialize page
async function initializePage() {
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) return;
    
    await loadAdminName();
    
    // Add event listeners for add buttons
    const addIngredientBtn = document.querySelector('#ingredientsList + .add-btn');
    const addInstructionBtn = document.querySelector('#instructionsList + .add-btn');
    
    if (addIngredientBtn) {
        addIngredientBtn.addEventListener('click', addIngredient);
    }
    
    if (addInstructionBtn) {
        addInstructionBtn.addEventListener('click', addInstruction);
    }
    
    // Add event listener to the first ingredient's remove button
    const firstIngredientRemoveBtn = document.querySelector('#ingredientsList .remove-btn');
    if (firstIngredientRemoveBtn) {
        firstIngredientRemoveBtn.removeAttribute('onclick');
        firstIngredientRemoveBtn.addEventListener('click', () => removeItem(firstIngredientRemoveBtn));
    }
    
    // Add event listener to the first instruction's remove button
    const firstInstructionRemoveBtn = document.querySelector('#instructionsList .remove-btn');
    if (firstInstructionRemoveBtn) {
        firstInstructionRemoveBtn.removeAttribute('onclick');
        firstInstructionRemoveBtn.addEventListener('click', () => removeItem(firstInstructionRemoveBtn));
    }
    
    // Add validation to the first instruction item
    const firstMinutesInput = document.querySelector('#instructionsList .minutes');
    const firstSecondsInput = document.querySelector('#instructionsList .seconds');
    
    if (firstMinutesInput && firstSecondsInput) {
        firstMinutesInput.addEventListener('input', function() {
            if (this.value < 0) this.value = 0;
        });
        
        firstSecondsInput.addEventListener('input', function() {
            if (this.value < 0) this.value = 0;
            if (this.value > 59) this.value = 59;
        });
    }
    
    // Handle form submission
    recipeForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const recipeName = document.getElementById('recipeName').value;
        
        // Get ingredients with their quantities
        const ingredientItems = document.querySelectorAll('#ingredientsList .list-item');
        const ingredients = [];
        const quantities = [];
        
        ingredientItems.forEach(item => {
            const ingredientInputs = item.querySelectorAll('input');
            if (ingredientInputs.length >= 2) {
                ingredients.push(ingredientInputs[0].value);
                quantities.push(ingredientInputs[1].value);
            }
        });
        
        // Get instructions with their times
        const instructionItems = document.querySelectorAll('#instructionsList .list-item');
        const instructions = [];
        instructionItems.forEach(item => {
            const instructionText = item.querySelector('input[type="text"]').value;
            const minutes = parseInt(item.querySelector('.minutes').value) || 0;
            const seconds = parseInt(item.querySelector('.seconds').value) || 0;
            const totalSeconds = minutes * 60 + seconds;
            
            // Ensure minimum time of 10 seconds
            const finalTime = Math.max(totalSeconds, 10);
            
            instructions.push({
                text: instructionText,
                time: finalTime
            });
        });

        try {
            // Get admin info
            const adminEmail = sessionStorage.getItem('adminEmail');
            const userQuery = query(collection(db, "users"), where("email", "==", adminEmail));
            const userSnapshot = await getDocs(userQuery);
            let adminName = "Admin";
            
            if (!userSnapshot.empty) {
                const userData = userSnapshot.docs[0].data();
                adminName = `${userData.firstname} ${userData.lastname}`;
            }

            // Create document with recipe name as ID (NO admin name appended)
            const recipeId = recipeName.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '');
            await setDoc(doc(db, "Recipes", recipeId), {
                name: recipeName, // Just the recipe name, no admin name
                originalName: recipeName,
                ingredients: ingredients,
                quantities: quantities,
                instructions: instructions,
                createdBy: adminName,
                createdByEmail: adminEmail,
                createdAt: new Date(),
                isAdminRecipe: true // Mark as admin-created recipe
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
            
            // Add validation to the first instruction item
            const firstMinutesInput = document.querySelector('#instructionsList .minutes');
            const firstSecondsInput = document.querySelector('#instructionsList .seconds');
            
            if (firstMinutesInput && firstSecondsInput) {
                firstMinutesInput.addEventListener('input', function() {
                    if (this.value < 0) this.value = 0;
                });
                
                firstSecondsInput.addEventListener('input', function() {
                    if (this.value < 0) this.value = 0;
                    if (this.value > 59) this.value = 59;
                });
            }
        } catch (error) {
            showError("Error creating recipe: " + error.message);
        }
    });
}

// Event listeners
document.addEventListener('DOMContentLoaded', initializePage);
logoutBtn.addEventListener('click', logout);

// Auth state change listener
onAuthStateChanged(auth, (user) => {
    if (!user) {
        sessionStorage.removeItem('adminEmail');
        sessionStorage.removeItem('adminUID');
        window.location.href = '../adminlogin/adminlogin.html';
    }
});

// Make functions available globally
window.addIngredient = addIngredient;
window.addInstruction = addInstruction;
window.removeItem = removeItem;
