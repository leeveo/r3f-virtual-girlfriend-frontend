import { Loader } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Leva } from "leva";
import { Experience } from "./components/Experience";
import { UI } from "./components/UI";
import { useState } from "react";

function App() {
  const [showLeva, setShowLeva] = useState(false); // Cache Leva par défaut

  return (
    <>
      <Loader />
      <Leva hidden={!showLeva} />
      <UI toggleLeva={() => setShowLeva(prev => !prev)} />
      <Canvas shadows camera={{ position: [0, 0, 1], fov: 30 }}>
        <Experience />
      </Canvas>
    </>
  );
}

export default App;
