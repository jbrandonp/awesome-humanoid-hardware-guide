import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { PatientListScreen } from '../screens/PatientListScreen';
import { VitalSignsScreen } from '../screens/VitalSignsScreen';
import { MedicationAdminScreen } from '../screens/MedicationAdminScreen';
import { SyncScreen } from '../screens/SyncScreen';
import { PatientDetailScreen } from '../screens/PatientDetailScreen';

export type RootStackParamList = {
  PatientList: undefined;
  PatientDetail: { patientId: string };
  VitalSigns: { patientId: string };
  MedicationAdmin: { patientId: string };
  Sync: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="PatientList">
        <Stack.Screen 
          name="PatientList" 
          component={PatientListScreen}
          options={{ title: 'Patients' }}
        />
        <Stack.Screen 
          name="PatientDetail" 
          component={PatientDetailScreen}
          options={{ title: 'Dossier Patient' }}
        />
        <Stack.Screen 
          name="VitalSigns" 
          component={VitalSignsScreen}
          options={{ title: 'Constantes Vitales' }}
        />
        <Stack.Screen 
          name="MedicationAdmin" 
          component={MedicationAdminScreen}
          options={{ title: 'Administration Médicaments' }}
        />
        <Stack.Screen 
          name="Sync" 
          component={SyncScreen}
          options={{ title: 'Synchronisation' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}