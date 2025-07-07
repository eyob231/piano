import { useRef } from "react";
import { useState,useEffect } from "react";
import './App.css';
import { useRive } from '@rive-app/react-canvas';
function App() {
  const audioRefs = useRef([
    new Audio("A0.mp3"),
    new Audio("A1.mp3"),
    new Audio("A2.mp3"),
    new Audio("A3.mp3"),
    new Audio("A4.mp3"),
    new Audio("A5.mp3"),
    new Audio("A6.mp3"),
    new Audio("A7.mp3"),
    new Audio("Ab1.mp3")
    // Add 4 more Audio objects for all buttons
  ]);

  const [lastButtonId, setLastButtonId] = useState(0);

  const { rive, RiveComponent } = useRive({
    src: "piano.riv",
    stateMachines: "State Machine 1",
    autoplay: true,
  });

  // Check for number changes every 100ms
  useEffect(() => {
    const interval = setInterval(() => {
      if (rive) {
        const inputs = rive.stateMachineInputs("State Machine 1");
        if (inputs && inputs.length > 0) {
          const currentButtonId = inputs[0].value;
          if (currentButtonId !== lastButtonId) {
            playAudio(currentButtonId);
            setLastButtonId(currentButtonId);
          }
        }
      }
    }, 0);

    return () => clearInterval(interval);
  }, [rive, lastButtonId]);

  const playAudio = (buttonId) => {
    if (audioRefs.current[buttonId]) {
      audioRefs.current[buttonId].currentTime = 0;
      audioRefs.current[buttonId].play();
    }
  };

  // Preload audio
  useEffect(() => {
    audioRefs.current.forEach(audio => audio.load());
  }, []);

  return (
    <div style={{ width: "100%", height: "500px" }}>
      <RiveComponent />
    </div>
  );
}


export default App;
