import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { pullAll, pushEntity } from "@/lib/sync-store";

const CACHE_KEY = "eg.sync.all";

function readCache<T>(): T | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeCache(data: unknown) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    /* quota */
  }
}

type Store = {
  investments: unknown[];
  inventory: unknown[];
  budgets: unknown[];
  tasks: unknown[];
};

export function useSync<T>(
  entity: keyof Store,
  initial: T,
): [T, Dispatch<SetStateAction<T>>, { loading: boolean; online: boolean }] {
  const [data, setData] = useState<T>(() => {
    const cached = readCache<Store>();
    if (cached && Array.isArray(cached[entity])) return cached[entity] as T;
    return initial;
  });
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(true);
  const mounted = useRef(true);

  /* Pull full store from server on mount */
  useEffect(() => {
    mounted.current = true;
    setLoading(true);

    pullAll()
      .then((store) => {
        if (!mounted.current) return;
        writeCache(store);
        setData(store[entity] as T);
        setOnline(true);
      })
      .catch(() => {
        if (!mounted.current) return;
        setOnline(false);
      })
      .finally(() => {
        if (mounted.current) setLoading(false);
      });

    return () => {
      mounted.current = false;
    };
  }, [entity]);

  /* Setter: update local state + cache, push to server */
  const setSynced = useCallback(
    (action: SetStateAction<T>) => {
      setData((prev) => {
        const next = action instanceof Function ? action(prev) : action;

        /* Update cache */
        const cached = readCache<Store>() ?? ({} as Store);
        cached[entity] = next as unknown[];
        writeCache(cached);

        /* Push to server (fire-and-forget) */
        pushEntity({ data: { entity, data: next } }).catch(() => setOnline(false));

        return next;
      });
    },
    [entity],
  );

  return [data, setSynced, { loading, online }];
}
