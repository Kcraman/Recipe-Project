// Recipe Management JavaScript
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

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

let allRecipes = [];
let filteredRecipes = [];
let currentEditRecipeId = null;

// Check admin authentication
function checkAdminAuth() {
    const adminEmail = sessionStorage.getItem('adminEmail');
    const adminUID = sessionStorage.getItem('adminUID');
    
    if (!adminEmail || !adminUID) {
        window.location.href = "../adminlogin/adminlogin.html";
        return false;
    }
    return true;
}

// Load admin name
async function loadAdminName() {
    const adminEmail = sessionStorage.getItem('adminEmail');
    if (adminEmail) {
        try {
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("email", "==", adminEmail));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                const userData = querySnapshot.docs[0].data();
                const adminName = userData.firstname + ' ' + userData.lastname;
                document.getElementById('adminName').textContent = adminName;
            }
        } catch (error) {
            console.error("Error loading admin name:", error);
        }
    }
}

// Load all recipes
async function loadRecipes() {
    try {
        const recipesRef = collection(db, "Recipes");
        const querySnapshot = await getDocs(recipesRef);
        
        allRecipes = [];
        querySnapshot.forEach(doc => {
            const recipeData = doc.data();
            allRecipes.push({
                id: doc.id,
                ...recipeData,
                createdAt: recipeData.createdAt || new Date(),
                isAdminRecipe: recipeData.isAdminRecipe || false,
                status: recipeData.status || 'public'
            });
        });
        
        filteredRecipes = [...allRecipes];
        updateStats();
        renderRecipes();
        
    } catch (error) {
        console.error("Error loading recipes:", error);
        showError("Failed to load recipes");
    }
}

// Update statistics
function updateStats() {
    const totalRecipes = allRecipes.length;
    const adminRecipes = allRecipes.filter(recipe => recipe.isAdminRecipe).length;
    const publicRecipes = allRecipes.filter(recipe => recipe.status === 'public').length;
    
    document.getElementById('totalRecipes').textContent = totalRecipes;
    document.getElementById('adminRecipes').textContent = adminRecipes;
    document.getElementById('publicRecipes').textContent = publicRecipes;
}

