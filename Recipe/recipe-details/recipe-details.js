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

        // Get recipe ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        const recipeId = urlParams.get('id');

        if (recipeId) {
            const recipeRef = doc(db, "Recipes", recipeId);
            const recipeSnap = await getDoc(recipeRef);

            if (recipeSnap.exists()) {
                const recipeData = recipeSnap.data();
                
                // Update recipe name with capitalized first letter
                document.getElementById('recipeName').textContent = recipeData.name.charAt(0).toUpperCase() + recipeData.name.slice(1);

                // Update ingredients
                const ingredientsList = document.getElementById('ingredientsList');
                if (recipeData.ingredients && Array.isArray(recipeData.ingredients)) {
                    recipeData.ingredients.forEach(ingredient => {
                        const li = document.createElement('li');
                        li.innerHTML = `<i class="fas fa-check"></i> ${ingredient}`;
                        ingredientsList.appendChild(li);
                    });
                } else {
                    ingredientsList.innerHTML = '<li>No ingredients available</li>';
                }

                // Update instructions
                const instructionsList = document.getElementById('instructionsList');
                if (recipeData.instructions && Array.isArray(recipeData.instructions)) {
                    recipeData.instructions.forEach(instruction => {
                        const li = document.createElement('li');
                        li.textContent = instruction;
                        instructionsList.appendChild(li);
                    });
                } else {
                    instructionsList.innerHTML = '<li>No instructions available</li>';
                }

                // Check if recipe is saved and update save button state
                const savedRecipes = JSON.parse(localStorage.getItem('savedRecipes')) || [];
                const isSaved = savedRecipes.some(r => r.id === recipeId);
                const saveBtn = document.getElementById('saveRecipeBtn');
                
                if (isSaved) {
                    saveBtn.classList.add('saved');
                    saveBtn.innerHTML = '<i class="fas fa-check"></i><span>Saved</span>';
                }
            } else {
                document.getElementById('recipeName').textContent = 'Recipe not found';
            }
        } else {
            document.getElementById('recipeName').textContent = 'No recipe selected';
        }
    

   
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
            
            if (sidebar.classList.contains('active') && 
                !sidebar.contains(event.target) && 
                !menuIcon.contains(event.target)) {
                sidebar.classList.remove('active');
            }
        });

        // Save recipe functionality
        function toggleSaveRecipe() {
            const saveBtn = document.getElementById('saveRecipeBtn');
            const recipeId = new URLSearchParams(window.location.search).get('id');
            const recipeName = document.getElementById('recipeName').textContent;
            
            // Get existing saved recipes
            let savedRecipes = JSON.parse(localStorage.getItem('savedRecipes')) || [];
            
            // Check if recipe is already saved
            const isSaved = savedRecipes.some(r => r.id === recipeId);
            
            if (isSaved) {
                // Remove from saved recipes
                savedRecipes = savedRecipes.filter(r => r.id !== recipeId);
                saveBtn.classList.remove('saved');
                saveBtn.innerHTML = '<i class="fas fa-bookmark"></i><span>Save Recipe</span>';
            } else {
                // Add to saved recipes
                savedRecipes.push({
                    id: recipeId,
                    title: recipeName,
                    cookingTime: '30 mins', // You can update this with actual cooking time if available
                    calories: '350 kcal'    // You can update this with actual calories if available
                });
                saveBtn.classList.add('saved');
                saveBtn.innerHTML = '<i class="fas fa-check"></i><span>Saved</span>';
            }
            
            // Update localStorage
            localStorage.setItem('savedRecipes', JSON.stringify(savedRecipes));
        }
        window.toggleMenu = toggleMenu;