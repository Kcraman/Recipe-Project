import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, getDocs, query, where, doc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

document.addEventListener('DOMContentLoaded', function() {
    // Debug message to confirm script is running
    const debugBanner = document.createElement('div');
    debugBanner.textContent = 'Recipe JS loaded';
    debugBanner.style.position = 'fixed';
    debugBanner.style.bottom = '10px';
    debugBanner.style.right = '10px';
    debugBanner.style.background = 'rgba(0,0,0,0.7)';
    debugBanner.style.color = 'white';
    debugBanner.style.padding = '6px 12px';
    debugBanner.style.borderRadius = '6px';
    debugBanner.style.zIndex = '9999';
    document.body.appendChild(debugBanner);
    setTimeout(() => debugBanner.remove(), 3000);

    // Add event listener for hamburger menu
    const menuIcon = document.querySelector('.menu-icon');
    if (menuIcon) {
        menuIcon.addEventListener('click', toggleMenu);
        console.log('Hamburger menu event attached');
    } else {
        console.error('Hamburger menu not found');
    }

    // Sidebar close on link click
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
        if (sidebar.classList.contains('active') && 
            !sidebar.contains(event.target) && 
            !menuIcon.contains(event.target)) {
            sidebar.classList.remove('active');
            if (overlay) overlay.classList.remove('active');
        }
    });

    //Firebase logic
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
            // Fetch saved recipes for this user
            userSavedRecipeIds = await fetchUserSavedRecipeIds(user.uid);
            loadRecipes();
        } else {
            userIcon.href = "../login/Login.html";
            userText.textContent = "Login";
            userSavedRecipeIds = [];
            loadRecipes();
        }
    });

    async function fetchUserSavedRecipeIds(userId) {
        const savedRecipesRef = collection(db, 'users', userId, 'savedRecipes');
        const savedRecipesSnap = await getDocs(savedRecipesRef);
        return savedRecipesSnap.docs.map(docSnap => docSnap.id);
    }

    const categoryNav = document.getElementById('category-nav');
    const recipesRef = collection(db, "Recipes");

    async function loadRecipes() {
        try {
            const recipesSnapshot = await getDocs(recipesRef);
            if (!recipesSnapshot.empty) {
                const recipes = [];
                recipesSnapshot.forEach((doc) => {
                    recipes.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                recipes.sort((a, b) => a.name.localeCompare(b.name));
                const groupedRecipes = {};
                recipes.forEach(recipe => {
                    const firstLetter = recipe.name.charAt(0).toUpperCase();
                    if (!groupedRecipes[firstLetter]) {
                        groupedRecipes[firstLetter] = [];
                    }
                    groupedRecipes[firstLetter].push(recipe);
                });
                categoryNav.innerHTML = '';
                Object.keys(groupedRecipes).sort().forEach(letter => {
                    const categorySection = document.createElement('div');
                    categorySection.className = 'category-section';
                    categorySection.innerHTML = `
                        <div class="category-header">${letter}</div>
                        <div class="recipe-list">
                            ${groupedRecipes[letter].map(recipe => {
                                const isSaved = userSavedRecipeIds.includes(recipe.id);
                                return `
                                    <div class="recipe-name" style="position: relative;">
                                        <button class="save-recipe-btn ${isSaved ? 'saved' : ''}" onclick="toggleSaveRecipe('${recipe.id}', '${recipe.name}')">
                                            <i class="fas ${isSaved ? 'fa-check' : 'fa-bookmark'}"></i>
                                            <span>${isSaved ? 'Saved' : 'Save'}</span>
                                        </button>
                                        <a href="../recipe-details/recipe-details.html?id=${recipe.id}" style="text-decoration: none; color: inherit; display: block; padding-right: 120px;">
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
                categoryNav.innerHTML = '<p style="color: #F5E6C8; text-align: center;">No recipes found in the database.</p>';
            }
        } catch (error) {
            categoryNav.innerHTML = `<p style='color: red; text-align: center;'>Failed to load recipes: ${error.message}</p>`;
        }
    }

    window.toggleSaveRecipe = async function(recipeId, recipeName) {
        const saveBtn = event.currentTarget;
        const saveErrorContainer = document.getElementById('saveErrorContainer');
        saveErrorContainer.innerHTML = '';
        const user = getAuth().currentUser;
        if (!user) {
            saveErrorContainer.innerHTML = `
                <div class=\"simple-login-notification\">Please log in to save.</div>
            `;
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
            saveBtn.classList.remove('saved');
            saveBtn.innerHTML = '<i class="fas fa-bookmark"></i><span>Save</span>';
            userSavedRecipeIds = userSavedRecipeIds.filter(id => id !== recipeId);
        } else {
            // Save
            await setDoc(recipeRef, {
                name: recipeName,
                savedAt: new Date()
            });
            saveBtn.classList.add('saved');
            saveBtn.innerHTML = '<i class=\"fas fa-check\"></i><span>Saved</span>';
            userSavedRecipeIds.push(recipeId);
        }
    };

    // Sidebar toggle function
    function toggleMenu() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.querySelector('.overlay');
        sidebar.classList.toggle('active');
        if (overlay) overlay.classList.toggle('active');
        console.log('Sidebar toggled');
    }
});
