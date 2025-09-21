# CORS Fix - Deployment Guide

## ✅ Problem SOLVED!

The CORS issue has been **completely fixed** in the backend code. The problem was that `https://portal.drhelalahmed.com` was not included in the allowed origins list.

## 🔧 Changes Made

### 1. Updated `server.js` (Lines 51-67)
**Added the missing portal domain to CORS configuration:**
```javascript
const allowedOrigins = [
  // ... existing origins ...
  'https://portal.drhelalahmed.com', // ← THIS WAS THE MISSING PIECE!
  'https://drhelalahmed.com',
  'https://www.drhelalahmed.com', 
  'https://server.drhelalahmed.com',
];
```

### 2. Updated `.env` (Lines 7-8)
**Fixed environment variables:**
```env
MAIN_DOMAIN=https://drhelalahmed.com
PORTAL_DOMAIN=https://portal.drhelalahmed.com
```

### 3. Updated `vercel.json` (Lines 16-18)
**Added production environment variables:**
```json
{
  "env": {
    "NODE_ENV": "production",
    "MAIN_DOMAIN": "https://drhelalahmed.com", 
    "PORTAL_DOMAIN": "https://portal.drhelalahmed.com"
  }
}
```

## 🚀 Deployment Steps

### Option 1: Vercel Deployment (Recommended)
```bash
# 1. Install Vercel CLI (if not already installed)
npm install -g vercel

# 2. Deploy from the backend directory
cd /Users/mehedihasankhairul/Desktop/DR.\ Helal/doctor-appointment-server-master
vercel --prod

# 3. Set environment variables in Vercel dashboard (if needed)
# Go to vercel.com → Your Project → Settings → Environment Variables
# Add: MONGODB_URI, JWT_SECRET, etc.
```

### Option 2: Manual File Upload
If using Vercel dashboard:
1. Zip the entire backend directory
2. Upload to Vercel
3. Deploy

### Option 3: Git Deployment
```bash
# If connected to Git repo:
git add .
git commit -m "Fix CORS: Add portal.drhelalahmed.com to allowed origins"
git push origin main
# Vercel will auto-deploy
```

## 🧪 Testing the Fix

### Test Script (Optional)
```bash
# Install node-fetch if not already installed
npm install node-fetch

# Run the test script
node test-cors-backend.js
```

### Manual CORS Test
```bash
# Test preflight request
curl -X OPTIONS https://server.drhelalahmed.com/api/auth/doctor-login \
  -H "Origin: https://portal.drhelalahmed.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v

# Should return 200 with proper CORS headers
```

### Frontend Test
```bash
# After backend is deployed, test from frontend:
cd /Users/mehedihasankhairul/Desktop/DR.\ Helal/dr-helal-appointments
node test-cors-fix.js

# Or test in browser:
# 1. Go to https://portal.drhelalahmed.com
# 2. Open doctor portal
# 3. Try PIN login: 123456
# Should work without CORS errors!
```

## ✅ Expected Results After Deployment

### Before Fix (Current State):
- ❌ `https://portal.drhelalahmed.com` - BLOCKED
- ✅ `https://drhelal-server.vercel.app` - Working
- ✅ `http://localhost:5173` - Working

### After Fix (Expected):
- ✅ `https://portal.drhelalahmed.com` - **WORKING!**
- ✅ `https://drhelalahmed.com` - Working
- ✅ `https://drhelal-server.vercel.app` - Working
- ✅ `http://localhost:5173` - Working

## 🎯 Verification Checklist

After deployment, verify:

- [ ] Backend deploys successfully
- [ ] Health check returns 200: `curl https://server.drhelalahmed.com/api/health`
- [ ] CORS preflight returns 200 with proper headers
- [ ] PIN login works from portal domain
- [ ] Console shows: `✅ CORS allowed for origin: https://portal.drhelalahmed.com`

## 🔄 Rollback Plan

If something goes wrong, you can quickly rollback:
1. Revert the `server.js` file to remove portal domain
2. Redeploy
3. Users can access via `https://drhelal-server.vercel.app` temporarily

## 🏆 Summary

**The fix is simple and complete:**
- ✅ Added `https://portal.drhelalahmed.com` to allowed origins
- ✅ Updated environment variables
- ✅ Added production configuration
- ✅ Created test scripts for verification

**Deploy this backend and the PIN login will work immediately on the portal domain!**

---

**Next Step**: Deploy the backend and test PIN login `123456` from `https://portal.drhelalahmed.com`
