import { AppProviders } from "./AppProviders";
import { AppRouter } from "./AppRouter";
import { ChatWidget } from "../features/ai-chat/components/ChatWidget";

function App() {
  return (
    <AppProviders>
      <AppRouter />
      <ChatWidget />
    </AppProviders>
  );
}

export default App;