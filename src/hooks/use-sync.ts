import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";
const CACHE_PREFIX = "eg.sync.";

function readCache<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeCache(key: string, val: unknown) {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(val));
  } catch { /* quota */ }
}

export function useSync<T>(
  endpoint: string,
  initial: T,
): [T, Dispatch<SetStateAction<T>>, { loading: boolean; online: boolean }] {
  const [data, setData] = useState<T>(() => readCache(endpoint, initial));
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(true);
  const mounted = useRef(true);

  /* Fetch from API on mount — fall back to localStorage cache */
  useEffect(() => {
    mounted.current = true;
    setLoading(true);

    fetch(`${API_BASE}/api/${endpoint}`)
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status}`);
        return res.json() as Promise<T>;
      })
      .then((apiData) => {
        if (!mounted.current) return;
        setData(apiData);
        writeCache(endpoint, apiData);
        setOnline(true);
      })
      .catch(() => {
        if (!mounted.current) return;
        setOnline(false);
      })
      .finally(() => {
        if (mounted.current) setLoading(false);
      });

    return () => { mounted.current = false; };
  }, [endpoint]);

  /* Setter: optimistically update local state + cache, then PUT to API */
  const setSynced = useCallback(
    (action: SetStateAction<T>) => {
      setData((prev) => {
        const next = action instanceof Function ? action(prev) : action;
        writeCache(endpoint, next);

        fetch(`${API_BASE}/api/${endpoint}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(next),
        }).catch(() => setOnline(false));

        return next;
      });
    },
    [endpoint],
  );

  return [data, setSynced, { loading, online }];
}
