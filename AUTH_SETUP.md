# 🔐 Authentication Setup Guide - merTMS

This guide walks you through implementing **email-based authentication** for merTMS using Supabase's built-in auth system. No external OAuth providers needed!

> ✅ **Status:** Authentication system fully deployed and configured

---

## ✅ What You Get

- **Email/Password Authentication** with email verification
- **Magic Links** (passwordless login via email)
- **User Profiles** stored in Supabase with custom fields (name, company, role)
- **Protected Routes** with role-based access control
- **Password Reset** functionality
- **Automatic session management**

---

## 📋 Setup Steps

### **Step 1: Run Database Migration** (2 minutes)

1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Copy the contents of `supabase/migrations/002_auth_profiles.sql`
4. Paste and run it in the SQL Editor
5. Verify the `profiles` table was created (check **Table Editor**)

This creates:
- ✅ `profiles` table for user data
- ✅ Row Level Security policies
- ✅ Auto-trigger to create profile on signup
- ✅ Functions for handling new users

---

### **Step 2: Configure Supabase Auth** (3 minutes)

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Find **Email** provider
3. Enable these settings:
   - ✅ **Enable Email provider**
   - ✅ **Confirm email** (sends verification link)
   - ✅ **Secure email change** (recommended)

4. (Optional) Under **Email Templates**, customize:
   - Confirmation email
   - Magic Link email
   - Password Reset email
   - Email Change email

5. Under **URL Configuration**, set:
   - **Site URL**: `https://mertmensah.github.io/merTMS`
   - **Redirect URLs**: Add these:
     - `https://mertmensah.github.io/merTMS/auth/callback`
     - `http://localhost:5173/auth/callback` (for local dev)

---

### **Step 3: Update Frontend App** (5 minutes)

Update `frontend/src/App.jsx` to include auth routes and wrap with AuthProvider:

```jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

// Auth components
import Login from './components/Login'
import Register from './components/Register'
import AuthCallback from './components/AuthCallback'
import UserProfile from './components/UserProfile'

// Existing components
import Dashboard from './components/Dashboard'
import OrderManagement from './components/OrderManagement'
import ControlTower from './components/ControlTower'
// ... other imports

function App() {
  return (
    <AuthProvider>
      <Router basename="/merTMS">
        <Routes>
          {/* Public Routes */}
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Protected Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          } />

          <Route path="/orders" element={
            <ProtectedRoute>
              <OrderManagement />
            </ProtectedRoute>
          } />

          <Route path="/control-tower" element={
            <ProtectedRoute>
              <ControlTower />
            </ProtectedRoute>
          } />

          {/* Admin-only routes */}
          <Route path="/admin/*" element={
            <ProtectedRoute requireAdmin={true}>
              <AdminPanel />
            </ProtectedRoute>
          } />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
```

---

### **Step 4: Add User Menu to Navigation** (Optional)

Update your main navigation/header component to show user info:

```jsx
import { useAuth } from '../contexts/AuthContext'

function Navigation() {
  const { user, profile, signOut } = useAuth()

  return (
    <nav>
      {/* Existing nav items */}
      
      {user && (
        <div className="user-menu">
          <span>👤 {profile?.full_name || user.email}</span>
          <Link to="/profile">Profile</Link>
          <button onClick={signOut}>Sign Out</button>
        </div>
      )}
    </nav>
  )
}
```

---

### **Step 5: Test the Authentication Flow**

1. **Start your dev server**:
   ```bash
   cd frontend
   npm run dev
   ```

2. **Test Registration**:
   - Go to `/auth/register`
   - Fill out the form
   - Submit → Check your email for verification link
   - Click link → Redirects to app (logged in)

3. **Test Password Login**:
   - Go to `/auth/login`
   - Select "Password" tab
   - Enter email/password
   - Login successful

4. **Test Magic Link**:
   - Go to `/auth/login`
   - Select "Magic Link" tab
   - Enter email
   - Check email for magic link
   - Click link → Auto-login

5. **Test Protected Routes**:
   - Try accessing `/orders` without login → Redirects to `/auth/login`
   - Login → Access granted

---

## 🎨 Customization Options

### **Add Role-Based Access**

Update a user's role in Supabase:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your.email@company.com';
```

Available roles:
- `user` - Standard user (default)
- `dispatcher` - Can manage loads/assignments
- `driver` - Can view assigned loads
- `admin` - Full access

Then use in components:
```jsx
import { useAuth } from '../contexts/AuthContext'

function SomeComponent() {
  const { isAdmin, isDispatcher } = useAuth()

  return (
    <div>
      {isAdmin && <AdminPanel />}
      {isDispatcher && <DispatchTools />}
    </div>
  )
}
```

### **Customize Email Templates**

In Supabase Dashboard → Authentication → Email Templates:
- Add your company logo
- Change colors/branding
- Customize messaging

---

## 🔒 Security Features

✅ **Row Level Security (RLS)**: Users can only access their own data
✅ **Email Verification**: Required before full access
✅ **Secure Password Hashing**: Handled by Supabase (bcrypt)
✅ **JWT Tokens**: Auto-managed for API calls
✅ **HTTPS Only**: Enforced in production
✅ **Session Timeout**: Configurable (default 1 week)

---

## 🐛 Troubleshooting

### **"Email not confirmed" error**
- Check spam/junk folder for verification email
- Resend confirmation from Supabase Dashboard → Authentication → Users
- Or manually verify: Toggle "Email Confirmed" in user settings

### **Magic link not working**
- Check redirect URLs are configured in Supabase
- Ensure `AuthCallback` component is at `/auth/callback` route
- Check browser console for errors

### **Profile not created**
- Verify trigger exists: `on_auth_user_created`
- Check SQL editor for errors in migration
- Manually create profile:
  ```sql
  INSERT INTO profiles (id, email) VALUES ('user-uuid', 'email@example.com');
  ```

---

## 📚 Next Steps

1. ✅ Deploy authentication system
2. Add password reset page (`/auth/forgot-password`)
3. Add email change functionality
4. Implement 2FA (Supabase supports TOTP)
5. Add social providers later if needed (optional)

---

## 🎉 You're All Set!

Your merTMS platform now has:
- ✅ Secure email authentication
- ✅ User profiles in Supabase
- ✅ Protected routes
- ✅ Role-based access control
- ✅ Magic link login option

**No external OAuth setup required!** 🚀
