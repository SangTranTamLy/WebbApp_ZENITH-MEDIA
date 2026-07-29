import { useEffect, useState } from "react";

type HealthResponse = {
  success: boolean;
  message: string;
  data: {
    environment: string;
    timestamp: string;
  };
};

function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function checkApi() {
      try {
        const response = await fetch("/api/health");

        if (!response.ok) {
          throw new Error("Không thể kết nối API");
        }

        const result: HealthResponse = await response.json();
        setHealth(result);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định",
        );
      }
    }

    void checkApi();
  }, []);

  return (
    <main>
      <h1>Zenith Media Workspace</h1>

      {health && <p>{health.message}</p>}
      {error && <p>{error}</p>}
    </main>
  );
}

export default App;