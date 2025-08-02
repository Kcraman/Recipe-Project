// User Management JavaScript
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

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
const auth = getAuth();
const db = getFirestore(app);

let allUsers = [];
let filteredUsers = [];
let currentEditUserId = null;

// Check admin authentication
function checkAdminAuth() {
    const adminEmail = sessionStorage.getItem('adminEmail');
    const adminUID = sessionStorage.getItem('adminUID');
    
    if (!adminEmail || !adminUID) {
        window.location.href = "../adminlogin/adminlogin.html";
        return false;
    }
    return true;
}

// Load admin name
async function loadAdminName() {
    const adminEmail = sessionStorage.getItem('adminEmail');
    if (adminEmail) {
        try {
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("email", "==", adminEmail));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                const userData = querySnapshot.docs[0].data();
                const adminName = userData.firstname + ' ' + userData.lastname;
                document.getElementById('adminName').textContent = adminName;
            }
        } catch (error) {
            console.error("Error loading admin name:", error);
        }
    }
}

// Load all users
async function loadUsers() {
    try {
        const usersRef = collection(db, "users");
        const querySnapshot = await getDocs(usersRef);
        
        allUsers = [];
        querySnapshot.forEach(doc => {
            const userData = doc.data();
            allUsers.push({
                id: doc.id,
                ...userData,
                createdAt: userData.createdAt || new Date(),
                isAdmin: userData.isAdmin || false,
                status: userData.status || 'active'
            });
        });
        
        filteredUsers = [...allUsers];
        updateStats();
        renderUsers();
        showSuccess(`Successfully loaded ${allUsers.length} users`);
        
    } catch (error) {
        console.error("Error loading users:", error);
        showError("Failed to load users. Please try again.");
    }
}

// Update statistics
function updateStats() {
    const totalUsers = allUsers.length;
    const adminUsers = allUsers.filter(user => user.isAdmin).length;
    const activeUsers = allUsers.filter(user => user.status === 'active').length;
    
    document.getElementById('totalUsers').textContent = totalUsers;
    document.getElementById('adminUsers').textContent = adminUsers;
    document.getElementById('activeUsers').textContent = activeUsers;
}

