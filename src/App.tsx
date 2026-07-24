import { ThemeProvider } from "./context/ThemeContext";
import { Game } from "./pages/Game";

function App() {
  return (
    <ThemeProvider>
      <Game />
    </ThemeProvider>
  );
}

export default App;
