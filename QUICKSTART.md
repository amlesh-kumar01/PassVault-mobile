# PassVault Mobile - Quick Start Guide

## ✅ Project Successfully Created!

Your React Native Expo app is ready with all the PassVault logic from the browser extension.

## 📁 Project Structure

```
mobile/
├── App.js                          # Main app with navigation
├── app.json                        # Expo configuration
├── package.json                    # Dependencies
├── src/
│   ├── screens/
│   │   ├── LoginScreen.js         # Login/Register with recovery key
│   │   ├── UnlockScreen.js        # Unlock with password/recovery/biometric
│   │   └── VaultScreen.js         # Password management
│   ├── utils/
│   │   ├── api.js                 # Backend API calls (same as extension)
│   │   └── storage.js             # React Native storage layer
│   └── vault/
│       ├── crypto.js              # Crypto module (100% from extension)
│       └── sync.js                # Sync hook
└── README.md                       # Full documentation
```

## 🚀 How to Run

### 1. Start Backend Server
```bash
cd e:/PRODIGY/PassVault/backend
python app.py
```

### 2. Start Expo Development Server
```bash
cd e:/PRODIGY/PassVault/mobile
npx expo start
```

### 3. Run on Device/Emulator

**Option A: Physical Device**
1. Install "Expo Go" from App Store/Play Store
2. Scan QR code from terminal
3. App will load on your device

**Option B: Android Emulator**
```bash
npx expo run:android
```

**Option C: iOS Simulator (macOS only)**
```bash
npx expo run:ios
```

## 🔑 Features Implemented

### ✅ Crypto (100% from Extension)
- Argon2id key derivation (same parameters)
- AES-256-GCM encryption
- Envelope encryption (DEK wrapped with master key)
- Zero-knowledge architecture
- Recovery key generation

### ✅ Screens
- **LoginScreen**: Dual-password registration + recovery key download
- **UnlockScreen**: Master password / recovery key / biometric unlock
- **VaultScreen**: Add, view, copy, delete passwords

### ✅ Storage
- AsyncStorage for encrypted vault
- SecureStore for tokens, salt, session keys
- Session persistence across app restarts

### ✅ Sync
- Same backend API endpoints
- Encrypted blob sync (backend cannot decrypt)
- Version conflict resolution

### ✅ Biometric
- Face ID / Touch ID support
- Fallback to master password

### ✅ Recovery Key
- Download as .txt file
- Import from file
- Same format as browser extension

## 📱 Testing Flow

1. **Register New Account**
   - Email: test@example.com
   - Account Password: backend123 (for API auth)
   - Master Password: MySecureVault2024! (for encryption)
   - Download recovery key (required)
   - Click "Create Account"

2. **Unlock Vault**
   - Enter master password OR
   - Use recovery key OR
   - Use Face ID/Touch ID (after first unlock)

3. **Add Password**
   - Tap + button
   - Fill in name, URL, username, password
   - Save

4. **Copy Password**
   - Tap credential to expand
   - Tap "Copy Password"
   - Password copied to clipboard

5. **Lock/Logout**
   - Tap menu (⋮)
   - Lock Vault (keeps you logged in)
   - Logout (clears all data)

## 🔧 Configuration

### Change Backend URL (for physical devices)

Edit `src/utils/api.js`:
```javascript
const API_BASE_URL = 'http://YOUR_COMPUTER_IP:5000/api';
// Example: 'http://192.168.1.100:5000/api'
```

### Customize Colors

Edit gradients in screens:
```javascript
<LinearGradient colors={['#4F46E5', '#7C3AED']}>
// Change to your brand colors
```

## 🛠️ Troubleshooting

### "Failed to derive key"
- Make sure @noble/hashes is installed
- Clear Metro bundler cache: `npx expo start --clear`

### "API request failed"
- Check backend is running on port 5000
- For physical devices, use computer's IP address
- Ensure firewall allows connections

### "Biometric not available"
- Device must have Face ID/Touch ID enrolled
- Check app.json has proper permissions
- iOS: NSFaceIDUsageDescription must be set

### "Recovery key download failed"
- Check expo-file-system and expo-sharing are installed
- Ensure device supports sharing functionality

## 📦 Dependencies Installed

```json
{
  "@react-navigation/native": "^7.0.0",
  "@react-navigation/stack": "^7.0.0",
  "react-native-screens": "^4.0.0",
  "react-native-safe-area-context": "^5.0.0",
  "expo-crypto": "^14.0.0",
  "expo-secure-store": "^14.0.0",
  "expo-local-authentication": "^14.0.0",
  "expo-file-system": "^18.0.0",
  "expo-sharing": "^13.0.0",
  "expo-clipboard": "^7.0.0",
  "@react-native-async-storage/async-storage": "^2.0.0",
  "react-native-get-random-values": "^1.11.0",
  "@noble/hashes": "^1.6.1",
  "expo-linear-gradient": "^14.0.0",
  "expo-document-picker": "^12.0.0",
  "react-native-gesture-handler": "^2.20.0"
}
```

## 🎯 Next Steps

### Immediate
1. Test registration flow
2. Test unlock with all three methods
3. Add/delete passwords
4. Test sync across devices

### Future Enhancements
1. Password generator
2. Password strength indicator
3. Search/filter
4. Categories/tags
5. Native auto-fill (iOS Password AutoFill / Android Autofill Service)
6. Offline mode with background sync
7. Import/export vault

## 📞 Support

Check README.md for full documentation.

The crypto logic is **identical** to the browser extension, so encrypted vaults are compatible across platforms!
