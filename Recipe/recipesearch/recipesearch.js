document.getElementById('backBtn').onclick = function() {
    window.history.back();
  };
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

const params = new URLSearchParams(window.location.search);
const recipeId = params.get("id");
const ingredientSearch = params.get("ingredientSearch");

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

if (ingredientSearch === '1') {
    // Ingredient-based search result
    const recipeIds = JSON.parse(sessionStorage.getItem('ingredientSearchResults') || '[]');
    renderRecipesByIds(recipeIds);
} else if (recipeId) {
    renderRecipe();
} else {
    document.getElementById("recipe-details").innerHTML = "<p>No recipe selected.</p>";
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

document.querySelector("#search-btn").addEventListener("click", async () => {
    const input = document.querySelector("#search-box").value.trim().toLowerCase();
    const errorDiv = document.getElementById('searchError');
    errorDiv.style.display = 'none';
    errorDiv.textContent = '';
    if (!input) {
        errorDiv.textContent = "Please enter a recipe name.";
        errorDiv.style.display = 'block';
        return;
    }
    const recipesRef = collection(db, "Recipes");
    const snapshot = await getDocs(recipesRef);
    let found = false;
    snapshot.forEach((docSnap) => {
        const name = (docSnap.data().name || '').toLowerCase();
        if (name.includes(input)) {
            window.location.replace(`../recipesearch/recipesearch.html?id=${docSnap.id}`);
            found = true;
        }
    });
    if (!found) {
        errorDiv.textContent = 'No recipe found with that name.';
        errorDiv.style.display = 'block';
    }
});
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