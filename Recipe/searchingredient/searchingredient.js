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

// Fuzzy search algorithm
function levenshteinDistance(str1, str2) {
  const matrix = [];
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[str2.length][str1.length];
}

// Enhanced similarity calculation with multiple algorithms
function calculateSimilarity(str1, str2) {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  // Exact match
  if (s1 === s2) return 1.0;
  
  // Contains match (one string contains the other)
  if (s1.includes(s2) || s2.includes(s1)) {
    return 0.9;
  }
  
  // Levenshtein distance
  const distance = levenshteinDistance(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);
  const levenshteinSimilarity = 1 - (distance / maxLength);
  
  // Character-based similarity (handles missing/extra characters and substitutions)
  const charSimilarity = calculateCharacterSimilarityWithSubstitutions(s1, s2);
  
  // Phonetic similarity (handles similar-sounding words)
  const phoneticSimilarity = calculatePhoneticSimilarity(s1, s2);
  
  // Word-based similarity (handles word order and partial matches)
  const wordSimilarity = calculateWordSimilarity(s1, s2);
  
  // Enhanced word similarity (handles partial word matches better)
  const enhancedWordSimilarity = calculateEnhancedWordSimilarity(s1, s2);
  
  // Return the highest similarity score
  return Math.max(levenshteinSimilarity, charSimilarity, phoneticSimilarity, wordSimilarity, enhancedWordSimilarity);
}

// Enhanced character similarity with substitution detection
function calculateCharacterSimilarityWithSubstitutions(str1, str2) {
  const chars1 = str1.split('');
  const chars2 = str2.split('');
  
  let matches = 0;
  let substitutions = 0;
  let totalChars = Math.max(chars1.length, chars2.length);
  
  // Common character substitutions (similar sounding letters)
  const commonSubstitutions = {
    'g': ['p', 'b'],
    'p': ['g', 'b'],
    'b': ['p', 'g'],
    'd': ['t', 'th'],
    't': ['d', 'th'],
    'th': ['d', 't'],
    'c': ['k', 's'],
    'k': ['c', 'q'],
    'q': ['k', 'c'],
    'f': ['ph', 'v'],
    'v': ['f', 'w'],
    'w': ['v', 'u'],
    'u': ['w', 'o'],
    'o': ['u', 'a'],
    'a': ['o', 'e'],
    'e': ['a', 'i'],
    'i': ['e', 'y'],
    'y': ['i', 'e'],
    's': ['c', 'z'],
    'z': ['s', 'x'],
    'x': ['z', 'ks'],
    'm': ['n'],
    'n': ['m'],
    'l': ['r'],
    'r': ['l']
  };
  
  let i = 0, j = 0;
  while (i < chars1.length && j < chars2.length) {
    if (chars1[i] === chars2[j]) {
      matches++;
      i++;
      j++;
    } else {
      // Check for character substitutions
      const char1 = chars1[i];
      const char2 = chars2[j];
      
      let isSubstitution = false;
      
      // Check if characters are common substitutions
      if (commonSubstitutions[char1] && commonSubstitutions[char1].includes(char2)) {
        isSubstitution = true;
      } else if (commonSubstitutions[char2] && commonSubstitutions[char2].includes(char1)) {
        isSubstitution = true;
      }
      
      // Check for transposition (adjacent characters swapped)
      if (i + 1 < chars1.length && j + 1 < chars2.length) {
        if (chars1[i] === chars2[j + 1] && chars1[i + 1] === chars2[j]) {
          matches += 2; // Count both characters as matches
          i += 2;
          j += 2;
          continue;
        }
      }
      
      if (isSubstitution) {
        substitutions++;
        matches += 0.5; // Partial match for substitution
      }
      
      i++;
      j++;
    }
  }
  
  // Calculate final similarity with substitution penalty
  const substitutionPenalty = substitutions * 0.1;
  return Math.max(0, (matches / totalChars) - substitutionPenalty);
}

// Phonetic similarity for similar-sounding words
function calculatePhoneticSimilarity(str1, str2) {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  // Simple phonetic rules for common substitutions
  const phoneticRules = [
    { pattern: /[gk]/g, replacement: 'k' },
    { pattern: /[dt]/g, replacement: 't' },
    { pattern: /[bp]/g, replacement: 'p' },
    { pattern: /[fv]/g, replacement: 'f' },
    { pattern: /[mn]/g, replacement: 'n' },
    { pattern: /[lr]/g, replacement: 'l' },
    { pattern: /[aeiou]/g, replacement: 'a' }, // Simplify vowels
    { pattern: /[bcdfghjklmnpqrstvwxyz]/g, replacement: 'c' } // Simplify consonants
  ];
  
  let phonetic1 = s1;
  let phonetic2 = s2;
  
  // Apply phonetic rules
  phoneticRules.forEach(rule => {
    phonetic1 = phonetic1.replace(rule.pattern, rule.replacement);
    phonetic2 = phonetic2.replace(rule.pattern, rule.replacement);
  });
  
  // Calculate similarity of phonetic versions
  const distance = levenshteinDistance(phonetic1, phonetic2);
  const maxLength = Math.max(phonetic1.length, phonetic2.length);
  
  return 1 - (distance / maxLength);
}

