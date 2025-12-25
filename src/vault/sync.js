// Sync hook for React Native

import { useState, useEffect } from 'react';
import { getVault, setVault, getVaultVersion, setVaultVersion } from '../utils/storage';
import { api } from '../utils/api';

export const useSync = (token) => {
  const [syncStatus, setSyncStatus] = useState('idle');

  const pushToRemote = async (encryptedBlob, version) => {
    try {
      setSyncStatus('syncing');
      const result = await api.syncVault(encryptedBlob, version);
      
      if (result.success) {
        setSyncStatus('synced');
        setTimeout(() => setSyncStatus('idle'), 2000);
      } else {
        setSyncStatus('error');
      }
      
      return result;
    } catch (err) {
      console.error('Push error:', err);
      setSyncStatus('error');
      return { success: false, error: err.message };
    }
  };

  const pullFromRemote = async () => {
    try {
      setSyncStatus('syncing');
      const { encryptedBlob, version: serverVersion } = await api.pullVault();
      const localVersion = await getVaultVersion();

      if (serverVersion > localVersion) {
        console.log(`Updating local vault from v${localVersion} to v${serverVersion}`);
        await setVault(encryptedBlob);
        await setVaultVersion(serverVersion);
        setSyncStatus('synced');
        setTimeout(() => setSyncStatus('idle'), 2000);
        return { success: true, updated: true, version: serverVersion };
      }
      
      setSyncStatus('idle');
      return { success: true, updated: false, version: localVersion };
    } catch (err) {
      console.error('Pull error:', err);
      setSyncStatus('error');
      return { success: false, error: err.message };
    }
  };

  useEffect(() => {
    if (!token) return;

    // Pull from remote on mount
    pullFromRemote();
  }, [token]);

  return {
    syncStatus,
    pushToRemote,
    pullFromRemote
  };
};
