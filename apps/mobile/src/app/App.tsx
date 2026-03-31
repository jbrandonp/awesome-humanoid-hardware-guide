/* eslint-disable jsx-a11y/accessible-emoji */
import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  StatusBar,
} from 'react-native';
import { Omnibox } from '../components/Omnibox';
import { usePowerManagement } from '../hooks/usePowerManagement';

// Zéro Cloud Logs: Assurez-vous qu'aucun service tiers n'est importé/activé ici pour les PHI.

export const App = () => {
  const powerState = usePowerManagement();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {powerState.isLowPowerMode && (
         <View style={{ backgroundColor: 'red', padding: 10, marginTop: 40 }}>
            <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
               ⚠️ Mode Survie (Batterie Faible). Sync = {powerState.syncIntervalMs / 1000}s
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
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});

export default App;