// Render recipes grid
function renderRecipes() {
    const grid = document.getElementById('recipesGrid');
    
    if (filteredRecipes.length === 0) {
        grid.innerHTML = `
            <div class="no-recipes">
                <i class="fas fa-utensils"></i>
                <p>No recipes found</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = filteredRecipes.map(recipe => {
        const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients.slice(0, 3).join(', ') : '';
        const moreIngredients = Array.isArray(recipe.ingredients) && recipe.ingredients.length > 3 ? ` +${recipe.ingredients.length - 3} more` : '';
        const recipeName = recipe.originalName || recipe.name || 'Untitled Recipe';
        
        return `
            <div class="recipe-card">
                <div class="recipe-content">
                    <h3 class="recipe-title">${recipeName}</h3>
                    <div class="recipe-ingredients">
                        <strong>Ingredients:</strong> ${ingredients}${moreIngredients}
                    </div>
                    <div class="recipe-actions">
                        <button class="action-btn edit-btn" onclick="editRecipe('${recipe.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="action-btn delete-btn" onclick="deleteRecipe('${recipe.id}', '${recipeName}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Search recipes
function searchRecipes(query) {
    if (!query.trim()) {
        filteredRecipes = [...allRecipes];
    } else {
        const searchTerm = query.toLowerCase();
        filteredRecipes = allRecipes.filter(recipe => 
            recipe.title?.toLowerCase().includes(searchTerm) ||
            recipe.description?.toLowerCase().includes(searchTerm) ||
            recipe.authorName?.toLowerCase().includes(searchTerm) ||
            recipe.category?.toLowerCase().includes(searchTerm)
        );
    }
    renderRecipes();
}

// Filter recipes by type
function filterRecipesByType(type) {
    if (!type) {
        filteredRecipes = [...allRecipes];
    } else {
        filteredRecipes = allRecipes.filter(recipe => 
            (type === 'admin' && recipe.isAdminRecipe) ||
            (type === 'user' && !recipe.isAdminRecipe)
        );
    }
    renderRecipes();
}

// Sort recipes
function sortRecipes(sortBy) {
    switch (sortBy) {
        case 'title':
            filteredRecipes.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
            break;
        case 'author':
            filteredRecipes.sort((a, b) => (a.authorName || '').localeCompare(b.authorName || ''));
            break;
        case 'date':
            filteredRecipes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
    }
    renderRecipes();
}

// Edit recipe
window.editRecipe = function(recipeId) {
    const recipe = allRecipes.find(r => r.id === recipeId);
    if (!recipe) return;
    
    currentEditRecipeId = recipeId;
    
    const recipeName = recipe.originalName || recipe.name || '';
    document.getElementById('editRecipeName').value = recipeName;
    
    // Clear existing ingredients and instructions
    const editIngredientsList = document.getElementById('editIngredientsList');
    const editInstructionsList = document.getElementById('editInstructionsList');
    
    // Keep only the first item in each list
    while (editIngredientsList.children.length > 1) {
        editIngredientsList.removeChild(editIngredientsList.lastChild);
    }
    while (editInstructionsList.children.length > 1) {
        editInstructionsList.removeChild(editInstructionsList.lastChild);
    }
    
    // Populate ingredients
    if (Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0) {
        const firstIngredientItem = editIngredientsList.querySelector('.list-item');
        const ingredientInputs = firstIngredientItem.querySelectorAll('input');
        if (ingredientInputs.length >= 2) {
            ingredientInputs[0].value = recipe.ingredients[0] || '';
            ingredientInputs[1].value = recipe.quantities && recipe.quantities[0] ? recipe.quantities[0] : '';
        }
        
        // Add additional ingredients
        for (let i = 1; i < recipe.ingredients.length; i++) {
            addEditIngredient();
            const newItem = editIngredientsList.lastElementChild;
            const inputs = newItem.querySelectorAll('input');
            if (inputs.length >= 2) {
                inputs[0].value = recipe.ingredients[i] || '';
                inputs[1].value = recipe.quantities && recipe.quantities[i] ? recipe.quantities[i] : '';
            }
        }
    }
    
    // Populate instructions
    if (Array.isArray(recipe.instructions) && recipe.instructions.length > 0) {
        const firstInstructionItem = editInstructionsList.querySelector('.list-item');
        const instructionInputs = firstInstructionItem.querySelectorAll('input');
        if (instructionInputs.length >= 3) {
            instructionInputs[0].value = recipe.instructions[0].text || '';
            const totalSeconds = recipe.instructions[0].time || 0;
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            instructionInputs[1].value = minutes;
            instructionInputs[2].value = seconds;
        }
        
        // Add additional instructions
        for (let i = 1; i < recipe.instructions.length; i++) {
            addEditInstruction();
            const newItem = editInstructionsList.lastElementChild;
            const inputs = newItem.querySelectorAll('input');
            if (inputs.length >= 3) {
                inputs[0].value = recipe.instructions[i].text || '';
                const totalSeconds = recipe.instructions[i].time || 0;
                const minutes = Math.floor(totalSeconds / 60);
                const seconds = totalSeconds % 60;
                inputs[1].value = minutes;
                inputs[2].value = seconds;
            }
        }
    }
    
    document.getElementById('editRecipeModal').style.display = 'block';
}

// Delete recipe
window.deleteRecipe = function(recipeId, recipeTitle) {
    currentEditRecipeId = recipeId;
    document.getElementById('deleteRecipeTitle').textContent = recipeTitle;
    document.getElementById('deleteRecipeModal').style.display = 'block';
}

// Close modal
window.closeModal = function(modalId) {
    document.getElementById(modalId).style.display = 'none';
    if (modalId === 'editRecipeModal') {
        currentEditRecipeId = null;
    }
}

// Add ingredient to edit modal
window.addEditIngredient = function() {
    const list = document.getElementById('editIngredientsList');
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
    removeBtn.addEventListener('click', () => removeEditItem(removeBtn));
    
    list.appendChild(item);
}

// Add instruction to edit modal
window.addEditInstruction = function() {
    const list = document.getElementById('editInstructionsList');
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
    removeBtn.addEventListener('click', () => removeEditItem(removeBtn));
    
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

// Remove item from edit modal
window.removeEditItem = function(button) {
    const list = button.parentElement.parentElement;
    if (list.children.length > 1) {
        button.parentElement.remove();
    }
}

// Save recipe changes
async function saveRecipeChanges() {
    if (!currentEditRecipeId) return;
    
    try {
        const recipeName = document.getElementById('editRecipeName').value;
        
        // Get ingredients with their quantities
        const ingredientItems = document.querySelectorAll('#editIngredientsList .list-item');
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
        const instructionItems = document.querySelectorAll('#editInstructionsList .list-item');
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

        const recipeRef = doc(db, "Recipes", currentEditRecipeId);
        await updateDoc(recipeRef, {
            originalName: recipeName,
            ingredients: ingredients,
            quantities: quantities,
            instructions: instructions,
            updatedAt: new Date()
        });
        
        // Update local data
        const recipeIndex = allRecipes.findIndex(r => r.id === currentEditRecipeId);
        if (recipeIndex !== -1) {
            allRecipes[recipeIndex] = {
                ...allRecipes[recipeIndex],
                originalName: recipeName,
                ingredients: ingredients,
                quantities: quantities,
                instructions: instructions
            };
        }
        
        closeModal('editRecipeModal');
        updateStats();
        renderRecipes();
        showSuccess('Recipe updated successfully');
        
    } catch (error) {
        console.error("Error updating recipe:", error);
        showError("Failed to update recipe");
    }
}

// Confirm delete recipe
async function confirmDeleteRecipe() {
    if (!currentEditRecipeId) return;
    
    try {
        const recipeRef = doc(db, "Recipes", currentEditRecipeId);
        await deleteDoc(recipeRef);
        
        // Remove from local data
        allRecipes = allRecipes.filter(r => r.id !== currentEditRecipeId);
        
        closeModal('deleteRecipeModal');
        updateStats();
        renderRecipes();
        showSuccess('Recipe deleted successfully');
        
    } catch (error) {
        console.error("Error deleting recipe:", error);
        showError("Failed to delete recipe");
    }
}

// Show success message
function showSuccess(message) {
    // You can implement a toast notification system here
    alert(message);
}

// Show error message
function showError(message) {
    // You can implement a toast notification system here
    alert('Error: ' + message);
}

// Logout function
async function logout() {
    try {
        await signOut(auth);
        sessionStorage.removeItem('adminEmail');
        sessionStorage.removeItem('adminUID');
        window.location.href = "../adminlogin/adminlogin.html";
    } catch (error) {
        console.error("Error during logout:", error);
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    if (!checkAdminAuth()) return;
    
    loadAdminName();
    loadRecipes();
    
    // Search functionality
    const searchInput = document.getElementById('searchRecipes');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => searchRecipes(e.target.value));
    }
    
    // Filter functionality
    const filterSelect = document.getElementById('filterType');
    if (filterSelect) {
        filterSelect.addEventListener('change', (e) => filterRecipesByType(e.target.value));
    }
    
    // Sort functionality
    const sortSelect = document.getElementById('sortRecipes');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => sortRecipes(e.target.value));
    }
    
    // Refresh button
    const refreshBtn = document.querySelector('.refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadRecipes);
    }
    
    // Edit form submission
    const editForm = document.getElementById('editRecipeForm');
    if (editForm) {
        editForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveRecipeChanges();
        });
    }
    
    // Delete confirmation
    const confirmDeleteBtn = document.getElementById('confirmDeleteRecipeBtn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', confirmDeleteRecipe);
    }
    
    // Logout functionality
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
        });
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
    
    // Set up initial event listeners for edit modal
    setupEditModalEventListeners();
});

