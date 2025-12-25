# Test App Instructions

## What This Does
A simplified App.js that tests all boolean props that commonly cause the "java.lang.String cannot be cast to java.lang.Boolean" error.

## Files Created
- `App.js` - Replaced with test version
- `App.js.backup` - Your original app (BACKUP)
- `App.test.js` - Standalone test version

## How to Test

### 1. Run the Test App
```bash
npx expo start --clear
```

### 2. Interpret Results

**✅ If the app loads WITHOUT errors:**
- The issue is in your main app code (screens, components)
- Check LoginScreen.js, UnlockScreen.js, VaultScreen.js for prop issues
- Restore your app and debug specific screens

**❌ If you STILL get the boolean casting error:**
- The issue is in dependencies or React Native version
- Try: `npx expo install --fix`
- Try: Update packages: `npx expo install react-native@latest`
- Check package.json for incompatible versions

## To Restore Original App

### Option 1: PowerShell
```powershell
Copy-Item App.js.backup App.js -Force
```

### Option 2: Manual
Simply rename `App.js.backup` back to `App.js`

## Common Props Tested
The test app checks these props that often cause issues:
- `autoCapitalize="none"` (string)
- `secureTextEntry={true}` (boolean)
- `multiline={true}` (boolean)
- `autoCorrect={false}` (boolean)
- `editable={true}` (boolean)

## Next Steps Based on Results

### If Test App Works:
1. Restore original app
2. Comment out screens one by one in original App.js
3. Find the problematic screen/component
4. Fix the specific boolean prop causing the issue

### If Test App Fails:
1. Check React Native version compatibility
2. Clear node_modules: `rm -rf node_modules && npm install`
3. Update dependencies: `npx expo install --fix`
4. Check for native module issues

## Quick Fix Commands
```bash
# Clear cache and restart
npx expo start --clear

# Fix dependencies
npx expo install --fix

# Reinstall everything
rm -rf node_modules package-lock.json
npm install

# Restore original app
Copy-Item App.js.backup App.js -Force
```

## Created on: December 25, 2025
