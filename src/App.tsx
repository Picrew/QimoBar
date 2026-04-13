import { useEffect, useState } from "react";
import PetWindow from "./pages/PetWindow";
import SettingsWindow from "./pages/SettingsWindow";

function App() {
  const [route, setRoute] = useState("");

  useEffect(() => {
    // Determine which page to show based on URL path
    const path = window.location.pathname;
    if (path.includes("settings")) {
      setRoute("settings");
    } else {
      setRoute("pet");
    }
  }, []);

  if (route === "settings") {
    return <SettingsWindow />;
  }
  return <PetWindow />;
}

export default App;
