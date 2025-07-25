import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
        import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
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
                userIcon.href = "../user/User.html";
                const userDoc = await getDocs(query(collection(db, "users"), where("email", "==", user.email)));
                if (!userDoc.empty) {
                    const userData = userDoc.docs[0].data();
                    userText.textContent = userData.firstname;
                }
            } else {
                // User is signed out
                userIcon.href = "../login/Login.html";
                userText.textContent = "Login";
            }
        });

        // Sidebar functionality
        window.toggleSidebar = function() {
            const sidebar = document.querySelector('.sidebar');
            sidebar.classList.toggle('active');
        }

        // Add event listeners for sidebar links
        document.querySelectorAll('.sidebar a').forEach(link => {
            link.addEventListener('click', () => {
                document.querySelector('.sidebar').classList.remove('active');
            });
        });

        // Add click event listener to close sidebar when clicking outside
        document.addEventListener('click', function(event) {
            const sidebar = document.querySelector('.sidebar');
            const menuIcon = document.querySelector('.menu-icon');
            
            if (sidebar.classList.contains('active') && 
                !sidebar.contains(event.target) && 
                !menuIcon.contains(event.target)) {
                sidebar.classList.remove('active');
            }
        });

        // Load saved recipes from localStorage
        function loadSavedRecipes() {
            const savedRecipes = JSON.parse(localStorage.getItem('savedRecipes')) || [];
            const savedRecipesGrid = document.getElementById('savedRecipesGrid');

            if (savedRecipes.length === 0) {
                savedRecipesGrid.innerHTML = '<div class="no-saved-recipes">No saved recipes yet</div>';
                return;
            }

            // Sort recipes alphabetically by title
            savedRecipes.sort((a, b) => a.title.localeCompare(b.title));

            savedRecipesGrid.innerHTML = savedRecipes.map(recipe => `
                <div class="recipe-card">
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <h3 style="cursor:pointer;color:#5B4B3A;margin:0;" onclick="viewRecipe('${recipe.id}')">${recipe.title.charAt(0).toUpperCase() + recipe.title.slice(1)}</h3>
                        <button class="remove-saved-btn" style="margin-left: 24px;" onclick="removeSavedRecipe('${recipe.id}')">Remove</button>
                    </div>
                </div>
            `).join('');
        }

        window.viewRecipe = function(recipeId) {
            window.location.href = `../recipe-details/recipe-details.html?id=${recipeId}`;
        }

        window.removeSavedRecipe = function(recipeId) {
            let savedRecipes = JSON.parse(localStorage.getItem('savedRecipes')) || [];
            savedRecipes = savedRecipes.filter(recipe => recipe.id !== recipeId);
            localStorage.setItem('savedRecipes', JSON.stringify(savedRecipes));
            loadSavedRecipes();
        }
         // Load saved recipes when the page loads
     document.addEventListener('DOMContentLoaded', loadSavedRecipes);
