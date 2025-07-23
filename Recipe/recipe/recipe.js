function toggleMenu() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.overlay');
    sidebar.classList.toggle('active');
    if (overlay) overlay.classList.toggle('active');
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
    const overlay = document.querySelector('.overlay');
    
    // Check if sidebar is active and click is outside both sidebar and menu icon
    if (sidebar.classList.contains('active') && 
        !sidebar.contains(event.target) && 
        !menuIcon.contains(event.target)) {
        sidebar.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
    }
});


//Firebase logic
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
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

    if (user) {
        // User is signed in
        userIcon.href = "User.html";
        const userDoc = await getDocs(query(collection(db, "users"), where("email", "==", user.email)));
        if (!userDoc.empty) {
            const userData = userDoc.docs[0].data();
            userText.textContent = userData.firstname;
        }
    } else {
        // User is signed out
        userIcon.href = "Login.html";
        userText.textContent = "Login";
    }
});

// Load all recipes
const categoryNav = document.getElementById('category-nav');
const recipesRef = collection(db, "Recipes");
const recipesSnapshot = await getDocs(recipesRef);

if (!recipesSnapshot.empty) {
    // Convert to array and sort alphabetically
    const recipes = [];
    recipesSnapshot.forEach((doc) => {
        recipes.push({
            id: doc.id,
            ...doc.data()
        });
    });
    
    // Sort recipes alphabetically by name
    recipes.sort((a, b) => a.name.localeCompare(b.name));
    
    // Group recipes by first letter
    const groupedRecipes = {};
    recipes.forEach(recipe => {
        const firstLetter = recipe.name.charAt(0).toUpperCase();
        if (!groupedRecipes[firstLetter]) {
            groupedRecipes[firstLetter] = [];
        }
        groupedRecipes[firstLetter].push(recipe);
    });

    // Create HTML for grouped recipes
    Object.keys(groupedRecipes).sort().forEach(letter => {
        const categorySection = document.createElement('div');
        categorySection.className = 'category-section';
        categorySection.innerHTML = `
            <div class="category-header">${letter}</div>
            <div class="recipe-list">
                ${groupedRecipes[letter].map(recipe => {
                    const savedRecipes = JSON.parse(localStorage.getItem('savedRecipes')) || [];
                    const isSaved = savedRecipes.some(r => r.id === recipe.id);
                    return `
                        <div class="recipe-name" style="position: relative;">
                            <button class="save-recipe-btn ${isSaved ? 'saved' : ''}" onclick="toggleSaveRecipe('${recipe.id}', '${recipe.name}')">
                                <i class="fas ${isSaved ? 'fa-check' : 'fa-bookmark'}"></i>
                                <span>${isSaved ? 'Saved' : 'Save'}</span>
                            </button>
                            <a href="recipe-details.html?id=${recipe.id}" style="text-decoration: none; color: inherit; display: block; padding-right: 120px;">
                                ${recipe.name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                            </a>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
        categoryNav.appendChild(categorySection);
    });
} else {
    categoryNav.innerHTML = '<p style="color: #F5E6C8; text-align: center;">No recipes found.</p>';
}

function toggleMenu() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.overlay');
    sidebar.classList.toggle('active');
    if (overlay) overlay.classList.toggle('active');
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
    const overlay = document.querySelector('.overlay');
    
    // Check if sidebar is active and click is outside both sidebar and menu icon
    if (sidebar.classList.contains('active') && 
        !sidebar.contains(event.target) && 
        !menuIcon.contains(event.target)) {
        sidebar.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
    }
});

// Save recipe functionality
function toggleSaveRecipe(recipeId, recipeName) {
    const saveBtn = event.currentTarget;
    
    // Get existing saved recipes
    let savedRecipes = JSON.parse(localStorage.getItem('savedRecipes')) || [];
    
    // Check if recipe is already saved
    const isSaved = savedRecipes.some(r => r.id === recipeId);
    
    if (isSaved) {
        // Remove from saved recipes
        savedRecipes = savedRecipes.filter(r => r.id !== recipeId);
        saveBtn.classList.remove('saved');
        saveBtn.innerHTML = '<i class="fas fa-bookmark"></i><span>Save</span>';
    } else {
        // Add to saved recipes
        savedRecipes.push({
            id: recipeId,
            title: recipeName,
            cookingTime: '30 mins',
            calories: '350 kcal'
        });
        saveBtn.classList.add('saved');
        saveBtn.innerHTML = '<i class="fas fa-check"></i><span>Saved</span>';
    }
    
    // Update localStorage
    localStorage.setItem('savedRecipes', JSON.stringify(savedRecipes));
}
window.toggleMenu = toggleMenu;