// Calculate similarity based on word patterns
function calculateWordSimilarity(str1, str2) {
  const words1 = str1.split(/\s+/).filter(w => w.length > 0);
  const words2 = str2.split(/\s+/).filter(w => w.length > 0);
  
  if (words1.length === 0 || words2.length === 0) return 0;
  
  let matches = 0;
  let totalWords = Math.max(words1.length, words2.length);
  
  // Check for word matches
  for (let word1 of words1) {
    for (let word2 of words2) {
      if (word1 === word2 || word1.includes(word2) || word2.includes(word1)) {
        matches++;
        break;
      }
    }
  }
  
  return matches / totalWords;
}

// Enhanced word similarity that also checks for partial word matches
function calculateEnhancedWordSimilarity(str1, str2) {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  // Split into words
  const words1 = s1.split(/\s+/).filter(w => w.length > 0);
  const words2 = s2.split(/\s+/).filter(w => w.length > 0);
  
  if (words1.length === 0 || words2.length === 0) return 0;
  
  let maxSimilarity = 0;
  
  // Check each word in str1 against each word in str2
  for (let word1 of words1) {
    for (let word2 of words2) {
      // Calculate similarity between individual words
      const wordSimilarity = calculateSimilarity(word1, word2);
      maxSimilarity = Math.max(maxSimilarity, wordSimilarity);
    }
  }
  
  // Also check if any word from str2 is contained within str1
  for (let word2 of words2) {
    if (s1.includes(word2)) {
      maxSimilarity = Math.max(maxSimilarity, 0.8);
    }
  }
  
  // Check if any word from str1 is contained within str2
  for (let word1 of words1) {
    if (s2.includes(word1)) {
      maxSimilarity = Math.max(maxSimilarity, 0.8);
    }
  }
  
  return maxSimilarity;
}

// Common misspellings and corrections for ingredients
const commonMisspellings = {
  'tomato': 'tomato',
  'tomatos': 'tomato',
  'tomatoes': 'tomato',
  'potato': 'potato',
  'potatos': 'potato',
  'potatoes': 'potato',
  'onion': 'onion',
  'onions': 'onion',
  'garlic': 'garlic',
  'ginger': 'ginger',
  'chicken': 'chicken',
  'chiken': 'chicken',
  'chikn': 'chicken',
  'chickn': 'chicken',
  'rice': 'rice',
  'ricce': 'rice',
  'ric': 'rice',
  'bread': 'bread',
  'bred': 'bread',
  'bredd': 'bread',
  'flour': 'flour',
  'flor': 'flour',
  'oil': 'oil',
  'salt': 'salt',
  'pepper': 'pepper',
  'peper': 'pepper',
  'cheese': 'cheese',
  'chees': 'cheese',
  'milk': 'milk',
  'eggs': 'eggs',
  'egg': 'eggs',
  'butter': 'butter',
  'buter': 'butter'
};

// Stricter similarity calculation with consecutive letter matching
function calculateSimilarityWithMisspellings(str1, str2) {
  try {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    
    // Exact match
    if (s1 === s2) return 1.0;
    
    // Check for 3+ consecutive letter matches
    const consecutiveMatch = checkConsecutiveLetterMatch(s1, s2);
    if (consecutiveMatch) {
      return 0.9; // High score for consecutive matches
    }
    
    // Check for max 2 character differences
    const maxDiffMatch = checkMaxCharacterDifference(s1, s2, 2);
    if (maxDiffMatch) {
      return 0.8; // Good score for close matches
    }
    
    // Check for common misspellings
    const correctedS1 = commonMisspellings[s1] || s1;
    const correctedS2 = commonMisspellings[s2] || s2;
    
    if (correctedS1 !== s1 || correctedS2 !== s2) {
      const correctedMatch = checkConsecutiveLetterMatch(correctedS1, correctedS2) || 
                           checkMaxCharacterDifference(correctedS1, correctedS2, 2);
      if (correctedMatch) {
        return 0.7; // Medium score for corrected matches
      }
    }
    
    return 0.0; // No match
  } catch (error) {
    console.error('Error in calculateSimilarityWithMisspellings:', error);
    return 0.0;
  }
}

