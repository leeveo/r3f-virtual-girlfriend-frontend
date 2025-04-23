import { ContactShadows, Environment, Text } from "@react-three/drei";
import { Suspense, useEffect, useRef, useState } from "react";
import { useThree } from "@react-three/fiber";
import { useChat } from "../hooks/useChat";
import { Avatar } from "./Avatar";
import { useControls } from "leva";

const Dots = (props) => {
  const { loading } = useChat();
  const [loadingText, setLoadingText] = useState("");

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoadingText((prev) => (prev.length > 2 ? "." : prev + "."));
      }, 800);
      return () => clearInterval(interval);
    } else {
      setLoadingText("");
    }
  }, [loading]);

  if (!loading) return null;

  return (
    <group {...props}>
      <Text fontSize={0.14} anchorX={"left"} anchorY={"bottom"}>
        {loadingText}
        <meshBasicMaterial attach="material" color="black" />
      </Text>
    </group>
  );
};

export const Experience = () => {
  const { cameraZoomed } = useChat();
  const { camera } = useThree();

  // 🟡 Leva Controls
  const {
    avatarPositionY,
    shadowOpacity,
    environmentPreset
  } = useControls("Scene", {
    avatarPositionY: { value: 0, min: -2, max: 2, step: 0.01 },
    shadowOpacity: { value: 0.7, min: 0, max: 1, step: 0.05 },
    environmentPreset: {
      options: ["sunset", "dawn", "night", "warehouse", "forest", "apartment", "studio", "city", "park", "lobby"],
      value: "studio" // Changer la valeur par défaut à "studio"
    }
  });

  useEffect(() => {
    camera.position.set(0, 1.75, 1.9);
    camera.lookAt(0, 1.75, 0);
  }, [cameraZoomed, camera]);

  return (
    <>
      <Environment preset={environmentPreset} />
      <Suspense>
        <Dots position-y={1.75} position-x={-0.02} />
      </Suspense>
      <group position-y={avatarPositionY}>
        <Avatar />
      </group>
      <ContactShadows opacity={shadowOpacity} />
    </>
  );
};
