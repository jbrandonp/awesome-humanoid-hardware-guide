import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, Modal, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';

interface DualSignOffModalProps {
  visible: boolean;
  medicationName: string;
  dosage: string;
  onCancel: () => void;
  onSubmit: (pin: string) => Promise<void>;
}

export const DualSignOffModal: React.FC<DualSignOffModalProps> = ({
  visible,
  medicationName,
  dosage,
  onCancel,
  onSubmit,
}) => {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (pin.length < 4) {
      console.warn('PIN must be at least 4 digits long');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(pin);
      setPin('');
    } catch (error) {
      console.warn('Dual sign-off failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  }, [pin, onSubmit]);

  const handleCancel = useCallback(() => {
    setPin('');
    onCancel();
  }, [onCancel]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleCancel}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>High Alert Medication</Text>
          <Text style={styles.subtitle}>Dual Sign-off Required</Text>
          <Text style={styles.details}>
            {medicationName} - {dosage}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter Secondary Nurse PIN"
            secureTextEntry
            keyboardType="number-pad"
            value={pin}
            onChangeText={setPin}
            editable={!loading}
            maxLength={8}
            autoFocus
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.buttonCancel} onPress={handleCancel} disabled={loading}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.buttonSubmit} onPress={handleSubmit} disabled={loading || pin.length < 4}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Authorize</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 24,
    width: '80%',
    maxWidth: 400,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  details: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    letterSpacing: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  buttonCancel: {
    flex: 1,
    backgroundColor: '#757575',
    padding: 12,
    borderRadius: 4,
    marginRight: 8,
    alignItems: 'center',
  },
  buttonSubmit: {
    flex: 1,
    backgroundColor: '#1976d2',
    padding: 12,
    borderRadius: 4,
    marginLeft: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
