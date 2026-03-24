import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Fuse, { FuseResult } from 'fuse.js';
import { database } from '../database';
import { CatalogMedication, CatalogDiagnostic } from '@systeme-sante/models/src/lib/databaseModels';
import { useDebounce } from '../hooks/useDebounce';
import { ErrorBoundary } from './ErrorBoundary';

// ============================================================================
// TYPAGES STRICTS - ZERO 'ANY' POLICY
// ============================================================================

export type DictItemType = 'medication' | 'icd10';

export interface DictionaryItem {
  id: string;
  type: DictItemType;
  code?: string;
  name: string;
  dosage?: string;
  searchString: string; // optimisé pour fuse.js
}

export function PrescriptionFormInner() {
  const [query, setQuery] = useState('');
  const [dictionary, setDictionary] = useState<DictionaryItem[]>([]);
  const [searchResults, setSearchResults] = useState<DictionaryItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<DictionaryItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const inputRef = useRef<TextInput>(null);

  // 1. DÉBOUNCE STRICT DE 300MS (Anti-saturation thread UI)
  const debouncedQuery = useDebounce(query, 300);

  // 2. CHARGEMENT EN MÉMOIRE DU DICTIONNAIRE LOCAL (~10 000 entrées)
  useEffect(() => {
    let isMounted = true;
    const loadDictionary = async () => {
      try {
        const [medications, diagnostics] = await Promise.all([
          database.get<CatalogMedication>('catalog_medications').query().fetch(),
          database.get<CatalogDiagnostic>('catalog_diagnostics').query().fetch()
        ]);

        if (!isMounted) return;

        const combinedDict: DictionaryItem[] = [
          ...medications.map(m => ({
            id: m.id,
            type: 'medication' as DictItemType,
            name: m.name,
            dosage: m.defaultDosage || undefined,
            searchString: m.name
          })),
          ...diagnostics.map(d => ({
            id: d.id,
            type: 'icd10' as DictItemType,
            code: d.code,
            name: d.name,
            searchString: `${d.code} ${d.name}`
          }))
        ];

        setDictionary(combinedDict);
        setIsLoading(false);
      } catch (e) {
        console.error('[PrescriptionForm] Erreur lors du chargement du dictionnaire', e);
        if (isMounted) setIsLoading(false);
      }
    };

    loadDictionary();
    return () => { isMounted = false; };
  }, []);

  // 3. INSTANCIATION DE FUSE.JS AVEC MISE EN CACHE (useMemo)
  const fuse = useMemo(() => {
    return new Fuse(dictionary, {
      keys: ['searchString'],
      threshold: 0.3, // Fuzzy search tolerance
      includeScore: true,
    });
  }, [dictionary]);

  // 4. RECHERCHE FUZZY SEARCH (Appelée uniquement si le dictionnaire est chargé et le query est debouncé)
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setSearchResults([]);
      setSelectedIndex(0);
      return;
    }

    // Fuse.js search
    const results: FuseResult<DictionaryItem>[] = fuse.search(debouncedQuery, { limit: 10 });

    setSearchResults(results.map(r => r.item));
    setSelectedIndex(0); // Reset l'index de navigation au clavier
  }, [debouncedQuery, fuse]);

  // 5. CACHING DES HANDLERS (useCallback) POUR ÉVITER LES RE-RENDUS INUTILES
  const handleSelectItem = useCallback((item: DictionaryItem) => {
    setSelectedItems(prev => {
      if (prev.find(i => i.id === item.id)) return prev;
      return [...prev, item];
    });
    setQuery('');
    setSearchResults([]);
    setSelectedIndex(0);
    // Focus automatically back to the input for chaining
    // inputRef.current?.focus();
  }, []);

  const handleRemoveItem = useCallback((id: string) => {
    setSelectedItems(prev => prev.filter(i => i.id !== id));
  }, []);

  // 6. NAVIGATION 100% CLAVIER (Tab, Flèches, Entrée)
  // Attention: sur React Native Web, e.nativeEvent.key fonctionne.
  const handleKeyPress = useCallback((e: any) => { // Using React Native's NativeSyntheticEvent lacks standard web DOM key properties, so typing is a bit loose
    const key = e.nativeEvent?.key;
    if (!key) return;

    if (key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < searchResults.length - 1 ? prev + 1 : prev));
    } else if (key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (key === 'Enter' || key === 'Tab') {
      e.preventDefault();
      if (searchResults.length > 0 && selectedIndex >= 0 && selectedIndex < searchResults.length) {
        handleSelectItem(searchResults[selectedIndex]);
      }
    } else if (key === 'Escape') {
      setSearchResults([]);
      setSelectedIndex(0);
    }
  }, [searchResults, selectedIndex, handleSelectItem]);


  // 7. MISE EN CACHE DU RENDU DES RÉSULTATS (useMemo)
  const memoizedResults = useMemo(() => {
    if (searchResults.length === 0) return null;

    return (
      <View style={styles.resultsContainer}>
        {searchResults.map((item, index) => {
          const isSelected = index === selectedIndex;
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.resultItem, isSelected && styles.resultItemSelected]}
              onPress={() => handleSelectItem(item)}
            >
              <Text style={[styles.resultText, isSelected && styles.resultTextSelected]}>
                {item.type === 'icd10' ? `[${item.code}] ` : '💊 '}
                {item.name}
              </Text>
              {item.dosage && <Text style={styles.resultSubText}>{item.dosage}</Text>}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }, [searchResults, selectedIndex, handleSelectItem]);

  const memoizedSelectedItems = useMemo(() => {
    return selectedItems.map(item => (
      <View key={item.id} style={styles.selectedItem}>
        <Text style={styles.selectedItemText}>
          {item.type === 'icd10' ? `📋 [${item.code}] ${item.name}` : `💊 ${item.name}`}
        </Text>
        <TouchableOpacity onPress={() => handleRemoveItem(item.id)} style={styles.removeButton}>
          <Text style={styles.removeButtonText}>X</Text>
        </TouchableOpacity>
      </View>
    ));
  }, [selectedItems, handleRemoveItem]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Prescription Rapide (Mode Clavier)</Text>
      {isLoading ? (
        <Text style={styles.loadingText}>Chargement du dictionnaire médical en mémoire...</Text>
      ) : (
        <>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Rechercher (ex: Paracétamol, A00)..."
            value={query}
            onChangeText={setQuery}
            onKeyPress={handleKeyPress}
            autoCapitalize="none"
            autoFocus={true} // Focus automatique pour démarrer la saisie immédiatement
          />

          {memoizedResults}

          <View style={styles.cartContainer}>
            <Text style={styles.cartTitle}>Ordonnance ({selectedItems.length} élément{selectedItems.length !== 1 ? 's' : ''}) :</Text>
            {selectedItems.length === 0 ? (
              <Text style={styles.emptyCart}>Aucun élément sélectionné.</Text>
            ) : (
              memoizedSelectedItems
            )}
          </View>
        </>
      )}
    </View>
  );
}

export function PrescriptionForm() {
  return (
    <ErrorBoundary>
      <PrescriptionFormInner />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, flex: 1, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, color: '#1e293b' },
  loadingText: { fontStyle: 'italic', color: '#64748b' },
  input: {
    height: 50,
    borderColor: '#cbd5e1',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#f8fafc'
  },
  resultsContainer: {
    marginTop: 8,
    maxHeight: 250,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  resultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  resultItemSelected: {
    backgroundColor: '#eff6ff', // Highlight for keyboard navigation
  },
  resultText: { fontSize: 16, color: '#334155' },
  resultTextSelected: {
    fontWeight: 'bold',
    color: '#1d4ed8',
  },
  resultSubText: { fontSize: 12, color: '#94a3b8' },
  cartContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 8
  },
  cartTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 12, color: '#0f172a' },
  emptyCart: { fontStyle: 'italic', color: '#64748b' },
  selectedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  selectedItemText: { fontSize: 15, color: '#334155', flex: 1 },
  removeButton: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    marginLeft: 8,
  },
  removeButtonText: { color: '#ef4444', fontWeight: 'bold' }
});
