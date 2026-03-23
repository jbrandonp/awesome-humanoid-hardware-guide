import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, Button } from 'react-native';
import Svg, { Path } from 'react-native-svg';
// import { WondrxSDK } from 'react-native-wondrx'; // SDK Fictif / Théorique

export interface InkCoordinate {
  x: number;
  y: number;
  pressure: number;
  timestamp: number;
}

export function SmartPenCanvas() {
  const [inkPaths, setInkPaths] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState<string>("");
  const [isConnected, setIsConnected] = useState(false);

  // Simulation d'écoute du flux Bluetooth du Stylo Connecté (WONDRx)
  useEffect(() => {
    let interval: any;

    if (isConnected) {
      // Le SDK officiel (WondrxSDK.addListener('onInkReceived', (coords) => {...}))
      // enverrait des points X, Y. Ici, on simule l'écriture d'un médecin.

      let simulatedX = 50;
      let simulatedY = 50;

      interval = setInterval(() => {
        simulatedX += Math.random() * 5;
        simulatedY += (Math.random() - 0.5) * 5;

        setCurrentPath(prev => {
          if (!prev) return `M ${simulatedX} ${simulatedY}`;
          return `${prev} L ${simulatedX} ${simulatedY}`;
        });

        // Fin de la lettre
        if (simulatedX > 250) {
           setInkPaths(prev => [...prev, currentPath]);
           setCurrentPath("");
           simulatedX = 50;
           simulatedY += 30;
        }
      }, 50); // 20 frames per second
    }

    return () => clearInterval(interval);
  }, [isConnected, currentPath]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ordonnance Numérique (Smart Pen)</Text>

      <View style={styles.toolbar}>
         <Text style={{color: isConnected ? 'green' : 'red'}}>
           Stylo: {isConnected ? 'Connecté (Écriture en cours...)' : 'Déconnecté'}
         </Text>
         <Button
           title={isConnected ? "Arrêter la connexion" : "Connecter le stylo WONDRx"}
           onPress={() => setIsConnected(!isConnected)}
         />
      </View>

      <View style={styles.canvasArea}>
         {/* Le SVG reconstruit en temps réel l'écriture manuscrite sur la tablette */}
         <Svg height="300" width="100%">
           {inkPaths.map((path, idx) => (
              <Path key={idx} d={path} fill="none" stroke="black" strokeWidth="2" />
           ))}
           {currentPath ? <Path d={currentPath} fill="none" stroke="blue" strokeWidth="2" /> : null}
         </Svg>
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
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5
  },
  canvasArea: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    backgroundColor: '#fafafa',
    height: 300,
    overflow: 'hidden'
  }
});
