// Sidebar and menu logic
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

// Firebase logic
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

document.querySelector("#search-btn").addEventListener("click", async () => {
  const inputBox = document.querySelector("#inputbox1");
  const searchValue = inputBox.value.trim().toLowerCase();
  if (!searchValue) {
    inputBox.value = '';
    inputBox.placeholder = 'Please enter recipes';
    inputBox.style.borderColor = '#dc3545';
    inputBox.style.background = '#fff3f3';
    // Remove previous input event if any
    inputBox.oninput = null;
    inputBox.addEventListener('input', function handleInput() {
      if (inputBox.value.trim() !== '') {
        inputBox.style.borderColor = '';
        inputBox.style.background = '';
        inputBox.placeholder = 'Search Recipes';
        inputBox.removeEventListener('input', handleInput);
      }
    });
    return;
  }
  
  // Store the search term in sessionStorage and redirect to search page
  sessionStorage.setItem('recipeSearchTerm', searchValue);
  window.location.href = '../recipesearch/recipesearch.html';
}); 

// Ingredient-based search for recipes

document.getElementById('find-recipes-btn').addEventListener('click', async () => {
  const inputBox = document.getElementById('ingredient-input');
  const errorContainer = document.getElementById('errorContainer');
  const inputValue = inputBox.value.trim().toLowerCase();
  if (!inputValue) {
    inputBox.value = '';
    inputBox.placeholder = 'Please enter ingredients';
    inputBox.style.borderColor = '#dc3545';
    inputBox.style.background = '#fff3f3';
    inputBox.oninput = null;
    inputBox.addEventListener('input', function handleInput() {
      if (inputBox.value.trim() !== '') {
        inputBox.style.borderColor = '';
        inputBox.style.background = '';
        inputBox.placeholder = 'Generate Recipes';
        inputBox.removeEventListener('input', handleInput);
      }
    });
    return;
  }
  // Split by comma or space, trim, and filter empty
  const ingredients = inputValue.split(/,|\s+/).map(i => i.trim()).filter(i => i);
  if (ingredients.length === 0) {
    errorContainer.innerHTML = `<i class="fas fa-exclamation-circle"></i> Please enter at least one ingredient.`;
    errorContainer.style.display = 'block';
    setTimeout(() => { errorContainer.style.display = 'none'; }, 5000);
    return;
  }
  const recipesRef = collection(db, 'Recipes');
  const recipesSnapshot = await getDocs(recipesRef);
  const matchingRecipeIds = [];
  recipesSnapshot.forEach((doc) => {
    const recipeData = doc.data();
    const recipeIngredients = Array.isArray(recipeData.ingredients)
      ? recipeData.ingredients.map(i => i.toLowerCase())
      : (typeof recipeData.ingredients === 'string' ? [recipeData.ingredients.toLowerCase()] : []);
    // Check if any of the entered ingredients are in the recipe's ingredients
    if (ingredients.some(ing => recipeIngredients.includes(ing))) {
      matchingRecipeIds.push(doc.id);
    }
  });
  if (matchingRecipeIds.length > 0) {
    // Store the IDs and input ingredients in sessionStorage and redirect
    sessionStorage.setItem('ingredientSearchResults', JSON.stringify(matchingRecipeIds));
    sessionStorage.setItem('ingredientSearchInput', JSON.stringify(ingredients));
    window.location.href = '../recipesearch/recipesearch.html?ingredientSearch=1';
  } else {
    errorContainer.innerHTML = `<i class="fas fa-exclamation-circle"></i> No recipes found with those ingredients.`;
    errorContainer.style.display = 'block';
    setTimeout(() => { errorContainer.style.display = 'none'; }, 5000);
  }
});

// Add Enter key support for search boxes
document.getElementById('inputbox1').addEventListener('keypress', function(event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    document.getElementById('search-btn').click();
  }
});

document.getElementById('ingredient-input').addEventListener('keypress', function(event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    document.getElementById('find-recipes-btn').click();
  }
});

window.toggleMenu = toggleMenu;