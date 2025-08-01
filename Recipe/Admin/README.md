# Recipe Finder Admin Panel

A comprehensive admin panel for managing users, recipes, and database content in the Recipe Finder web application.

## Features

### 🔐 Admin Authentication
- Secure admin login with Firebase authentication
- Role-based access control (admin vs regular users)
- Session management and auto-logout

### 📊 Admin Dashboard
- Real-time statistics overview
- Quick access to all admin functions
- Recent activity monitoring
- Responsive design for all devices

### 👥 User Management
- View all registered users
- Edit user profiles and information
- Manage admin privileges
- Activate/deactivate user accounts
- Search and filter users
- Delete user accounts

### 🍳 Recipe Management
- View all recipes in the system
- Edit recipe content and details
- Manage recipe visibility (public/private)
- Filter recipes by type (admin/user created)
- Search recipes by title, description, or author
- Delete recipes

### ✨ Admin Recipe Creation
- Create recipes without showing admin name
- Full recipe editor with all fields
- Category and difficulty management
- Ingredient and instruction management

## Setup Instructions

### 1. Create Your First Admin User

To set up the admin panel, you need to create an admin user first. Follow these steps:

1. **Register a regular user account** through the main signup page
2. **Access Firebase Console** and go to your project
3. **Navigate to Firestore Database**
4. **Find the user document** in the "users" collection
5. **Add the admin field** to the user document:
   ```json
   {
     "firstname": "Your Name",
     "lastname": "Your Last Name", 
     "email": "your-email@gmail.com",
     "isAdmin": true
   }
   ```

### 2. Access the Admin Panel

1. **Navigate to the admin login page**: `Recipe/Admin/adminlogin/adminlogin.html`
2. **Login with your admin credentials**
3. **You'll be redirected to the admin dashboard**

## File Structure

```
Recipe/Admin/
├── adminlogin/           # Admin authentication
│   ├── adminlogin.html
│   ├── adminlogin.css
│   └── adminlogin.js
├── adminhome/           # Admin dashboard
│   ├── adminhome.html
│   ├── adminhome.css
│   └── adminhome.js
├── adminusers/          # User management
│   ├── adminusers.html
│   ├── adminusers.css
│   └── adminusers.js
├── adminrecipes/        # Recipe management
│   ├── adminrecipes.html
│   ├── adminrecipes.css
│   └── adminrecipes.js
└── README.md           # This file
```

## Security Features

- **Admin-only access**: Only users with `isAdmin: true` can access the admin panel
- **Session validation**: Automatic logout when session expires
- **Secure authentication**: Firebase Auth integration
- **Input validation**: All forms include proper validation
- **CSRF protection**: Session-based authentication

## Database Schema

### Users Collection
```json
{
  "firstname": "string",
  "lastname": "string", 
  "email": "string",
  "isAdmin": boolean,
  "status": "active|inactive",
  "createdAt": timestamp,
  "updatedAt": timestamp
}
```

### Recipes Collection
```json
{
  "title": "string",
  "description": "string",
  "category": "breakfast|lunch|dinner|dessert|snack",
  "prepTime": number,
  "cookTime": number,
  "servings": number,
  "difficulty": "easy|medium|hard",
  "ingredients": ["array"],
  "instructions": ["array"],
  "authorName": "string",
  "authorId": "string",
  "isAdminRecipe": boolean,
  "status": "public|private",
  "createdAt": timestamp,
  "updatedAt": timestamp
}
```

## Usage Guide

### Managing Users
1. Navigate to "User Management" from the sidebar
2. Use search to find specific users
3. Filter by role (admin/user) or sort by different criteria
4. Click "Edit" to modify user information
5. Click "Delete" to remove user accounts

### Managing Recipes
1. Navigate to "Recipe Management" from the sidebar
2. View recipes in a card-based layout
3. Filter by recipe type (admin/user created)
4. Search recipes by title, description, or author
5. Edit recipe details using the comprehensive form
6. Control recipe visibility (public/private)

### Creating Admin Recipes
1. Navigate to "Create Recipe" from the sidebar
2. Fill in all recipe details
3. Admin recipes won't show the admin's name as author
4. Set visibility and difficulty levels
5. Save the recipe

## Troubleshooting

### Common Issues

1. **Can't access admin panel**
   - Ensure the user has `isAdmin: true` in the database
   - Check Firebase authentication is working
   - Verify the user is logged in

2. **Admin login not working**
   - Check if the user exists in the "users" collection
   - Verify the email and password are correct
   - Ensure Firebase configuration is correct

3. **Data not loading**
   - Check Firebase Firestore rules
   - Verify internet connection
   - Check browser console for errors

### Error Messages

- **"Access denied"**: User doesn't have admin privileges
- **"Failed to load users/recipes"**: Database connection issue
- **"Authentication failed"**: Invalid credentials

## Browser Compatibility

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Responsive Design

The admin panel is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones

## Support

For technical support or questions about the admin panel, please check:
1. Browser console for error messages
2. Firebase console for authentication issues
3. Network tab for API call failures

## Future Enhancements

Potential features for future updates:
- Bulk user operations
- Recipe analytics and statistics
- Advanced search filters
- Export functionality
- Activity logs
- Backup and restore features 