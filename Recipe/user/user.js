function toggleMenu() {
    document.getElementById('sidebar').classList.toggle('active');
}

function goBack() {
    window.location.href = "home.html";
}

document.querySelectorAll('.sidebar a').forEach(link => {
    link.addEventListener('click', () => {
        document.getElementById('sidebar').classList.remove('active');
    });
});

document.addEventListener('click', function(event) {
    const sidebar = document.getElementById('sidebar');
    const menuIcon = document.querySelector('.menu-icon');
    
    if (sidebar.classList.contains('active') && 
        !sidebar.contains(event.target) && 
        !menuIcon.contains(event.target)) {
        sidebar.classList.remove('active');
    }
});

//Firebase logic
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, doc, deleteDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
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

let userSavedRecipeIds = [];

onAuthStateChanged(auth, async (user) => {
    if (user) {
        // User is signed in
        const userDoc = await getDocs(query(collection(db, "users"), where("email", "==", user.email)));
        if (!userDoc.empty) {
            const userData = userDoc.docs[0].data();
            document.getElementById('userName').textContent = `${userData.firstname} ${userData.lastname}`;
            document.getElementById('userEmail').textContent = user.email;

            // Load saved recipes from Firestore
            userSavedRecipeIds = await fetchUserSavedRecipeIds(user.uid);
            loadSavedRecipes(user.uid);

            // Load user's added recipes
            const addedRecipesQuery = await getDocs(query(collection(db, "Recipes"), where("createdBy", "==", `${userData.firstname} ${userData.lastname}`)));
            const addedRecipes = addedRecipesQuery.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            const addedRecipesGrid = document.getElementById('addedRecipesGrid');
            if (addedRecipes.length === 0) {
                addedRecipesGrid.innerHTML = '<p style="color: #666; text-align: center;">No recipes added yet</p>';
            } else {
                addedRecipesGrid.innerHTML = addedRecipes.map(recipe => `
                    <a href="../recipe-details/recipe-details.html?id=${recipe.id}" class="recipe-card" style="text-decoration:none;">
                        <div class="recipe-icon">
                            <i class="fas fa-utensils"></i>
                        </div>
                        <div class="recipe-info">
                            <div class="recipe-name" style="color:#5B4B3A;text-decoration:none;">
                                ${recipe.name.charAt(0).toUpperCase() + recipe.name.slice(1)}
                            </div>
                        </div>
                    </a>
                `).join('');
            }
        }
    } else {
        // User is signed out, redirect to login
        window.location.href = "../login/Login.html";
    }
});

async function fetchUserSavedRecipeIds(userId) {
    const savedRecipesRef = collection(db, 'users', userId, 'savedRecipes');
    const savedRecipesSnap = await getDocs(savedRecipesRef);
    return savedRecipesSnap.docs.map(docSnap => docSnap.id);
}

async function loadSavedRecipes(userId) {
    const savedRecipesGrid = document.getElementById('savedRecipesGrid');
    const savedRecipesRef = collection(db, 'users', userId, 'savedRecipes');
    const savedRecipesSnap = await getDocs(savedRecipesRef);
    const savedRecipes = [];
    savedRecipesSnap.forEach(docSnap => {
        const data = docSnap.data();
        savedRecipes.push({
            id: docSnap.id,
            title: data.name || data.title || '',
            ...data
        });
    });
    if (savedRecipes.length === 0) {
        savedRecipesGrid.innerHTML = '<p style="color: #666; text-align: center;">No saved recipes yet</p>';
    } else {
        savedRecipesGrid.innerHTML = savedRecipes.map(recipe => `
            <a href="../recipe-details/recipe-details.html?id=${recipe.id}" class="recipe-card">
                <div class="recipe-icon">
                    <i class="fas fa-utensils"></i>
                </div>
                <div class="recipe-info">
                    <div class="recipe-name" style="color:#5B4B3A;text-decoration:none;">
                        ${recipe.title.charAt(0).toUpperCase() + recipe.title.slice(1)}
                    </div>
                </div>
                <span class="recipe-bookmark" onclick="toggleSaveRecipe(event, '${recipe.id}', '${encodeURIComponent(JSON.stringify(recipe))}')">
                    <i class='fas fa-bookmark'></i>
                </span>
            </a>
        `).join('');
    }
}

window.logout = async function() {
    try {
        await signOut(auth);
        window.location.href = "../login/Login.html";
    } catch (error) {
        console.error("Error signing out:", error);
    }
};

window.toggleSaveRecipe = async function(event, recipeId, recipeDataEncoded) {
    event.preventDefault();
    event.stopPropagation();
    const iconSpan = event.currentTarget;
    const user = auth.currentUser;
    if (!user) return;
    const recipeRef = doc(db, 'users', user.uid, 'savedRecipes', recipeId);
    if (userSavedRecipeIds.includes(recipeId)) {
        // Unsave
        await deleteDoc(recipeRef);
        userSavedRecipeIds = userSavedRecipeIds.filter(id => id !== recipeId);
        iconSpan.innerHTML = `<img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z' fill='none'/></svg>" alt="Unsaved" style="width: 20px; height: 20px; vertical-align: middle; cursor:pointer;" />`;
        iconSpan.removeAttribute('title');
        iconSpan.onclick = function(e) { window.toggleSaveRecipe(e, recipeId, recipeDataEncoded); };
    } else {
        // Save
        const recipeData = JSON.parse(decodeURIComponent(recipeDataEncoded));
        await setDoc(recipeRef, {
            name: recipeData.title || recipeData.name,
            savedAt: new Date()
        });
        userSavedRecipeIds.push(recipeId);
        iconSpan.innerHTML = `<i class='fas fa-bookmark'></i>`;
        iconSpan.removeAttribute('title');
        iconSpan.onclick = function(e) { window.toggleSaveRecipe(e, recipeId, recipeDataEncoded); };
    }
}
window.toggleMenu = toggleMenu;