// Setup event listeners for edit modal
function setupEditModalEventListeners() {
    // Add event listeners to the first ingredient's remove button
    const firstIngredientRemoveBtn = document.querySelector('#editIngredientsList .remove-btn');
    if (firstIngredientRemoveBtn) {
        firstIngredientRemoveBtn.addEventListener('click', () => removeEditItem(firstIngredientRemoveBtn));
    }
    
    // Add event listener to the first instruction's remove button
    const firstInstructionRemoveBtn = document.querySelector('#editInstructionsList .remove-btn');
    if (firstInstructionRemoveBtn) {
        firstInstructionRemoveBtn.addEventListener('click', () => removeEditItem(firstInstructionRemoveBtn));
    }
    
    // Add validation to the first instruction item
    const firstMinutesInput = document.querySelector('#editInstructionsList .minutes');
    const firstSecondsInput = document.querySelector('#editInstructionsList .seconds');
    
    if (firstMinutesInput && firstSecondsInput) {
        firstMinutesInput.addEventListener('input', function() {
            if (this.value < 0) this.value = 0;
        });
        
        firstSecondsInput.addEventListener('input', function() {
            if (this.value < 0) this.value = 0;
            if (this.value > 59) this.value = 59;
        });
    }
}

// Check authentication state
onAuthStateChanged(auth, (user) => {
    if (!user) {
        sessionStorage.removeItem('adminEmail');
        sessionStorage.removeItem('adminUID');
        window.location.href = "../adminlogin/adminlogin.html";
    }
});
