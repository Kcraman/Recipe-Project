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
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
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

const params = new URLSearchParams(window.location.search);
const recipeId = params.get("id");

const container = document.getElementById("recipe-details");

if (recipeId) {
    const docRef = doc(db, "Recipes", recipeId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const data = docSnap.data();
        let html = "";

        // Recipe Title
        if (data.name) {
            html += `<h2><a href="recipe-details.html?id=${recipeId}" style="text-decoration: none; color: inherit;">${capitalize(data.name)}</a></h2>`;
        }

        // Save Button
        const savedRecipes = JSON.parse(localStorage.getItem('savedRecipes')) || [];
        const isSaved = savedRecipes.some(r => r.id === recipeId);
        html += `<button id="saveRecipeBtn" class="save-recipe-btn${isSaved ? ' saved' : ''}" style="margin-bottom:20px;float:right;">
            <i class="fas ${isSaved ? 'fa-check' : 'fa-bookmark'}"></i>
            <span>${isSaved ? 'Saved' : 'Save'}</span>
        </button>`;

        // Ingredients Section
        if (data.ingredients) {
            html += `
                <div class="recipe-section">
                    <h3><i class="fas fa-list"></i> Ingredients</h3>
                    <ul class="ingredients-list">`;
            if (Array.isArray(data.ingredients)) {
                data.ingredients.forEach(ingredient => {
                    html += `<li><i class="fas fa-check"></i> ${ingredient}</li>`;
                });
            } else {
                html += `<li><i class="fas fa-check"></i> ${data.ingredients}</li>`;
            }
            html += `</ul></div>`;
        }

        // Steps/Instructions Section
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

        // Add save/unsave logic after rendering
        const saveBtn = document.getElementById('saveRecipeBtn');
        if (saveBtn) {
            saveBtn.onclick = async function() {
                // Save to localStorage
                let savedRecipes = JSON.parse(localStorage.getItem('savedRecipes')) || [];
                const isSaved = savedRecipes.some(r => r.id === recipeId);
                if (isSaved) {
                    savedRecipes = savedRecipes.filter(r => r.id !== recipeId);
                    saveBtn.classList.remove('saved');
                    saveBtn.innerHTML = '<i class="fas fa-bookmark"></i><span>Save</span>';
                } else {
                    savedRecipes.push({
                        id: recipeId,
                        title: data.name,
                        cookingTime: data.cookingTime || '',
                        calories: data.calories || ''
                    });
                    saveBtn.classList.add('saved');
                    saveBtn.innerHTML = '<i class="fas fa-check"></i><span>Saved</span>';
                }
                localStorage.setItem('savedRecipes', JSON.stringify(savedRecipes));

                // Save to Firestore under user's savedRecipes if logged in
                const user = auth.currentUser;
                if (!user) {
                    alert('Please log in to save recipes.');
                    return;
                }
                try {
                    const { doc, setDoc, collection } = await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js');
                    await setDoc(doc(collection(db, 'users', user.uid, 'savedRecipes'), recipeId), {
                        ...data,
                        savedAt: new Date()
                    });
                } catch (e) {
                    alert('Error saving recipe to your account.');
                }
            };
        }
    } else {
        container.innerHTML = "<p>Recipe not found.</p>";
    }
} else {
    container.innerHTML = "<p>No recipe ID provided.</p>";
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
    const q = query(recipesRef, where("name", "==", input));
    const recipe = await getDocs(q);
    if (recipe.empty) {
        errorDiv.textContent = 'No recipe found with that name.';
        errorDiv.style.display = 'block';
    } else {
        recipe.forEach((doc) => {
            window.location.replace(`recipesearch.html?id=${doc.id}`);
        });
    }
});
window.toggleMenu = toggleMenu;