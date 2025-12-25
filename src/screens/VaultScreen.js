import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { useSync } from '../vault/sync';
import { encryptVault, decryptVault } from '../vault/crypto';
import { getVault, setVault, getVaultVersion, setVaultVersion, clearSessionKeys } from '../utils/storage';

export default function VaultScreen({ token, keyPair, onLock, onLogout }) {
  const { masterKey, dek } = keyPair;
  const { syncStatus, pushToRemote } = useSync(token);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', url: '', username: '', password: '', note: '' });
  const [expandedItem, setExpandedItem] = useState(null);

  useEffect(() => {
    loadVault();
  }, []);

  const loadVault = async () => {
    try {
      const vaultData = await getVault();
      
      if (vaultData && vaultData.encryptedVault && vaultData.encryptedVault.length > 0) {
        const encryptedVault = new Uint8Array(vaultData.encryptedVault);
        const vaultIV = new Uint8Array(vaultData.vaultIV);
        
        const decrypted = await decryptVault(encryptedVault, vaultIV, dek);
        setItems(Array.isArray(decrypted) ? decrypted : []);
      } else {
        setItems([]);
      }
    } catch (err) {
      console.error("Failed to decrypt vault:", err);
      Alert.alert('Error', 'Failed to decrypt vault');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const saveVault = async (updatedItems) => {
    try {
      const { encryptedVault, iv: vaultIV } = await encryptVault(updatedItems, dek);
      
      const currentVault = await getVault();
      const currentVersion = await getVaultVersion();
      
      const updatedVault = {
        ...currentVault,
        encryptedVault: Array.from(encryptedVault),
        vaultIV: Array.from(vaultIV),
        version: currentVersion + 1
      };
      
      await setVault(updatedVault);
      await setVaultVersion(updatedVault.version);
      
      // Sync to backend
      const encryptedBlob = {
        encryptedVault: Array.from(encryptedVault),
        vaultIV: Array.from(vaultIV)
      };
      
      const result = await pushToRemote(encryptedBlob, updatedVault.version);
      
      if (!result.success) {
        Alert.alert('Sync Failed', result.error || 'Unknown error');
      }
      
      return true;
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Encryption/storage failed: ' + err.message);
      return false;
    }
  };

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.username || !newItem.password) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }

    const updatedItems = [...items, { 
      ...newItem, 
      id: Date.now().toString() + Math.random().toString(36),
      createdAt: Date.now() 
    }];
    
    setItems(updatedItems);
    setNewItem({ name: '', url: '', username: '', password: '', note: '' });
    setIsAdding(false);

    await saveVault(updatedItems);
  };

  const handleDeleteItem = async (itemId) => {
    Alert.alert(
      'Delete Password',
      'Are you sure you want to delete this credential?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedItems = items.filter(item => item.id !== itemId);
            setItems(updatedItems);
            await saveVault(updatedItems);
          }
        }
      ]
    );
  };

  const handleCopyPassword = async (password) => {
    await Clipboard.setStringAsync(password);
    Alert.alert('Copied', 'Password copied to clipboard');
  };

  const handleLock = async () => {
    await clearSessionKeys();
    onLock();
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await clearSessionKeys();
            onLogout();
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={{ marginTop: 12, color: '#6B7280' }}>Decrypting Vault...</Text>
      </View>
    );
  }

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
      style={{
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 4 }}>
            {item.name || 'Untitled'}
          </Text>
          <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 2 }}>{item.username}</Text>
          {item.url && <Text style={{ fontSize: 12, color: '#9CA3AF' }}>{item.url}</Text>}
        </View>
        
        {expandedItem !== item.id && (
          <TouchableOpacity
            onPress={() => handleCopyPassword(item.password)}
            style={{ padding: 8 }}
          >
            <Text style={{ fontSize: 20 }}>📋</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {expandedItem === item.id && (
        <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB' }}>
          <View style={{ backgroundColor: '#F9FAFB', padding: 12, borderRadius: 8, marginBottom: 12 }}>
            <Text style={{ fontSize: 11, color: '#6B7280', marginBottom: 4 }}>PASSWORD</Text>
            <Text style={{ fontSize: 14, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', color: '#1F2937' }}>
              {item.password}
            </Text>
          </View>
          
          {item.note && (
            <View style={{ backgroundColor: '#F9FAFB', padding: 12, borderRadius: 8, marginBottom: 12 }}>
              <Text style={{ fontSize: 11, color: '#6B7280', marginBottom: 4 }}>NOTE</Text>
              <Text style={{ fontSize: 13, color: '#374151' }}>{item.note}</Text>
            </View>
          )}
          
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={() => handleCopyPassword(item.password)}
              style={{ flex: 1, backgroundColor: '#4F46E5', borderRadius: 8, paddingVertical: 10 }}
            >
              <Text style={{ textAlign: 'center', color: 'white', fontWeight: '600', fontSize: 13 }}>Copy Password</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDeleteItem(item.id)}
              style={{ flex: 1, backgroundColor: '#EF4444', borderRadius: 8, paddingVertical: 10 }}
            >
              <Text style={{ textAlign: 'center', color: 'white', fontWeight: '600', fontSize: 13 }}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#F3F4F6' }}>
      {/* Header */}
      <LinearGradient colors={['#4F46E5', '#7C3AED']} style={{ paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white', marginLeft: 8 }}>🔐 PassVault</Text>
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
              <Text style={{ fontSize: 11, color: 'white', fontWeight: '600' }}>
                {syncStatus === 'syncing' ? '⟳ Syncing' : syncStatus === 'synced' ? '✓ Synced' : ''}
              </Text>
            </View>
            
            <TouchableOpacity onPress={() => setShowMenu(!showMenu)}>
              <Text style={{ fontSize: 24, color: 'white' }}>⋮</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Menu Dropdown */}
      {showMenu && (
        <View style={{ position: 'absolute', top: 100, right: 16, backgroundColor: 'white', borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4, zIndex: 1000, minWidth: 160 }}>
          <TouchableOpacity
            onPress={() => {
              setShowMenu(false);
              handleLock();
            }}
            style={{ paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}
          >
            <Text style={{ fontSize: 14, color: '#374151' }}>🔒 Lock Vault</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setShowMenu(false);
              handleLogout();
            }}
            style={{ paddingVertical: 12, paddingHorizontal: 16 }}
          >
            <Text style={{ fontSize: 14, color: '#EF4444' }}>🚪 Logout</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Main Content */}
      <View style={{ flex: 1, padding: 16 }}>
        {items.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>🗄️</Text>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#9CA3AF' }}>Your vault is empty</Text>
            <Text style={{ fontSize: 13, color: '#D1D5DB', marginTop: 4 }}>Tap + to add your first password</Text>
          </View>
        ) : (
          <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity
        onPress={() => setIsAdding(true)}
        style={{
          position: 'absolute',
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: '#4F46E5',
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 6
        }}
      >
        <Text style={{ fontSize: 28, color: 'white', fontWeight: '300' }}>+</Text>
      </TouchableOpacity>

      {/* Add Modal */}
      <Modal
        visible={isAdding}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsAdding(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1F2937' }}>Add Password</Text>
              <TouchableOpacity onPress={() => setIsAdding(false)}>
                <Text style={{ fontSize: 24, color: '#9CA3AF' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ marginBottom: 14 }}>
                <Text style={{ fontSize: 12, fontWeight: '500', color: '#374151', marginBottom: 6 }}>Name / Title *</Text>
                <TextInput
                  value={newItem.name}
                  onChangeText={(text) => setNewItem({ ...newItem, name: text })}
                  placeholder="e.g., Gmail, Facebook"
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

              <View style={{ marginBottom: 14 }}>
                <Text style={{ fontSize: 12, fontWeight: '500', color: '#374151', marginBottom: 6 }}>Website URL</Text>
                <TextInput
                  value={newItem.url}
                  onChangeText={(text) => setNewItem({ ...newItem, url: text })}
                  placeholder="https://example.com"
                  keyboardType="url"
                  autoCapitalize="none"
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

              <View style={{ marginBottom: 14 }}>
                <Text style={{ fontSize: 12, fontWeight: '500', color: '#374151', marginBottom: 6 }}>Username / Email *</Text>
                <TextInput
                  value={newItem.username}
                  onChangeText={(text) => setNewItem({ ...newItem, username: text })}
                  placeholder="username@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
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

              <View style={{ marginBottom: 14 }}>
                <Text style={{ fontSize: 12, fontWeight: '500', color: '#374151', marginBottom: 6 }}>Password *</Text>
                <TextInput
                  value={newItem.password}
                  onChangeText={(text) => setNewItem({ ...newItem, password: text })}
                  placeholder="••••••••"
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

              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 12, fontWeight: '500', color: '#374151', marginBottom: 6 }}>Note (Optional)</Text>
                <TextInput
                  value={newItem.note}
                  onChangeText={(text) => setNewItem({ ...newItem, note: text })}
                  placeholder="Additional notes..."
                  multiline
                  numberOfLines={3}
                  style={{
                    backgroundColor: '#F9FAFB',
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    fontSize: 14,
                    textAlignVertical: 'top'
                  }}
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  onPress={() => setIsAdding(false)}
                  style={{ flex: 1, backgroundColor: '#F3F4F6', borderRadius: 10, paddingVertical: 14 }}
                >
                  <Text style={{ textAlign: 'center', color: '#6B7280', fontWeight: '600', fontSize: 15 }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleAddItem}
                  style={{ flex: 1, backgroundColor: '#4F46E5', borderRadius: 10, paddingVertical: 14 }}
                >
                  <Text style={{ textAlign: 'center', color: 'white', fontWeight: '700', fontSize: 15 }}>Save Password</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
