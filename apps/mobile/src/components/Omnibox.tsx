import React, { useState, useMemo } from 'react';
import { View, TextInput, FlatList, Text, TouchableOpacity, StyleSheet, Modal, Button } from 'react-native';
import Fuse from 'fuse.js';
import { DrugInteractionChecker } from '../services/drug-interaction.service';

// --- Mocks pour la Base de Données ---
// Ces données seraient idéalement tirées d'un @nozbe/watermelondb Collection via withObservables
const MEDICAL_DATABASE = [
  { id: '1', type: 'icd10', code: 'B50.9', name: 'Paludisme à Plasmodium falciparum, sans complication' },
  { id: '2', type: 'icd10', code: 'J01.9', name: 'Sinusite aiguë, sans précision' },
  { id: '3', type: 'medication', name: 'Artemether 20mg / Lumefantrine 120mg', dosage: '1 cp matin et soir pendant 3 jours' },
  { id: '4', type: 'medication', name: 'Paracétamol 1000mg', dosage: '1 cp toutes les 6h si fièvre > 38.5°C' },
  { id: '5', type: 'medication', name: 'Amoxicilline 1g', dosage: '1 cp matin, midi et soir pendant 7 jours' },
  { id: '6', type: 'lab', code: 'HGB', name: 'Hémoglobine' },
  { id: '7', type: 'lab', code: 'GLU', name: 'Glycémie à jeun' },
];

const QUICK_PROTOCOLS = {
  'PALUDISME': [
    { type: 'icd10', id: '1' },
    { type: 'medication', id: '3' },
    { type: 'medication', id: '4' },
  ]
};

export function Omnibox() {
  const [query, setQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  // Configuration Fuse.js pour la recherche floue
  const fuse = useMemo(() => new Fuse(MEDICAL_DATABASE, {
    keys: ['name', 'code', 'dosage'],
    threshold: 0.3, // Très permissif pour les erreurs de frappe (ex: Parasetamol -> Paracétamol)
  }), []);

  const searchResults = query ? fuse.search(query).map(result => result.item) : [];

  const handleSelectItem = (item: any) => {
    if (!selectedItems.find(i => i.id === item.id)) {
      if (item.type === 'medication') {
        const currentMeds = selectedItems.filter(i => i.type === 'medication').map(i => i.name);
        const interactions = DrugInteractionChecker.checkInteractions(item.name, currentMeds);

        if (interactions.length > 0) {
          showCustomAlert(`⚠️ AVERTISSEMENT INTERACTION !\n\n${item.name} interagit avec : ${interactions.map(i => i.interactingDrug).join(', ')}.\n\nDétail : ${interactions[0].description}`);
        }
      }
      setSelectedItems([...selectedItems, item]);
    }
    setQuery('');
  };

  const handleQuickProtocol = (protocolName: string) => {
    const protocolItems = QUICK_PROTOCOLS[protocolName as keyof typeof QUICK_PROTOCOLS];
    if (protocolItems) {
      const itemsToAdd = protocolItems.map(p => MEDICAL_DATABASE.find(m => m.id === p.id)).filter(Boolean);
      setSelectedItems(prev => {
         const newItems = [...prev];
         itemsToAdd.forEach(item => {
           if (!newItems.find(i => i.id === item?.id)) {
             newItems.push(item);
           }
         });
         return newItems;
      });
      showCustomAlert(`Protocole ${protocolName} appliqué avec succès.`);
    }
  };

  // Règle IA : Ne jamais utiliser alert(), utilise un composant Modal personnalisé.
  const showCustomAlert = (message: string) => {
    setAlertMessage(message);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Prescription Omnibox</Text>

      {/* Raccourcis Rapides */}
      <View style={styles.protocolsContainer}>
        <TouchableOpacity style={styles.protocolButton} onPress={() => handleQuickProtocol('PALUDISME')}>
          <Text style={styles.protocolText}>⚡ Protocole Paludisme</Text>
        </TouchableOpacity>
      </View>

      {/* Barre de recherche */}
      <TextInput
        style={styles.input}
        placeholder="Rechercher Médicament, Diagnostic ICD-10, Labo..."
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
      />

      {/* Résultats de recherche Fuse.js */}
      {query.length > 0 && (
        <FlatList
          data={searchResults}
          keyExtractor={item => item.id}
          style={styles.resultsList}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.resultItem} onPress={() => handleSelectItem(item)}>
              <Text style={styles.resultItemText}>
                {item.type === 'icd10' ? `[${item.code}] ` : item.type === 'lab' ? '🔬 ' : '💊 '}
                {item.name}
              </Text>
              {item.dosage && <Text style={styles.resultItemSubText}>{item.dosage}</Text>}
            </TouchableOpacity>
          )}
        />
      )}

      {/* Panier des éléments sélectionnés */}
      <View style={styles.cartContainer}>
        <Text style={styles.cartTitle}>Ordonnance en cours :</Text>
        {selectedItems.map((item, index) => (
          <View key={index} style={styles.cartItem}>
             <Text>{item.type === 'icd10' ? `📋 Diagnostic : [${item.code}] ${item.name}` : item.type === 'lab' ? `🔬 Examen : ${item.name}` : `💊 Médicament : ${item.name}`}</Text>
          </View>
        ))}
      </View>

      {/* Custom Alert Modal */}
      <Modal visible={modalVisible} transparent={true} animationType="fade">
         <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
               <Text style={styles.modalText}>{alertMessage}</Text>
               <Button title="OK" onPress={() => setModalVisible(false)} />
            </View>
         </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    marginBottom: 10,
  },
  protocolsContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  protocolButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 20,
  },
  protocolText: {
    color: 'white',
    fontWeight: 'bold',
  },
  resultsList: {
    maxHeight: 200,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  resultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  resultItemText: {
    fontSize: 16,
  },
  resultItemSubText: {
    fontSize: 12,
    color: '#666',
  },
  cartContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#eef',
    borderRadius: 8,
  },
  cartTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
  },
  cartItem: {
    paddingVertical: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    minWidth: 300,
    alignItems: 'center',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
  }
});
