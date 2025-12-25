import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from 'expo-local-authentication';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { getSalt, setSessionKeys, getVault } from '../utils/storage';
import { deriveKey, decryptDEK, parseRecoveryKey } from '../vault/crypto';

export default function UnlockScreen({ email, onUnlock }) {
  const [masterPassword, setMasterPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [useRecoveryKey, setUseRecoveryKey] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState('');

  useEffect(() => {
    checkBiometrics();
  }, []);

  const checkBiometrics = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setBiometricAvailable(compatible && enrolled);
  };

  const handleBiometricUnlock = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock PassVault',
        fallbackLabel: 'Use Password',
        cancelLabel: 'Cancel'
      });

      if (result.success) {
        // After biometric auth, still need to unlock with actual keys
        Alert.alert('Biometric Success', 'Please enter your master password to unlock vault');
      }
    } catch (err) {
      Alert.alert('Error', 'Biometric authentication failed');
    }
  };

  const handleUnlock = async () => {
    if (!masterPassword) {
      Alert.alert('Error', 'Please enter your master password');
      return;
    }

    setLoading(true);
    try {
      const salt = await getSalt();
      if (!salt) {
        Alert.alert('Error', 'No salt found. Please register first.');
        setLoading(false);
        return;
      }

      // Derive master key from password
      const masterKey = await deriveKey(masterPassword, salt);

      // Get vault data
      const vaultData = await getVault();
      if (!vaultData) {
        Alert.alert('Error', 'No vault data found');
        setLoading(false);
        return;
      }

      // Decrypt DEK
      const encryptedDEK = new Uint8Array(vaultData.encryptedDEK);
      const dekIV = new Uint8Array(vaultData.dekIV);
      const dek = await decryptDEK(encryptedDEK, dekIV, masterKey);

      // Store session keys
      await setSessionKeys(masterKey, dek);

      // Navigate to vault
      onUnlock({ masterKey, dek });
    } catch (err) {
      Alert.alert('Unlock Failed', 'Invalid password or corrupted vault data');
    } finally {
      setLoading(false);
    }
  };

  const handleRecoveryKeyUnlock = async () => {
    if (!recoveryKey) {
      Alert.alert('Error', 'Please enter your recovery key');
      return;
    }

    setLoading(true);
    try {
      const { email: recoveryEmail, password, salt } = parseRecoveryKey(recoveryKey);

      if (recoveryEmail !== email) {
        Alert.alert('Error', 'Recovery key does not match this account');
        setLoading(false);
        return;
      }

      // Derive master key from recovered password
      const masterKey = await deriveKey(password, salt);

      // Get vault data
      const vaultData = await getVault();
      if (!vaultData) {
        Alert.alert('Error', 'No vault data found');
        setLoading(false);
        return;
      }

      // Decrypt DEK
      const encryptedDEK = new Uint8Array(vaultData.encryptedDEK);
      const dekIV = new Uint8Array(vaultData.dekIV);
      const dek = await decryptDEK(encryptedDEK, dekIV, masterKey);

      // Store session keys
      await setSessionKeys(masterKey, dek);

      onUnlock({ masterKey, dek });
    } catch (err) {
      Alert.alert('Recovery Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  const pickRecoveryKeyFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/plain',
        copyToCacheDirectory: true
      });

      if (result.type === 'success') {
        const content = await FileSystem.readAsStringAsync(result.uri);
        // Extract recovery key from file
        const keyMatch = content.match(/Recovery Key:\s*([A-Za-z0-9+/=]+)/);
        if (keyMatch) {
          setRecoveryKey(keyMatch[1]);
          Alert.alert('Success', 'Recovery key loaded from file');
        } else {
          Alert.alert('Error', 'Invalid recovery key file format');
        }
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to load recovery key file');
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <LinearGradient
        colors={['#4F46E5', '#7C3AED']}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: 'white', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }}>
            {/* Logo */}
            <View style={{ alignItems: 'center', marginBottom: 24 }}>
              <View style={{ width: 64, height: 64, backgroundColor: '#4F46E5', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 32, color: 'white' }}>🔓</Text>
              </View>
              <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#1F2937' }}>Unlock Vault</Text>
              <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>{email}</Text>
            </View>

            {/* Toggle Master Password / Recovery Key */}
            <View style={{ flexDirection: 'row', marginBottom: 24, backgroundColor: '#F3F4F6', borderRadius: 12, padding: 4 }}>
              <TouchableOpacity
                onPress={() => setUseRecoveryKey(false)}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: !useRecoveryKey ? '#4F46E5' : 'transparent'
                }}
              >
                <Text style={{ textAlign: 'center', color: !useRecoveryKey ? 'white' : '#6B7280', fontWeight: '600', fontSize: 13 }}>Password</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setUseRecoveryKey(true)}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: useRecoveryKey ? '#4F46E5' : 'transparent'
                }}
              >
                <Text style={{ textAlign: 'center', color: useRecoveryKey ? 'white' : '#6B7280', fontWeight: '600', fontSize: 13 }}>Recovery Key</Text>
              </TouchableOpacity>
            </View>

            {!useRecoveryKey ? (
              <>
                {/* Master Password Unlock */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 12, fontWeight: '500', color: '#374151', marginBottom: 6 }}>Master Password</Text>
                  <TextInput
                    value={masterPassword}
                    onChangeText={setMasterPassword}
                    placeholder="Enter your master password"
                    secureTextEntry
                    style={{
                      backgroundColor: '#F9FAFB',
                      borderWidth: 1,
                      borderColor: '#E5E7EB',
                      borderRadius: 10,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      fontSize: 14
                    }}
                  />
                </View>

                <TouchableOpacity
                  onPress={handleUnlock}
                  disabled={loading}
                  style={{
                    backgroundColor: '#4F46E5',
                    borderRadius: 10,
                    paddingVertical: 14,
                    marginBottom: 12
                  }}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={{ textAlign: 'center', color: 'white', fontWeight: '700', fontSize: 16 }}>
                      Unlock Vault
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Biometric Unlock */}
                {biometricAvailable && (
                  <TouchableOpacity
                    onPress={handleBiometricUnlock}
                    style={{
                      backgroundColor: '#10B981',
                      borderRadius: 10,
                      paddingVertical: 14
                    }}
                  >
                    <Text style={{ textAlign: 'center', color: 'white', fontWeight: '700', fontSize: 16 }}>
                      🔐 Use Face ID / Touch ID
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <>
                {/* Recovery Key Unlock */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 12, fontWeight: '500', color: '#374151', marginBottom: 6 }}>Recovery Key</Text>
                  <TextInput
                    value={recoveryKey}
                    onChangeText={setRecoveryKey}
                    placeholder="Paste your recovery key"
                    multiline
                    numberOfLines={4}
                    style={{
                      backgroundColor: '#F9FAFB',
                      borderWidth: 1,
                      borderColor: '#E5E7EB',
                      borderRadius: 10,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      fontSize: 12,
                      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                      textAlignVertical: 'top'
                    }}
                  />
                </View>

                <TouchableOpacity
                  onPress={pickRecoveryKeyFile}
                  style={{
                    backgroundColor: '#F3F4F6',
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    borderRadius: 10,
                    paddingVertical: 12,
                    marginBottom: 16
                  }}
                >
                  <Text style={{ textAlign: 'center', color: '#4F46E5', fontWeight: '600', fontSize: 14 }}>
                    📄 Load from File
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleRecoveryKeyUnlock}
                  disabled={loading}
                  style={{
                    backgroundColor: '#F59E0B',
                    borderRadius: 10,
                    paddingVertical: 14
                  }}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={{ textAlign: 'center', color: 'white', fontWeight: '700', fontSize: 16 }}>
                      Unlock with Recovery Key
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 16, textAlign: 'center' }}>
              🔒 Your vault is encrypted with zero-knowledge encryption
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}
