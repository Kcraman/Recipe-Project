import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, getDocs, query, where, doc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

document.addEventListener('DOMContentLoaded', function() {

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
            // Fetch saved recipes for this user
            userSavedRecipeIds = await fetchUserSavedRecipeIds(user.uid);
            // Fetch favourite recipes for this user
            userFavouriteRecipeIds = await fetchUserFavouriteRecipeIds(user.uid);
            loadRecipes();
        } else {
            userIcon.href = "../login/Login.html";
            userText.textContent = "Login";
            userSavedRecipeIds = [];
            userFavouriteRecipeIds = [];
            loadRecipes();
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

    const categoryNav = document.getElementById('category-nav');
    const recipesRef = collection(db, "Recipes");

    // Pagination variables
    let currentPage = 1;
    let recipesPerPage = 5; // 5 letters per page
    let allRecipes = [];
    let totalPages = 0;

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
                
                // Sort recipes alphabetically
                recipes.sort((a, b) => a.name.localeCompare(b.name));
                allRecipes = recipes;
                
                // Group recipes by first letter
                const groupedRecipes = {};
                recipes.forEach(recipe => {
                    const firstLetter = recipe.name.charAt(0).toUpperCase();
                    if (!groupedRecipes[firstLetter]) {
                        groupedRecipes[firstLetter] = [];
                    }
                    groupedRecipes[firstLetter].push(recipe);
                });
                
                // Get all unique letters and sort them
                const allLetters = Object.keys(groupedRecipes).sort();
                totalPages = Math.ceil(allLetters.length / recipesPerPage);
                
                // Display current page
                displayCurrentPage(groupedRecipes, allLetters);
                
                // Add pagination controls
                addPaginationControls();
                
            } else {
                categoryNav.innerHTML = '<p style="color: #F5E6C8; text-align: center;">No recipes found in the database.</p>';
            }
        } catch (error) {
            categoryNav.innerHTML = `<p style='color: red; text-align: center;'>Failed to load recipes: ${error.message}</p>`;
        }
    }

    function displayCurrentPage(groupedRecipes, allLetters) {
        categoryNav.innerHTML = '';
        
        // Calculate which letters to show on current page
        const startIndex = (currentPage - 1) * recipesPerPage;
        const endIndex = startIndex + recipesPerPage;
        const currentPageLetters = allLetters.slice(startIndex, endIndex);
        
        // Display recipes for current page letters
        currentPageLetters.forEach(letter => {
            const categorySection = document.createElement('div');
            categorySection.className = 'category-section';
            categorySection.innerHTML = `
                <div class="category-header">${letter}</div>
                <div class="recipe-list">
                    ${groupedRecipes[letter].map(recipe => {
                        const isSaved = userSavedRecipeIds.includes(recipe.id);
                        const isFavourited = userFavouriteRecipeIds.includes(recipe.id);
                        const isCreator = recipe.createdByEmail && recipe.createdByEmail === auth.currentUser?.email;
                        return `
                            <div class="recipe-name" style="position: relative;">
                                <div class="recipe-actions" style="position: absolute; right: 0; top: 50%; transform: translateY(-50%); display: flex; gap: 10px;">
                                    <button class="save-recipe-btn ${isSaved ? 'saved' : ''}" onclick="toggleSaveRecipe('${recipe.id}', '${recipe.name}')">
                                        <i class="fas ${isSaved ? 'fa-check' : 'fa-bookmark'}"></i>
                                        <span>${isSaved ? 'Saved' : 'Save'}</span>
                                    </button>
                                    <button class="favourite-recipe-btn ${isFavourited ? 'favourited' : ''}" onclick="toggleFavouriteRecipe('${recipe.id}', '${recipe.name}')">
                                        <i class="fas fa-heart"></i>
                                        <span>${isFavourited ? 'Favourited' : 'Favourite'}</span>
                                    </button>
                                    ${isCreator ? `
                                        <button class="delete-recipe-btn" onclick="showDeleteConfirmation('${recipe.id}', '${recipe.name}')" style="background: #dc3545; color: white; border: none; border-radius: 20px; padding: 8px 16px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; display: flex; align-items: center; gap: 5px;">
                                            <i class="fas fa-trash"></i>
                                            <span>Delete</span>
                                        </button>
                                    ` : ''}
                                </div>
                                <a href="../recipe-details/recipe-details.html?id=${recipe.id}" style="text-decoration: none; color: inherit; display: block; padding-right: ${isCreator ? '320px' : '240px'};">
                                    ${recipe.name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                </a>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
            categoryNav.appendChild(categorySection);
        });
    }

    function addPaginationControls() {
        if (totalPages <= 1) return;
        
        const paginationContainer = document.createElement('div');
        paginationContainer.className = 'pagination-container';
        paginationContainer.style.cssText = `
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 10px;
            margin-top: 30px;
            padding: 20px;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 15px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        `;
        
        // Previous button
        const prevBtn = document.createElement('button');
        prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i> Previous';
        prevBtn.disabled = currentPage === 1;
        prevBtn.onclick = () => {
            if (currentPage > 1) {
                currentPage--;
                loadRecipes();
            }
        };
        prevBtn.style.cssText = `
            padding: 10px 15px;
            background-color: ${currentPage === 1 ? '#ccc' : '#5B4B3A'};
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: ${currentPage === 1 ? 'not-allowed' : 'pointer'};
            transition: all 0.3s ease;
        `;
        
        // Page numbers
        const pageNumbersContainer = document.createElement('div');
        pageNumbersContainer.style.cssText = `
            display: flex;
            gap: 5px;
        `;
        
        // Calculate which page numbers to show
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, currentPage + 2);
        
        // Always show at least 5 page numbers if possible
        if (endPage - startPage < 4) {
            if (startPage === 1) {
                endPage = Math.min(totalPages, startPage + 4);
            } else {
                startPage = Math.max(1, endPage - 4);
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            pageBtn.onclick = () => {
                currentPage = i;
                loadRecipes();
            };
            pageBtn.style.cssText = `
                padding: 10px 15px;
                background-color: ${i === currentPage ? '#bb6736' : '#5B4B3A'};
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                min-width: 40px;
            `;
            pageNumbersContainer.appendChild(pageBtn);
        }
        
        // Next button
        const nextBtn = document.createElement('button');
        nextBtn.innerHTML = 'Next <i class="fas fa-chevron-right"></i>';
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.onclick = () => {
            if (currentPage < totalPages) {
                currentPage++;
                loadRecipes();
            }
        };
        nextBtn.style.cssText = `
            padding: 10px 15px;
            background-color: ${currentPage === totalPages ? '#ccc' : '#5B4B3A'};
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: ${currentPage === totalPages ? 'not-allowed' : 'pointer'};
            transition: all 0.3s ease;
        `;
        
        // Page info
        const pageInfo = document.createElement('div');
        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
        pageInfo.style.cssText = `
            color: #5B4B3A;
            font-weight: 600;
            font-size: 14px;
            margin: 0 15px;
        `;
        
        paginationContainer.appendChild(prevBtn);
        paginationContainer.appendChild(pageNumbersContainer);
        paginationContainer.appendChild(pageInfo);
        paginationContainer.appendChild(nextBtn);
        
        categoryNav.appendChild(paginationContainer);
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

    window.toggleFavouriteRecipe = async function(recipeId, recipeName) {
        const favouriteBtn = event.currentTarget;
        const saveErrorContainer = document.getElementById('saveErrorContainer');
        saveErrorContainer.innerHTML = '';
        const user = getAuth().currentUser;
        if (!user) {
            saveErrorContainer.innerHTML = `
                <div class=\"simple-login-notification\">Please log in to favourite.</div>
            `;
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
            favouriteBtn.classList.remove('favourited');
            favouriteBtn.innerHTML = '<i class="fas fa-heart"></i><span>Favourite</span>';
            userFavouriteRecipeIds = userFavouriteRecipeIds.filter(id => id !== recipeId);
        } else {
            // Favourite
            await setDoc(recipeRef, {
                name: recipeName,
                favouritedAt: new Date()
            });
            favouriteBtn.classList.add('favourited');
            favouriteBtn.innerHTML = '<i class="fas fa-heart"></i><span>Favourited</span>';
            userFavouriteRecipeIds.push(recipeId);
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
                        Recipe deleted successfully!
                    </div>
                `;
                saveErrorContainer.style.display = 'block';
                setTimeout(() => {
                    saveErrorContainer.style.display = 'none';
                    saveErrorContainer.innerHTML = '';
                }, 3000);
                
                // Remove modal and reload recipes
                document.body.removeChild(modal);
                loadRecipes();
                
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

    // Sidebar toggle function
    function toggleMenu() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.querySelector('.overlay');
        sidebar.classList.toggle('active');
        if (overlay) overlay.classList.toggle('active');
        console.log('Sidebar toggled');
    }
});
