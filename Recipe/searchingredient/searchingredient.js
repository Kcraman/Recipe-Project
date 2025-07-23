function toggleMenu() {
    document.getElementById('sidebar').classList.toggle('active');
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

  import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
  import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
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
  onAuthStateChanged(auth, async (user) => {
    const userIcon = document.getElementById('userIcon');
    const userText = document.getElementById('userText');
    if (user) {
      userIcon.href = "User.html";
      const usersRef = collection(db, "users");
      const userDocs = await getDocs(usersRef);
      userDocs.forEach(doc => {
        if (doc.data().email === user.email) {
          userText.textContent = doc.data().firstname;
        }
      });
    } else {
      userIcon.href = "Login.html";
      userText.textContent = "Login";
    }
  });
  document.getElementById('ingredientSearchBtn').addEventListener('click', async () => {
    const input = document.getElementById('ingredientInput').value.trim().toLowerCase();
    const resultArea = document.getElementById('resultArea');
    if (!input) {
      resultArea.innerHTML = '<div style="color:#d63031;">Please enter at least one ingredient.</div>';
      return;
    }
    const inputIngredients = input.split(',').map(i => i.trim()).filter(i => i);
    const recipesRef = collection(db, "Recipes");
    const recipesSnapshot = await getDocs(recipesRef);
    let foundAny = false;
    let html = '';
    recipesSnapshot.forEach(doc => {
      const data = doc.data();
      const recipeIngredients = (data.ingredients || []).map(i => i.toLowerCase());
      const usedIngredients = inputIngredients.filter(i => recipeIngredients.includes(i));
      const missedIngredients = recipeIngredients.filter(i => !inputIngredients.includes(i));
      if (usedIngredients.length > 0) {
        foundAny = true;
        html += `<div class="recipe-result" data-id="${doc.id}">
          <div class="recipe-title">${data.name}</div>
          <div class="ingredient-list"><span>Used:</span> ${usedIngredients.length > 0 ? usedIngredients.join(', ') : 'None'}</div>
          <div class="ingredient-list"><span>Missed:</span> ${missedIngredients.length > 0 ? missedIngredients.join(', ') : 'None'}</div>
          <button class="view-btn" onclick="window.location.href='recipesearch.html?id=${doc.id}'">View Recipe</button>
        </div>`;
      }
    });
    if (!foundAny) {
      html = '<div style="color:#d63031;">No recipes found with the given ingredients.</div>';
    }
    resultArea.innerHTML = html;
    // Add save button logic
    document.querySelectorAll('.save-btn').forEach(btn => {
      btn.addEventListener('click', async function() {
        const recipeId = this.getAttribute('data-id');
        const recipeDiv = this.closest('.recipe-result');
        this.disabled = true;
        this.innerHTML = '<i class="fas fa-check"></i> <span>Saved</span>';
        // Save to Firestore under user's savedRecipes if logged in
        const user = auth.currentUser;
        if (!user) {
          alert('Please log in to save recipes.');
          this.disabled = false;
          this.innerHTML = '<i class="fas fa-bookmark"></i> <span>Save</span>';
          return;
        }
        // Get recipe data
        const recipeDoc = recipesSnapshot.docs.find(d => d.id === recipeId);
        if (!recipeDoc) return;
        const recipeData = recipeDoc.data();
        // Save to user's savedRecipes subcollection
        try {
          const { doc, setDoc, collection } = await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js');
          await setDoc(doc(collection(db, 'users', user.uid, 'savedRecipes'), recipeId), {
            ...recipeData,
            savedAt: new Date()
          });
        } catch (e) {
          alert('Error saving recipe.');
          this.disabled = false;
          this.innerHTML = '<i class="fas fa-bookmark"></i> <span>Save</span>';
        }
      });
    });
  });
  window.toggleMenu = toggleMenu;