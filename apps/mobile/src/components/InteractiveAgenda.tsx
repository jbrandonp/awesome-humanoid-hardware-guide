import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, PanResponder, PanResponderInstance } from 'react-native';

export interface Appointment {
  id: string;
  patientName: string;
  time: string;
  durationMinutes: number;
}

interface InteractiveAgendaProps {
  initialAppointments: Appointment[];
}

export function InteractiveAgenda({ initialAppointments }: InteractiveAgendaProps) {
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);

  // Dans un vrai projet Expo/React Native, on utiliserait `react-native-draggable-flatlist`
  // ou un `PanResponder` complexe pour simuler le glisser-déposer sur le calendrier.
  // Pour ce Sprint 5 (Logistique), nous simulons l'interaction :

  const moveAppointmentToNextSlot = (id: string) => {
     setAppointments(prev => {
        return prev.map(app => {
           if (app.id === id) {
              // Décale d'une heure pour l'exemple (Drag & Drop simulé)
              const newTime = parseInt(app.time.split(':')[0]) + 1;
              return { ...app, time: `${newTime}:00` };
           }
           return app;
        }).sort((a, b) => a.time.localeCompare(b.time));
     });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Agenda Interactif (Drag & Drop)</Text>

      <View style={styles.calendar}>
        {['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00'].map(slot => (
           <View key={slot} style={styles.timeSlot}>
             <Text style={styles.timeLabel}>{slot}</Text>

             {/* Render Appointments in this slot */}
             {appointments.filter(a => a.time === slot).map(app => (
                <TouchableOpacity
                  key={app.id}
                  style={styles.appointmentCard}
                  onLongPress={() => moveAppointmentToNextSlot(app.id)} // Simule le Drag & Drop
                >
                   <Text style={styles.appointmentText}>{app.patientName} ({app.durationMinutes}m)</Text>
                   <Text style={styles.dragHint}>(Appui long pour décaler ⬍)</Text>
                </TouchableOpacity>
             ))}

           </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: '#fff',
    flex: 1
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  calendar: {
    borderLeftWidth: 2,
    borderColor: '#eee',
    paddingLeft: 10
  },
  timeSlot: {
    minHeight: 60,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
    justifyContent: 'flex-start',
    paddingVertical: 10
  },
  timeLabel: {
    fontSize: 14,
    color: '#888',
    fontWeight: 'bold',
    marginBottom: 5
  },
  appointmentCard: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    marginVertical: 2,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
  },
  appointmentText: {
    color: 'white',
    fontWeight: 'bold'
  },
  dragHint: {
     color: 'rgba(255, 255, 255, 0.7)',
     fontSize: 10,
     marginTop: 2
  }
});
