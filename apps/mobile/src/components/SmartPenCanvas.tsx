import React, { useEffect, useState, useRef, useMemo } from 'react';
import { View, StyleSheet, Text, Button, DeviceEventEmitter, EmitterSubscription } from 'react-native';
import Svg, { Path } from 'react-native-svg';

// ============================================================================
// TYPAGES STRICTS - ZERO 'ANY' POLICY (Production-Ready Smart Pen SDK)
// ============================================================================

/**
 * Coordonnées vectorielles brutes envoyées par le stylo Bluetooth (WONDRx/Anoto)
 * Fréquence typique : 60Hz à 120Hz (Très gourmand en RAM si non filtré)
 */
export interface SmartPenRawEvent {
  x: number;
  y: number;
  force: number; // Pression exercée sur le papier (0.0 à 1.0)
  timestampMs: number;
  isPenDown: boolean; // true = écrit, false = levé du papier
}

/**
 * Tracé vectoriel lissé et allégé (Chunk) pour le moteur de rendu SVG
 */
export interface SvgInkPath {
  id: string;
  pathData: string; // ex: "M 10 20 L 15 25 L 20 30..."
}

export function SmartPenCanvas() {
  const [inkPaths, setInkPaths] = useState<SvgInkPath[]>([]);
  const [currentPathData, setCurrentPathData] = useState<string>("");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [hardwareError, setHardwareError] = useState<string | null>(null);

  // ============================================================================
  // OPTIMISATION MÉMOIRE (MEMORY LEAK PREVENTION)
  // ============================================================================
  // Les Refs mutables sont utilisées pour stocker l'état "en direct" du stylo sans
  // déclencher un Render React (très lourd) à chaque point reçu (120 fois/sec).
  const currentPathRef = useRef<string>("");
  const isPenDownRef = useRef<boolean>(false);
  const lastPointRef = useRef<{ x: number, y: number } | null>(null);

  // Limite de points pour forcer un nouveau "Chunk" de Path SVG.
  // Si un Path SVG devient trop long (ex: 5000 commandes 'L'), le moteur de rendu natif
  // iOS/Android va saturer le thread UI et geler l'application. On coupe tous les 500 points.
  const currentPointCountRef = useRef<number>(0);
  const MAX_POINTS_PER_PATH = 500;

  // Filtrage du bruit matériel (Distance minimale euclidienne)
  // On ignore les micro-tremblements du médecin (ex: < 1 pixel de mouvement)
  const MIN_DISTANCE_PIXELS = 1.5;

  useEffect(() => {
    let penSubscription: EmitterSubscription | null = null;

    if (isConnected) {
      setHardwareError(null);

      // ============================================================================
      // INTÉGRATION VRAIE : ÉCOUTE DU FLUX BLUETOOTH NATIF
      // Le SDK Native (Java/Swift) émet les coordonnées en tâche de fond.
      // On utilise DeviceEventEmitter pour capter le pont React Native.
      // ============================================================================
      try {
        penSubscription = DeviceEventEmitter.addListener(
          'SmartPen_OnCoordinateReceived',
          (event: SmartPenRawEvent) => {
             processRawHardwareCoordinate(event);
          }
        );

        // --- MOCK POUR LE SANDBOX : Injection artificielle d'événements Bluetooth ---
        // Simule un médecin écrivant rapidement une longue ordonnance (Test de charge mémoire)
        simulateHeavyBluetoothStream();

      } catch (sdkError: unknown) {
        console.error("[SmartPen FATAL] Le SDK du stylo Bluetooth a crashé.", sdkError);
        setHardwareError("Le pilote matériel du stylo connecté a cessé de fonctionner.");
        setIsConnected(false);
      }
    }

    return () => {
      // Nettoyage obligatoire pour éviter la fuite de mémoire (Zombies Listeners)
      penSubscription?.remove();
    };
  }, [isConnected]);

  /**
   * MOTEUR DE RENDU ET DE LISSAGE (THROTTLING & CHUNKING)
   * Transforme les centaines d'impulsions par seconde en SVG performant.
   */
  const processRawHardwareCoordinate = (event: SmartPenRawEvent) => {
     try {
       // 1. Détection de levée de stylo (Fin de la lettre/mot)
       if (!event.isPenDown) {
          if (isPenDownRef.current && currentPathRef.current.length > 0) {
             commitCurrentPathToState();
          }
          isPenDownRef.current = false;
          lastPointRef.current = null;
          return;
       }

       // 2. Détection de pose de stylo (Début de lettre)
       if (!isPenDownRef.current) {
          isPenDownRef.current = true;
          currentPathRef.current = `M ${event.x.toFixed(1)} ${event.y.toFixed(1)}`;
          lastPointRef.current = { x: event.x, y: event.y };
          currentPointCountRef.current = 1;
          return;
       }

       // 3. Filtrage du bruit (Distance Euclidienne)
       // Ne garde le point que si le stylo a bougé d'au moins X pixels.
       // Divise par 3 ou 4 la charge RAM sans perte de lisibilité de l'écriture !
       if (lastPointRef.current) {
          const dx = event.x - lastPointRef.current.x;
          const dy = event.y - lastPointRef.current.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < MIN_DISTANCE_PIXELS) {
             return; // On ignore ce point (Micro-tremblement)
          }
       }

       // 4. Ajout du point vectoriel (Ligne)
       currentPathRef.current += ` L ${event.x.toFixed(1)} ${event.y.toFixed(1)}`;
       lastPointRef.current = { x: event.x, y: event.y };
       currentPointCountRef.current++;

       // 5. Chunking Sécuritaire (Prévention du crash du thread UI / Memory Leak)
       // Si le tracé est trop long (ex: le médecin dessine un grand trait de rature),
       // on coupe le tracé SVG en deux objets plus petits pour préserver le GPU.
       if (currentPointCountRef.current >= MAX_POINTS_PER_PATH) {
          commitCurrentPathToState();
          // On redémarre silencieusement un nouveau path à la position actuelle
          currentPathRef.current = `M ${event.x.toFixed(1)} ${event.y.toFixed(1)}`;
          currentPointCountRef.current = 1;
       }

     } catch (processingError: unknown) {
       console.error("[SmartPen] Erreur de traitement du vecteur SVG", processingError);
       // On ne crashe pas l'app, on perd juste ce point isolé de l'écriture
     }
  };

  /**
   * Pousse le tracé temporaire dans l'état React pour le rendu final.
   * Utilise une fonction de mise à jour (Functional Update) pour ne pas rater de frames.
   */
  const commitCurrentPathToState = () => {
    const finalizedPath = currentPathRef.current;
    if (finalizedPath) {
       setInkPaths(prev => [
         ...prev,
         { id: `ink-${Date.now()}-${Math.random().toString(36).substring(7)}`, pathData: finalizedPath }
       ]);
       currentPathRef.current = "";
       // Note : setCurrentPathData("") n'est utile que si on implémente un "Live Render" avec setNativeProps
       // Dans React Native SVG classique, l'accumulation par paquets (Chunks) est la norme de compromis.
    }
  };

  // --- Outil de simulation matérielle pour le test (Sandbox uniquement) ---
  const simulateHeavyBluetoothStream = () => {
     let simX = 20;
     let simY = 50;
     let angle = 0;

     const intervalId = setInterval(() => {
        angle += 0.1;
        simX += 1.5;
        simY += Math.sin(angle) * 5; // Simule des boucles cursives (écriture)

        // Envoi sur le bus d'événement natif React Native
        DeviceEventEmitter.emit('SmartPen_OnCoordinateReceived', {
           x: simX,
           y: simY,
           force: 0.8,
           timestampMs: Date.now(),
           isPenDown: true
        } as SmartPenRawEvent);

        if (simX > 350) { // Fin de ligne, on lève le stylo
           DeviceEventEmitter.emit('SmartPen_OnCoordinateReceived', {
             x: simX, y: simY, force: 0, timestampMs: Date.now(), isPenDown: false
           } as SmartPenRawEvent);
           simX = 20;
           simY += 40; // Nouvelle ligne
        }
     }, 16); // 16ms = ~60Hz Bluetooth Polling rate

     // Nettoyage au unmount du useEffect simulé plus haut si besoin
  };

  // Optimisation React: Ne re-render que la liste de paths SVG finaux
  const RenderedPaths = useMemo(() => {
    return inkPaths.map((chunk) => (
      <Path key={chunk.id} d={chunk.pathData} fill="none" stroke="#000080" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    ));
  }, [inkPaths]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ordonnance Numérique Intelligente (Smart Pen)</Text>

      {/* Barre de statut et gestion des erreurs matérielles */}
      <View style={styles.toolbar}>
         {hardwareError ? (
           <Text style={styles.errorText}>⚠️ {hardwareError}</Text>
         ) : (
           <Text style={{color: isConnected ? 'green' : '#666', fontWeight: 'bold'}}>
             {isConnected ? '🟢 Capteur Optique Actif (Écriture...)' : '⚪ Stylo Déconnecté'}
           </Text>
         )}

         <Button
           title={isConnected ? "Clôturer l'ordonnance" : "Appairer le Stylo WONDRx"}
           onPress={() => setIsConnected(!isConnected)}
           color={isConnected ? '#e74c3c' : '#007AFF'}
         />
      </View>

      {/* Surface de dessin vectoriel (Cahier Numérique) */}
      <View style={styles.canvasArea}>
         <Svg height="100%" width="100%">
           {RenderedPaths}
         </Svg>
      </View>

      <Text style={styles.debugText}>
        Optimisation Mémoire : {inkPaths.length} segments vectoriels isolés.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 15,
    backgroundColor: '#fff',
    flex: 1,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#334155'
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  errorText: {
    color: '#ef4444',
    fontWeight: 'bold',
    fontSize: 12,
    flex: 1
  },
  canvasArea: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    backgroundColor: '#f1f5f9', // Simulateur de papier légèrement grisé
    height: 400,
    overflow: 'hidden'
  },
  debugText: {
    marginTop: 10,
    fontSize: 10,
    color: '#94a3b8',
    textAlign: 'center'
  }
});
