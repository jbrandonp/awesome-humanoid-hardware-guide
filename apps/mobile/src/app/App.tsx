/* eslint-disable jsx-a11y/accessible-emoji */
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, StatusBar, ActivityIndicator } from 'react-native';
import { AppNavigator } from '../navigation/AppNavigator';
import { initializeDatabase } from '../database';
import { MDNSScannerService } from '../services/mdns-scanner.service';
import { usePowerManagement } from '../hooks/usePowerManagement';

// Zéro Cloud Logs: Assurez-vous qu'aucun service tiers n'est importé/activé ici pour les PHI.

export const App = () => {
  const powerState = usePowerManagement();
  const [isDbReady, setIsDbReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    // Initialisation parallèle de la DB et de la connexion réseau
    const init = async () => {
      try {
        await initializeDatabase();
        if (isMounted) setIsDbReady(true);
        
        // Démarre la recherche du serveur en arrière-plan
        await MDNSScannerService.bootstrapConnection();
      } catch (err) {
        console.error('Initialisation failed:', err);
      }
    };

    init();
    
    return () => {
      isMounted = false;
    };
  }, []);

  if (!isDbReady) {
    return (
      <View style={[styles.container, styles.centered]}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={{ marginTop: 10 }}>Initialisation de la base de données...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {powerState.isLowPowerMode && (
        <View style={{ backgroundColor: 'red', padding: 10 }}>
          <Text
            style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}
          >
            ⚠️ Mode Survie (Batterie Faible). Sync ={' '}
            {powerState.syncIntervalMs / 1000}s
          </Text>
        </View>
      )}
      <AppNavigator />
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
