/* eslint-disable jsx-a11y/accessible-emoji */
import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  View,
  Text,
  StatusBar,
} from 'react-native';
import { Omnibox } from '../components/Omnibox';
import { usePowerManagement } from '../hooks/usePowerManagement';
import { initializeDatabase } from '../database';

// Zéro Cloud Logs: Assurez-vous qu'aucun service tiers n'est importé/activé ici pour les PHI.

export const App = () => {
  const powerState = usePowerManagement();
  const [isDbReady, setIsDbReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    initializeDatabase()
      .then(() => {
        if (isMounted) setIsDbReady(true);
      })
      .catch((err) => {
        console.error('Database initialization failed:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  if (!isDbReady) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {powerState.isLowPowerMode && (
        <View style={{ backgroundColor: 'red', padding: 10, marginTop: 40 }}>
          <Text
            style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}
          >
            ⚠️ Mode Survie (Batterie Faible). Sync ={' '}
            {powerState.syncIntervalMs / 1000}s
          </Text>
        </View>
      )}
      <View style={{ flex: 1, marginTop: powerState.isLowPowerMode ? 10 : 50 }}>
        <Omnibox />
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});

export default App;
