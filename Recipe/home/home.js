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

// Enhanced fuzzy search algorithm
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

// Calculate similarity based on character patterns
function calculateCharacterSimilarity(str1, str2) {
  const chars1 = str1.split('');
  const chars2 = str2.split('');
  
  let matches = 0;
  let totalChars = Math.max(chars1.length, chars2.length);
  
  // Count matching characters in order
  let i = 0, j = 0;
  while (i < chars1.length && j < chars2.length) {
    if (chars1[i] === chars2[j]) {
      matches++;
      i++;
      j++;
    } else if (i + 1 < chars1.length && chars1[i + 1] === chars2[j]) {
      // Skip one character in str1 (missing character)
      i++;
    } else if (j + 1 < chars2.length && chars1[i] === chars2[j + 1]) {
      // Skip one character in str2 (extra character)
      j++;
    } else {
      i++;
      j++;
    }
  }
  
  return matches / totalChars;
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

// Common misspellings and corrections
const commonMisspellings = {
  'parata': 'paratha',
  'paraatha': 'paratha',
  'garatha': 'paratha',
  'paradha': 'paratha',
  'paratha': 'paratha',
  'parathaa': 'paratha',
  'paratha': 'paratha',
  'pizsa': 'pizza',
  'pizz': 'pizza',
  'izza': 'pizza',
  'pezza': 'pizza',
  'pizzaa': 'pizza',
  'biryani': 'biryani',
  'biriyani': 'biryani',
  'biryanni': 'biryani',
  'biriyanni': 'biryani',
  'chicken': 'chicken',
  'chiken': 'chicken',
  'chikn': 'chicken',
  'chickn': 'chicken',
  'pasta': 'pasta',
  'pastaa': 'pasta',
  'pastta': 'pasta',
  'curry': 'curry',
  'curri': 'curry',
  'curryy': 'curry',
  'curriy': 'curry',
  'noodles': 'noodles',
  'noodels': 'noodles',
  'noodls': 'noodles',
  'rice': 'rice',
  'ricce': 'rice',
  'ric': 'rice',
  'bread': 'bread',
  'bred': 'bread',
  'bredd': 'bread'
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
    { from: 'g', to: 'p', examples: ['garatha', 'paratha'] },
    { from: 'p', to: 'g', examples: ['paratha', 'garatha'] },
    { from: 'd', to: 't', examples: ['paradha', 'paratha'] },
    { from: 't', to: 'd', examples: ['paratha', 'paradha'] },
    { from: 'c', to: 'k', examples: ['chiken', 'chicken'] },
    { from: 'k', to: 'c', examples: ['chicken', 'chiken'] },
    { from: 'f', to: 'v', examples: ['fishe', 'vishe'] },
    { from: 'v', to: 'f', examples: ['vishe', 'fishe'] }
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

function highlightText(text, searchTerm) {
  if (!searchTerm) return text;
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  return text.replace(regex, '<span class="suggestion-highlight">$1</span>');
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

// Search suggestions functionality
let allRecipes = [];
let searchTimeout;

// Load all recipes for search suggestions
async function loadAllRecipes() {
  try {
    const recipesRef = collection(db, 'Recipes');
    const recipesSnapshot = await getDocs(recipesRef);
    allRecipes = recipesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Debug: Log the number of recipes loaded
    console.log(`Loaded ${allRecipes.length} recipes for search`);
    if (allRecipes.length > 0) {
      console.log('Sample recipes:', allRecipes.slice(0, 3).map(r => r.name));
    }
    
    // If no recipes found, add some sample recipes for testing
    if (allRecipes.length === 0) {
      console.log('No recipes found in database, adding sample recipes for testing');
      allRecipes = [
        { id: '1', name: 'Aloo Paratha' },
        { id: '2', name: 'Gobi Paratha' },
        { id: '3', name: 'Methi Paratha' },
        { id: '4', name: 'Pizza Margherita' },
        { id: '5', name: 'Chicken Biryani' },
        { id: '6', name: 'Vegetable Curry' },
        { id: '7', name: 'Samosa' },
        { id: '8', name: 'Pickle' },
        { id: '9', name: 'Sel Roti' },
        { id: '10', name: 'Pancake' }
      ];
      console.log('Added sample recipes for testing');
    }
  } catch (error) {
    console.error('Error loading recipes:', error);
  }
}

// Get search suggestions based on fuzzy matching
function getSearchSuggestions(searchTerm) {
  if (!searchTerm || searchTerm.length < 2) return [];
  
  const suggestions = [];
  const searchLower = searchTerm.toLowerCase();
  
  // Debug: Log search term and available recipes
  console.log(`Searching for: "${searchTerm}"`);
  console.log(`Available recipes: ${allRecipes.length}`);
  if (allRecipes.length > 0) {
    console.log('Recipe names:', allRecipes.map(r => r.name).slice(0, 10));
  }
  
  // First, try exact matches
  const exactMatches = allRecipes.filter(recipe => 
    recipe.name && recipe.name.toLowerCase().includes(searchLower)
  );
  
  // Then, try fuzzy matches with different thresholds
  const highSimilarityMatches = allRecipes.filter(recipe => {
    if (!recipe.name) return false;
    
    const similarity = calculateSimilarityWithMisspellings(recipe.name, searchTerm);
    return similarity > 0.7; // Stricter threshold
  }).filter(recipe => 
    !exactMatches.some(exact => exact.id === recipe.id)
  );
  
  const mediumSimilarityMatches = allRecipes.filter(recipe => {
    if (!recipe.name) return false;
    
    const similarity = calculateSimilarityWithMisspellings(recipe.name, searchTerm);
    return similarity > 0.6 && similarity <= 0.7; // Stricter threshold
  }).filter(recipe => 
    !exactMatches.some(exact => exact.id === recipe.id) &&
    !highSimilarityMatches.some(high => high.id === recipe.id)
  );
  
  // Combine and sort by relevance
  const allMatches = [...exactMatches, ...highSimilarityMatches, ...mediumSimilarityMatches];
  const sortedMatches = allMatches.sort((a, b) => {
    const aSimilarity = calculateSimilarityWithMisspellings(a.name, searchTerm);
    const bSimilarity = calculateSimilarityWithMisspellings(b.name, searchTerm);
    return bSimilarity - aSimilarity;
  });
  
  // Debug: Log the matches found
  console.log(`Found ${sortedMatches.length} matches for "${searchTerm}":`);
  sortedMatches.forEach((match, index) => {
    const similarity = calculateSimilarityWithMisspellings(match.name, searchTerm);
    console.log(`${index + 1}. "${match.name}" (similarity: ${similarity.toFixed(3)})`);
  });
  
  // Special handling for paratha-related searches
  if (searchTerm.toLowerCase().includes('paratha') || 
      searchTerm.toLowerCase().includes('garadha') || 
      searchTerm.toLowerCase().includes('paradha')) {
    
    // Boost paratha recipes in results
    const parathaRecipes = allRecipes.filter(recipe => 
      recipe.name && recipe.name.toLowerCase().includes('paratha')
    );
    
    // Add paratha recipes if they're not already in the results
    parathaRecipes.forEach(recipe => {
      if (!sortedMatches.some(match => match.id === recipe.id)) {
        sortedMatches.unshift(recipe); // Add to beginning
      }
    });
  }
  
  return sortedMatches.slice(0, 6); // Limit to 6 suggestions
}

// Display search suggestions
function displaySearchSuggestions(suggestions, searchTerm) {
  const suggestionsContainer = document.getElementById('search-suggestions');
  
  if (suggestions.length === 0) {
    suggestionsContainer.innerHTML = `
      <div class="suggestion-message">
        <i class="fas fa-search"></i> No recipes found. Try a different search term.
      </div>
    `;
    suggestionsContainer.classList.add('show');
    return;
  }
  
  let suggestionsHTML = '';
  
  // Categorize suggestions
  const exactMatches = suggestions.filter(suggestion => 
    calculateSimilarityWithMisspellings(suggestion.name, searchTerm) === 1.0
  );
  const highSimilarityMatches = suggestions.filter(suggestion => {
    const similarity = calculateSimilarityWithMisspellings(suggestion.name, searchTerm);
    return similarity > 0.7 && similarity < 1.0;
  });
  const mediumSimilarityMatches = suggestions.filter(suggestion => {
    const similarity = calculateSimilarityWithMisspellings(suggestion.name, searchTerm);
    return similarity > 0.5 && similarity <= 0.7;
  });
  
  // Add appropriate message based on match types
  if (exactMatches.length > 0 && (highSimilarityMatches.length > 0 || mediumSimilarityMatches.length > 0)) {
    suggestionsHTML += `
      <div class="suggestion-message">
        <i class="fas fa-check-circle"></i> Exact matches and similar recipes found
      </div>
    `;
  } else if (highSimilarityMatches.length > 0 || mediumSimilarityMatches.length > 0) {
    // Check if we have complex misspellings
    const hasComplexMisspellings = suggestions.some(suggestion => {
      const similarity = calculateSimilarityWithMisspellings(suggestion.name, searchTerm);
      return similarity > 0.6 && similarity < 0.9; // Medium-high similarity indicates complex misspelling
    });
    
    if (hasComplexMisspellings) {
      suggestionsHTML += `
        <div class="suggestion-message">
          <i class="fas fa-spell-check"></i> Found recipes with similar spellings. Did you mean one of these?
        </div>
      `;
    } else {
      suggestionsHTML += `
        <div class="suggestion-message">
          <i class="fas fa-lightbulb"></i> Did you mean one of these recipes?
        </div>
      `;
    }
  }
  
  suggestions.forEach(suggestion => {
    const similarity = calculateSimilarityWithMisspellings(suggestion.name, searchTerm);
    const isExact = similarity === 1.0;
    const isHighSimilarity = similarity > 0.7 && similarity < 1.0;
    const isMediumSimilarity = similarity > 0.5 && similarity <= 0.7;
    
    let iconClass = 'fa-utensils';
    let title = '';
    
    if (isExact) {
      iconClass = 'fa-check-circle';
      title = 'Exact match';
    } else if (isHighSimilarity) {
      iconClass = 'fa-search';
      title = 'High similarity match';
    } else if (isMediumSimilarity) {
      iconClass = 'fa-magic';
      title = 'Similar match';
    }
    
    const highlightedName = highlightText(suggestion.name, searchTerm);
    
    suggestionsHTML += `
      <div class="suggestion-item" data-recipe-id="${suggestion.id}" data-recipe-name="${suggestion.name}">
        <i class="fas ${iconClass} suggestion-icon" title="${title}"></i>
        <div class="suggestion-text">${highlightedName}</div>
        ${!isExact ? '<i class="fas fa-arrow-right suggestion-icon" title="Click to select"></i>' : ''}
      </div>
    `;
  });
  
  suggestionsContainer.innerHTML = suggestionsHTML;
  suggestionsContainer.classList.add('show');
}

// Handle suggestion selection
function handleSuggestionSelection(recipeId, recipeName) {
  document.getElementById('inputbox1').value = recipeName;
  document.getElementById('search-suggestions').classList.remove('show');
  
  // Trigger search
  document.getElementById('search-btn').click();
}

// Initialize search functionality
async function initializeSearch() {
  await loadAllRecipes();
  
  const searchInput = document.getElementById('inputbox1');
  const suggestionsContainer = document.getElementById('search-suggestions');
  
  // Handle input changes
  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.trim();
    
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Hide suggestions if input is empty
    if (!searchTerm) {
      suggestionsContainer.classList.remove('show');
      return;
    }
    
    // Debounce search to avoid too many requests
    searchTimeout = setTimeout(() => {
      const suggestions = getSearchSuggestions(searchTerm);
      displaySearchSuggestions(suggestions, searchTerm);
    }, 300);
  });
  
  // Handle suggestion clicks
  suggestionsContainer.addEventListener('click', (e) => {
    const suggestionItem = e.target.closest('.suggestion-item');
    if (suggestionItem) {
      const recipeId = suggestionItem.dataset.recipeId;
      const recipeName = suggestionItem.dataset.recipeName;
      handleSuggestionSelection(recipeId, recipeName);
    }
  });
  
  // Handle keyboard navigation
  let selectedIndex = -1;
  searchInput.addEventListener('keydown', (e) => {
    const suggestions = suggestionsContainer.querySelectorAll('.suggestion-item');
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, suggestions.length - 1);
      updateSelection(suggestions, selectedIndex);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, -1);
      updateSelection(suggestions, selectedIndex);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      const selectedSuggestion = suggestions[selectedIndex];
      if (selectedSuggestion) {
        const recipeId = selectedSuggestion.dataset.recipeId;
        const recipeName = selectedSuggestion.dataset.recipeName;
        handleSuggestionSelection(recipeId, recipeName);
      }
    } else if (e.key === 'Escape') {
      suggestionsContainer.classList.remove('show');
      selectedIndex = -1;
    }
  });
  
  // Hide suggestions when clicking outside
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
      suggestionsContainer.classList.remove('show');
      selectedIndex = -1;
    }
  });
}

