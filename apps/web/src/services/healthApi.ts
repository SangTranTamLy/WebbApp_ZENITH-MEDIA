export type HealthResponse = {
  success: boolean;
  message: string;
  data: {
    environment: string;
    timestamp: string;
  };
};

export async function getApiHealth(): Promise<HealthResponse> {
  const response = await fetch("/api/health");

  if (!response.ok) {
    throw new Error("Không thể kết nối tới Zenith API");
  }

  return response.json() as Promise<HealthResponse>;
}