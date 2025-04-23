import { useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useControls, button } from "leva";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useChat } from "../hooks/useChat";
import visemeBlendshapes from "../data/visemeBlendshapes.json";
import { expressions } from "../data/expressions"; // Importer les expressions
import config from "../data/config.json"; // Importer le fichier de configuration

const corresponding = {
  A: "viseme_aa",
  B: "viseme_PP",
  C: "viseme_O",
  D: "viseme_I",
  E: "viseme_E",
  F: "viseme_U",
  G: "viseme_kk",
  H: "viseme_TH",
  X: "viseme_sil",
  rest: "viseme_sil",
};

let setupMode = false;

export function Avatar(props) {
  const group = useRef();
  const leftEyeRef = useRef();
  const rightEyeRef = useRef();
  const { camera } = useThree();
  const { message, onMessagePlayed, chat } = useChat();

  const [audio, setAudio] = useState();
  const [lipsync, setLipsync] = useState();
  const [blink, setBlink] = useState(false);
  const [cheekSquint, setCheekSquint] = useState(false);
  const [prevMorphs, setPrevMorphs] = useState({});
  const [activeExpression, setActiveExpression] = useState("smile");
  const [currentExpression, setCurrentExpression] = useState("smile");
  const [expressionTimer, setExpressionTimer] = useState(null);
  const [smoothedVisemes, setSmoothedVisemes] = useState({}); // Stocke les valeurs lissées des visèmes
  const [mouthSmileValue, setMouthSmileValue] = useState(0.1); // Valeur animée pour mouthSmile
  const [mouthPuckerValue, setMouthPuckerValue] = useState(0.3); // Valeur animée pour mouthPucker
  const [mouthStretchLeftValue, setMouthStretchLeftValue] = useState(0); // Valeur animée pour mouthStretchLeft
  const [mouthStretchRightValue, setMouthStretchRightValue] = useState(0); // Valeur animée pour mouthStretchRight
  const [eyeTarget, setEyeTarget] = useState({ x: 0, y: 0, z: 1 }); // État pour la direction des yeux

  const { nodes, materials, scene } = useGLTF(config.modelPath); // Charger le modèle depuis la configuration
  const idleAnim = useGLTF(config.animationPath); // Charger l'animation depuis la configuration
  const animationMixer = useRef(new THREE.AnimationMixer());

  const levaExpression = useControls("Expression (Live)", {
    ...Object.fromEntries(
      Object.keys({
        browOuterUpLeft: 0,
        browOuterUpRight: 0,
        browInnerUp: 0,
        browOuterUpLeft: 0,
        browOuterUpRight: 0,
        cheekPuff: 0,
        cheekSquintLeft: 0,
        cheekSquintRight: 0,
        eyeBlinkLeft: 0, // Contrôle pour clignement de l'œil gauche
        eyeBlinkRight: 0, // Contrôle pour clignement de l'œil droit
        eyeLookDownLeft: 0,
        eyeLookDownRight: 0,
        eyeLookInLeft: 0,
        eyeLookInRight: 0,
        eyeLookOutLeft: 0,
        eyeLookOutRight: 0,
        eyeLookUpLeft: 0,
        eyeLookUpRight: 0,
        jawForward: 0,
        jawLeft: 0,
        jawOpen: 0,
        jawRight: 0,
        mouthClose: 0,
        mouthDimpleLeft: 0,
        mouthDimpleRight: 0,
        mouthFrownLeft: 0,
        mouthFrownRight: 0,
        mouthFunnel: 0,
        mouthLeft: 0,
        mouthLowerDownLeft: 0,
        mouthLowerDownRight: 0,
        mouthPressLeft: 0,
        mouthPressRight: 0,
        mouthPucker: 0,
        mouthRight: 0,
        mouthRollLower: 0,
        mouthRollUpper: 0,
        mouthShrugLower: 0,
        mouthShrugUpper: 0,
        mouthSmileLeft: 0,
        mouthSmileRight: 0,
        mouthStretchLeft: 0,
        mouthStretchRight: 0,
        mouthUpperUpLeft: 0,
        mouthUpperUpRight: 0,
        noseSneerLeft: 0,
        noseSneerRight: 0,
      }).map((key) => [
        key,
        { value: 0, min: 0, max: 1, step: 0.01, onChange: (value) => {
          if (setupMode) {
            lerpMorphTarget(key, value, 1);
          }
        }},
      ])
    ),
    Expression_Smile: button(() => setActiveExpression("smile")),
    Expression_Default: button(() => setActiveExpression("default")),
    Log_Expression: button(() => {
      const currentValues = {};
      Object.keys(levaExpression).forEach((key) => {
        currentValues[key] = levaExpression[key];
      });
      console.log("Current Expression Values:", JSON.stringify(currentValues, null, 2));
    }),
    SetupMode_ON: button(() => {
      setupMode = true;
    }),
    SetupMode_OFF: button(() => {
      setupMode = false;
    }),
    Chat: button(() => chat()),
  });

  const levaEyeControls = useControls("Eye Orientation", {
    EyeTargetX: { value: 0, min: -1, max: 1, step: 0.01, onChange: (value) => setEyeTarget((prev) => ({ ...prev, x: value })) },
    EyeTargetY: { value: 0, min: -1, max: 1, step: 0.01, onChange: (value) => setEyeTarget((prev) => ({ ...prev, y: value })) },
    EyeTargetZ: { value: 1, min: 0, max: 2, step: 0.01, onChange: (value) => setEyeTarget((prev) => ({ ...prev, z: value })) },
  });

  useEffect(() => {
    const clip = idleAnim.animations[0];
    const cleanTracks = clip.tracks.filter((t) => !t.name.includes("morphTargetInfluences"));
    const action = animationMixer.current.clipAction(
      new THREE.AnimationClip(clip.name, clip.duration, cleanTracks),
      group.current
    );
    action.reset().fadeIn(0.5).play();
    return () => action.fadeOut(0.5);
  }, []);

  useEffect(() => {
    if (!message) return;
    setLipsync(message.lipsync);
    setActiveExpression(message.facialExpression || "smile");

    const audio = new Audio("data:audio/mp3;base64," + message.audio);
    audio.play();
    setAudio(audio);
    audio.onended = () => onMessagePlayed();
  }, [message]);

  useEffect(() => {
    let timeout;
    const loop = () => {
      timeout = setTimeout(() => {
        setBlink(true); // Active le clignement
        setTimeout(() => {
          setBlink(false); // Désactive le clignement après 150ms
          loop(); // Relance la boucle
        }, 150); // Durée du clignement
      }, THREE.MathUtils.randInt(1500, 3000)); // Intervalle aléatoire entre les clignements
    };
    loop();
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    let timeout;
    const loop = () => {
      timeout = setTimeout(() => {
        lerpMorphTarget("browOuterUpRight", 1.5, 0); // Active browOuterUpRight avec amplitude accrue
        setTimeout(() => {
          lerpMorphTarget("browOuterUpRight", 0, 0); // Désactive après 300ms
          loop(); // Relance la boucle
        }, 600); // Durée du clignement
      }, THREE.MathUtils.randInt(2500, 5000)); // Intervalle aléatoire entre les clignements
    };
    loop();
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    // Initialiser les morph targets pour ouvrir les yeux et désactiver les joues au chargement
    lerpMorphTarget("eyeBlinkLeft", 0, 1); // Ouvre l'œil gauche
    lerpMorphTarget("eyeBlinkRight", 0, 1); // Ouvre l'œil droit
    lerpMorphTarget("cheekSquintLeft", 0, 1); // Désactive la joue gauche
    lerpMorphTarget("cheekSquintRight", 0, 1); // Désactive la joue droite
  }, []);

  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh && child.material) {
        // Ajuster le matériau de la langue
        if (child.name.toLowerCase().includes("tongue")) {
          child.material.roughness = 0.8;
          child.material.metalness = 0;
          child.material.envMapIntensity = 0;
          console.log(`Adjusted material for: ${child.name}`); // Log pour confirmer l'ajustement
        }

        // Ajuster le matériau de la lèvre inférieure
        if (child.name.toLowerCase().includes("lowerlip") || child.name.toLowerCase().includes("lip_lower")) {
          child.material.roughness = 1.0; // Augmenter la rugosité pour éliminer la réflexion
          child.material.metalness = 0; // Supprimer les reflets métalliques
          child.material.envMapIntensity = 0; // Désactiver l'intensité de l'environnement
          console.log(`Adjusted material for: ${child.name}`); // Log pour confirmer l'ajustement
        }
      }
    });
  }, [scene]);

  const lerpMorphTarget = (target, value, speed = 0.1) => {
    let found = false; // Vérifie si le morph target est trouvé
    scene.traverse((child) => {
      if (child.isSkinnedMesh && child.morphTargetDictionary) {
        const index = child.morphTargetDictionary[target];
        if (index !== undefined && child.morphTargetInfluences[index] !== undefined) {
          found = true;
          const current = child.morphTargetInfluences[index];
          const next = THREE.MathUtils.lerp(current, value, speed);
          child.morphTargetInfluences[index] = Math.abs(next - value) < 0.01 ? value : next;
          console.log(
            `Morph target: ${target}, Current: ${current}, Next: ${next}, Final: ${child.morphTargetInfluences[index]}`
          ); // Debug log
        }
      }
    });
    if (!found) {
      console.warn(`Morph target "${target}" not found in model.`); // Log si le morph target n'est pas trouvé
    }
  };

  const handleVisemeAnimation = (viseme, intensity) => {
    const blendshapes = visemeBlendshapes[viseme] || {};
    Object.entries(blendshapes).forEach(([blendshape, baseValue]) => {
      const value = baseValue * intensity;
      lerpMorphTarget(blendshape, value, 0.1);
    });

    // Reset unused blendshapes
    Object.keys(visemeBlendshapes).forEach((key) => {
      if (key !== viseme) {
        const unusedBlendshapes = visemeBlendshapes[key];
        Object.keys(unusedBlendshapes).forEach((blendshape) => {
          if (!blendshapes[blendshape]) {
            lerpMorphTarget(blendshape, 0, 0.1);
          }
        });
      }
    });
  };

  const switchExpression = () => {
    const expressionKeys = Object.keys(expressions);
    const randomExpression = expressionKeys[Math.floor(Math.random() * expressionKeys.length)];
    console.log(`Switching to random expression: ${randomExpression}`); // Debug log
    setCurrentExpression(randomExpression);
  };

  useEffect(() => {
    // Alterner entre les expressions de manière plus rapide (toutes les 0.5 seconde)
    const timer = setInterval(() => {
      const expressionKeys = Object.keys(expressions);
      const randomExpression = expressionKeys[Math.floor(Math.random() * expressionKeys.length)];
      console.log(`Switching to random expression: ${randomExpression}`); // Debug log
      setCurrentExpression(randomExpression);
    }, 800); // Réduction de l'intervalle à 0.5 seconde
    setExpressionTimer(timer);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Animation automatique pour mouthSmile entre 0.1 et 0.6
    let increasing = true;
    const animateMouthSmile = () => {
      setMouthSmileValue((prev) => {
        if (increasing && prev >= 0.6) increasing = false;
        if (!increasing && prev <= 0.1) increasing = true;
        return increasing ? prev + 0.05 : prev - 0.05; // Incrémentation/décrémentation
      });
    };
    const interval = setInterval(animateMouthSmile, 100); // Mise à jour toutes les 100ms
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Animation automatique pour mouthPucker entre 0.3 et 0.6
    let increasing = true;
    const animateMouthPucker = () => {
      setMouthPuckerValue((prev) => {
        if (increasing && prev >= 0.6) increasing = false;
        if (!increasing && prev <= 0.3) increasing = true;
        return increasing ? prev + 0.03 : prev - 0.03; // Incrémentation/décrémentation
      });
    };
    const interval = setInterval(animateMouthPucker, 100); // Mise à jour toutes les 100ms
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Animation automatique pour mouthStretchLeft entre 0 et 0.18
    let increasingLeft = true;
    const animateMouthStretchLeft = () => {
      setMouthStretchLeftValue((prev) => {
        if (increasingLeft && prev >= 0.18) increasingLeft = false;
        if (!increasingLeft && prev <= 0) increasingLeft = true;
        return increasingLeft ? prev + 0.01 : prev - 0.01; // Incrémentation/décrémentation
      });
    };
    const intervalLeft = setInterval(animateMouthStretchLeft, 100); // Mise à jour toutes les 100ms
    return () => clearInterval(intervalLeft);
  }, []);

  useEffect(() => {
    // Animation automatique pour mouthStretchRight entre 0 et 0.18
    let increasingRight = true;
    const animateMouthStretchRight = () => {
      setMouthStretchRightValue((prev) => {
        if (increasingRight && prev >= 0.18) increasingRight = false;
        if (!increasingRight && prev <= 0) increasingRight = true;
        return increasingRight ? prev + 0.01 : prev - 0.01; // Incrémentation/décrémentation
      });
    };
    const intervalRight = setInterval(animateMouthStretchRight, 100); // Mise à jour toutes les 100ms
    return () => clearInterval(intervalRight);
  }, []);

  useFrame((_, delta) => {
    animationMixer.current.update(delta);

    if (!audio || !lipsync || setupMode) return;

    let activeViseme = "rest";
    let intensity = 0;
    const now = audio.currentTime;

    // Identifier le visème actif
    for (const cue of lipsync.mouthCues) {
      if (now >= cue.start && now <= cue.end) {
        activeViseme = cue.value;
        const progress = (now - cue.start) / (cue.end - cue.start);
        intensity = 0.5 - 0.5 * Math.cos(Math.PI * progress); // Cosine ease-in-out pour une transition fluide
        break;
      }
    }

    // Appliquer les animations en fonction du visème actif
    Object.values(corresponding).forEach((morph) => {
      const target = corresponding[activeViseme] === morph ? intensity : 0;
      const boosted = ["viseme_aa", "viseme_O", "viseme_U", "viseme_E", "viseme_I"].includes(morph)
        ? target * 2.0
        : target;

      lerpMorphTarget(morph, boosted, 0.12);
    });

    // Lissage supplémentaire pour l'ouverture de la mâchoireé
    const jawOpenTarget = ["viseme_aa", "viseme_O", "viseme_U", "viseme_E"].includes(corresponding[activeViseme])
      ? THREE.MathUtils.clamp(intensity * 2.2, 0, 1)
      : 0;

    const smoothedJawOpen = THREE.MathUtils.lerp(prevMorphs.jawOpen || 0, jawOpenTarget, 0.07);
    lerpMorphTarget("jawOpen", smoothedJawOpen, 0.07);

    // Mettre à jour les valeurs précédentes
    setPrevMorphs((prev) => ({ ...prev, jawOpen: smoothedJawOpen }));

    // Appliquer l'expression faciale actuelle
    const expression = expressions[currentExpression] || {};
    Object.entries(expression).forEach(([key, value]) => {
      lerpMorphTarget(key, value, 0.1); // Appliquer les blendshapes des yeux et autres
    });

    // Clignement des yeux
    lerpMorphTarget("eyeBlinkLeft", blink ? 1 : 0, 0.15);
    lerpMorphTarget("eyeBlinkRight", blink ? 1 : 0, 0.15);
  });

  useFrame(() => {
    if (leftEyeRef.current && rightEyeRef.current) {
      const expression = expressions[currentExpression] || {};

      // Générer des valeurs aléatoires dans les plages définies pour les yeux
      const eyeTargetX = THREE.MathUtils.randFloat(expression.eyeTargetX?.min || 0, expression.eyeTargetX?.max || 0);
      const eyeTargetY = THREE.MathUtils.randFloat(expression.eyeTargetY?.min || 0, expression.eyeTargetY?.max || 0);
      const eyeTargetZ = THREE.MathUtils.randFloat(expression.eyeTargetZ?.min || 1, expression.eyeTargetZ?.max || 1);

      // Calculer la position cible des yeux
      const targetPosition = new THREE.Vector3(eyeTargetX, eyeTargetY, eyeTargetZ).add(camera.position);

      // Appliquer la position cible aux yeux
      leftEyeRef.current.lookAt(targetPosition); // Oriente l'œil gauche
      rightEyeRef.current.lookAt(targetPosition); // Oriente l'œil droit
    }
  });

  return (
    <group
      ref={group}
      {...props}
      scale={[1.55, 1.6, 1.6]}//echelle de l'avatar 
      position={[0, -1, 0.5]}//poosition de l'avatar 
      rotation={[0, 0.5, 0]}//rotation de l'avatar 
    >
      <primitive object={nodes.Hips} />
      {Object.entries(nodes).map(([key, node]) => {
        if (node.type === "SkinnedMesh" && node.geometry && node.skeleton && node.material) {
          return (
            <skinnedMesh
              key={key}
              geometry={node.geometry}
              material={node.material}
              skeleton={node.skeleton}
              morphTargetDictionary={node.morphTargetDictionary}
              morphTargetInfluences={node.morphTargetInfluences}
              ref={
                key.includes("Left") ? leftEyeRef : key.includes("Right") ? rightEyeRef : null
              }
            />
          );
        }
        return null;
      })}
    </group>
  );
}

useGLTF.preload(config.modelPath);
useGLTF.preload(config.animationPath);