function updateSelection(suggestions, selectedIndex) {
  suggestions.forEach((suggestion, index) => {
    suggestion.classList.toggle('selected', index === selectedIndex);
  });
}

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

// Initialize search functionality when page loads
document.addEventListener('DOMContentLoaded', () => {
  initializeSearch();
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
  
  // Hide suggestions before redirecting
  document.getElementById('search-suggestions').classList.remove('show');
  
  // Store the search term in sessionStorage and redirect to search page
  sessionStorage.setItem('recipeSearchTerm', searchValue);
  window.location.href = '../recipesearch/recipesearch.html';
}); 

// Ingredient-based search for recipes

document.getElementById('find-recipes-btn').addEventListener('click', async () => {
  const inputBox = document.getElementById('ingredient-input');
  const errorContainer = document.getElementById('errorContainer');
  const inputValue = inputBox.value.trim();
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
    
    // Calculate how many input ingredients match recipe ingredients
    let matchingIngredientsCount = 0;
    
    ingredients.forEach(inputIngredient => {
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
    const requiredMatches = Math.ceil(ingredients.length * requiredMatchPercentage);
    
    if (matchingIngredientsCount >= requiredMatches) {
      matchingRecipeIds.push(doc.id);
    }
  });
  
  if (matchingRecipeIds.length > 0) {
    // Store the search term in sessionStorage and redirect to homeingredient page
    sessionStorage.setItem('ingredientSearchTerm', inputValue);
    window.location.href = '../homeingredient/homeingredient.html';
  } else {
    errorContainer.innerHTML = `<i class="fas fa-exclamation-circle"></i> No recipes found with at least 75% of those ingredients.`;
    errorContainer.style.display = 'block';
    setTimeout(() => { errorContainer.style.display = 'none'; }, 5000);
  }
});

// Add Enter key support for search boxes (updated to work with suggestions)
document.getElementById('inputbox1').addEventListener('keypress', function(event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    // Check if there's a selected suggestion first
    const selectedSuggestion = document.querySelector('.suggestion-item.selected');
    if (selectedSuggestion) {
      const recipeId = selectedSuggestion.dataset.recipeId;
      const recipeName = selectedSuggestion.dataset.recipeName;
      handleSuggestionSelection(recipeId, recipeName);
    } else {
      document.getElementById('search-btn').click();
    }
  }
});

document.getElementById('ingredient-input').addEventListener('keypress', function(event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    document.getElementById('find-recipes-btn').click();
  }
});

window.toggleMenu = toggleMenu;