// Render users table
function renderUsers() {
    const tbody = document.getElementById('usersTableBody');
    
    if (filteredUsers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="no-users">
                    <i class="fas fa-users"></i>
                    No users found
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = filteredUsers.map(user => {
        const initials = `${user.firstname?.charAt(0) || ''}${user.lastname?.charAt(0) || ''}`.toUpperCase();
        const joinDate = user.createdAt ? new Date(user.createdAt.toDate ? user.createdAt.toDate() : user.createdAt).toLocaleDateString() : 'N/A';
        
        return `
            <tr>
                <td>
                    <div class="user-info">
                        <div class="user-avatar">${initials}</div>
                        <div class="user-details">
                            <h4>${user.firstname} ${user.lastname}</h4>
                            <p>User ID: ${user.id}</p>
                        </div>
                    </div>
                </td>
                <td>${user.email}</td>
                <td>
                    <span class="role-badge ${user.isAdmin ? 'admin' : 'user'}">
                        ${user.isAdmin ? 'Admin' : 'User'}
                    </span>
                </td>
                <td>
                    <span class="status-badge ${user.status}">
                        ${user.status}
                    </span>
                </td>
                <td>${joinDate}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit-btn" onclick="editUser('${user.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="action-btn delete-btn" onclick="deleteUser('${user.id}', '${user.firstname} ${user.lastname}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Search users
function searchUsers(query) {
    if (!query.trim()) {
        filteredUsers = [...allUsers];
    } else {
        const searchTerm = query.toLowerCase();
        filteredUsers = allUsers.filter(user => 
            user.firstname?.toLowerCase().includes(searchTerm) ||
            user.lastname?.toLowerCase().includes(searchTerm) ||
            user.email?.toLowerCase().includes(searchTerm)
        );
    }
    renderUsers();
}

// Filter users by role
function filterUsersByRole(role) {
    if (!role) {
        filteredUsers = [...allUsers];
    } else {
        filteredUsers = allUsers.filter(user => 
            (role === 'admin' && user.isAdmin) ||
            (role === 'user' && !user.isAdmin)
        );
    }
    renderUsers();
}

// Sort users
function sortUsers(sortBy) {
    switch (sortBy) {
        case 'name':
            filteredUsers.sort((a, b) => 
                `${a.firstname} ${a.lastname}`.localeCompare(`${b.firstname} ${b.lastname}`)
            );
            break;
        case 'email':
            filteredUsers.sort((a, b) => a.email.localeCompare(b.email));
            break;
        case 'date':
            filteredUsers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
    }
    renderUsers();
}

// Edit user
window.editUser = function(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;
    
    currentEditUserId = userId;
    
    document.getElementById('editFirstName').value = user.firstname || '';
    document.getElementById('editLastName').value = user.lastname || '';
    document.getElementById('editEmail').value = user.email || '';
    document.getElementById('editRole').value = user.isAdmin ? 'admin' : 'user';
    document.getElementById('editStatus').value = user.status || 'active';
    
    document.getElementById('editUserModal').style.display = 'block';
}

// Delete user
window.deleteUser = function(userId, userName) {
    currentEditUserId = userId;
    document.getElementById('deleteUserName').textContent = userName;
    document.getElementById('deleteUserModal').style.display = 'block';
}

// Close modal
window.closeModal = function(modalId) {
    document.getElementById(modalId).style.display = 'none';
    if (modalId === 'editUserModal') {
        currentEditUserId = null;
    }
}

// Save user changes
async function saveUserChanges() {
    if (!currentEditUserId) return;
    
    try {
        const firstName = document.getElementById('editFirstName').value;
        const lastName = document.getElementById('editLastName').value;
        const role = document.getElementById('editRole').value;
        const status = document.getElementById('editStatus').value;
        
        const userRef = doc(db, "users", currentEditUserId);
        await updateDoc(userRef, {
            firstname: firstName,
            lastname: lastName,
            isAdmin: role === 'admin',
            status: status,
            updatedAt: new Date()
        });
        
        // Update local data
        const userIndex = allUsers.findIndex(u => u.id === currentEditUserId);
        if (userIndex !== -1) {
            allUsers[userIndex] = {
                ...allUsers[userIndex],
                firstname: firstName,
                lastname: lastName,
                isAdmin: role === 'admin',
                status: status
            };
        }
        
        // Also update filteredUsers if the user is in the current filtered list
        const filteredUserIndex = filteredUsers.findIndex(u => u.id === currentEditUserId);
        if (filteredUserIndex !== -1) {
            filteredUsers[filteredUserIndex] = {
                ...filteredUsers[filteredUserIndex],
                firstname: firstName,
                lastname: lastName,
                isAdmin: role === 'admin',
                status: status
            };
        }
        
        closeModal('editUserModal');
        updateStats();
        renderUsers();
        showSuccess('User updated successfully');
        
    } catch (error) {
        console.error("Error updating user:", error);
        showError("Failed to update user. Please try again.");
    }
}

// Confirm delete user
async function confirmDeleteUser() {
    if (!currentEditUserId) return;
    
    try {
        const userRef = doc(db, "users", currentEditUserId);
        await deleteDoc(userRef);
        
        // Remove from local data
        allUsers = allUsers.filter(u => u.id !== currentEditUserId);
        
        closeModal('deleteUserModal');
        updateStats();
        renderUsers();
        showSuccess('User deleted successfully');
        
    } catch (error) {
        console.error("Error deleting user:", error);
        showError("Failed to delete user. Please try again.");
    }
}

// Show success message
function showSuccess(message) {
    showNotification(message, 'success', 'Success');
}

// Show error message
function showError(message) {
    showNotification(message, 'error', 'Error');
}

// Show info message
function showInfo(message) {
    showNotification(message, 'info', 'Info');
}

// Notification system
function showNotification(message, type = 'info', title = 'Notification') {
    const container = document.getElementById('notificationContainer');
    if (!container) return;
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icon = type === 'success' ? 'fas fa-check-circle' : 
                 type === 'error' ? 'fas fa-exclamation-circle' : 
                 'fas fa-info-circle';
    
    notification.innerHTML = `
        <i class="${icon} notification-icon"></i>
        <div class="notification-content">
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 400);
        }
    }, 5000);
}

// Logout function
async function logout() {
    try {
        await signOut(auth);
        sessionStorage.removeItem('adminEmail');
        sessionStorage.removeItem('adminUID');
        window.location.href = "../adminlogin/adminlogin.html";
    } catch (error) {
        console.error("Error during logout:", error);
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    if (!checkAdminAuth()) return;
    
    loadAdminName();
    loadUsers();
    
    // Search functionality
    document.getElementById('searchUsers').addEventListener('input', function(e) {
        searchUsers(e.target.value);
    });
    
    // Filter functionality
    document.getElementById('filterRole').addEventListener('change', function(e) {
        filterUsersByRole(e.target.value);
    });
    
    // Sort functionality
    document.getElementById('sortUsers').addEventListener('change', function(e) {
        sortUsers(e.target.value);
    });
    
    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', function() {
        showInfo('Refreshing users...');
        loadUsers();
    });
    
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    // Edit user form
    document.getElementById('editUserForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveUserChanges();
    });
    
    // Confirm delete button
    document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDeleteUser);
    
    // Close modals when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
});

// Check authentication state
onAuthStateChanged(auth, (user) => {
    if (!user) {
        sessionStorage.removeItem('adminEmail');
        sessionStorage.removeItem('adminUID');
        window.location.href = "../adminlogin/adminlogin.html";
    }
});
