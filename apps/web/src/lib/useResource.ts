import { useCallback, useEffect, useState } from "react";
import { api, errorMessage } from "./api";
import { useShop } from "./context";
export function useResource<T>(route: string | null) {
  const { locale } = useShop();
  const [version, setVersion] = useState(0);
  const key = JSON.stringify([route, locale, version]);
  const [result, setResult] = useState<{
    key: string;
    route: string | null;
    data: T | null;
    error: string;
  }>({ key: "", route: null, data: null, error: "" });
  const reload = useCallback(() => setVersion((v) => v + 1), []);
  useEffect(() => {
    if (!route) return;
    const controller = new AbortController();
    api<T>(route, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted)
          setResult({ key, route, data, error: "" });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setResult({
            key,
            route,
            data: null,
            error: errorMessage(error, locale),
          });
      });
    return () => controller.abort();
  }, [route, key, locale]);
  const setData = (data: T) => setResult({ key, route, data, error: "" });
  return {
    data: result.route === route ? result.data : null,
    setData,
    loading: !!route && result.key !== key,
    error: result.key === key ? result.error : "",
    reload,
  };
}