// Check for 3+ consecutive letter matches
function checkConsecutiveLetterMatch(str1, str2) {
  const minLength = 3; // Minimum consecutive letters to match
  
  // Check if str1 contains 3+ consecutive letters from str2
  for (let i = 0; i <= str1.length - minLength; i++) {
    const substring = str1.substring(i, i + minLength);
    if (str2.includes(substring)) {
      return true;
    }
  }
  
  // Check if str2 contains 3+ consecutive letters from str1
  for (let i = 0; i <= str2.length - minLength; i++) {
    const substring = str2.substring(i, i + minLength);
    if (str1.includes(substring)) {
      return true;
    }
  }
  
  return false;
}

// Check for max character differences
function checkMaxCharacterDifference(str1, str2, maxDiff) {
  const distance = levenshteinDistance(str1, str2);
  return distance <= maxDiff;
}

// Handle complex misspellings with character substitutions
function calculateComplexMisspellingSimilarity(str1, str2) {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  // Common character substitution patterns
  const substitutionPatterns = [
    { from: 'g', to: 'p', examples: ['garlic', 'parlic'] },
    { from: 'p', to: 'g', examples: ['parlic', 'garlic'] },
    { from: 'd', to: 't', examples: ['bread', 'breat'] },
    { from: 't', to: 'd', examples: ['breat', 'bread'] },
    { from: 'c', to: 'k', examples: ['chiken', 'chicken'] },
    { from: 'k', to: 'c', examples: ['chicken', 'chiken'] },
    { from: 'f', to: 'v', examples: ['flor', 'vlor'] },
    { from: 'v', to: 'f', examples: ['vlor', 'flor'] }
  ];
  
  let maxSimilarity = 0;
  
  // Try each substitution pattern
  substitutionPatterns.forEach(pattern => {
    const modifiedS1 = s1.replace(new RegExp(pattern.from, 'g'), pattern.to);
    const modifiedS2 = s2.replace(new RegExp(pattern.to, 'g'), pattern.from);
    
    const similarity1 = calculateSimilarity(modifiedS1, s2);
    const similarity2 = calculateSimilarity(s1, modifiedS2);
    
    maxSimilarity = Math.max(maxSimilarity, similarity1, similarity2);
  });
  
  return maxSimilarity;
}
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
      userIcon.href = "../user/User.html";
      const usersRef = collection(db, "users");
      const userDocs = await getDocs(usersRef);
      userDocs.forEach(doc => {
        if (doc.data().email === user.email) {
          userText.textContent = doc.data().firstname;
        }
      });
    } else {
      userIcon.href = "../login/Login.html";
      userText.textContent = "Login";
    }
  });
  document.getElementById('ingredientSearchBtn').addEventListener('click', async () => {
    const input = document.getElementById('ingredientInput').value.trim();
    const resultArea = document.getElementById('resultArea');
    if (!input) {
      resultArea.innerHTML = '<div style="color:#d63031;">Please enter at least one ingredient.</div>';
      return;
    }
    const inputIngredients = input.split(/,|\s+/).map(i => i.trim()).filter(i => i);
    const recipesRef = collection(db, "Recipes");
    const recipesSnapshot = await getDocs(recipesRef);
    let foundAny = false;
    let html = '';
    
    recipesSnapshot.forEach(doc => {
      const data = doc.data();
      const recipeIngredients = (data.ingredients || []).map(i => i.toLowerCase());
      
      // Calculate how many input ingredients match recipe ingredients
      let matchingIngredientsCount = 0;
      
      inputIngredients.forEach(inputIngredient => {
        let ingredientMatched = false;
        recipeIngredients.forEach(recipeIngredient => {
          const similarity = calculateSimilarityWithMisspellings(inputIngredient, recipeIngredient);
          if (similarity > 0.6) { // Stricter threshold for ingredient matching
            ingredientMatched = true;
          }
        });
        if (ingredientMatched) {
          matchingIngredientsCount++;
        }
      });
      
      // Check if recipe has at least 75% of the entered ingredients
      const requiredMatchPercentage = 0.75;
      const requiredMatches = Math.ceil(inputIngredients.length * requiredMatchPercentage);
      
      if (matchingIngredientsCount >= requiredMatches) {
        foundAny = true;
        html += `<div class="recipe-result" data-id="${doc.id}">
          <div class="recipe-title">${data.name}</div>
          <div class="ingredient-list"><span>Ingredients:</span> ${(data.ingredients || []).join(', ')}</div>
          <button class="view-btn" onclick="window.location.href='../recipe-details/recipe-details.html?id=${doc.id}'">View Recipe</button>
        </div>`;
      }
    });
    
    if (!foundAny) {
      html = '<div style="color:#d63031;">No recipes found with the given ingredients.</div>';
    } else {
      html = '<div style="color:#28a745; margin-bottom: 20px; font-weight: 600;"><i class="fas fa-info-circle"></i> Showing recipes with your ingredients</div>' + html;
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