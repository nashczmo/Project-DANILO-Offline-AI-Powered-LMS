import { useState, useEffect, useCallback, useRef } from "react";
import { apiRequest } from "../api";

export function useApi(path, options = {}) {
  const { immediate = true, deps = [] } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate && !!path);
  const [error, setError] = useState(null);
  const pathRef = useRef(path);
  pathRef.current = path;

  const execute = useCallback(
    async (overridePath, opts = {}) => {
      const targetPath = overridePath || pathRef.current;
      if (!targetPath) return;
      setLoading(true);
      setError(null);
      try {
        const result = await apiRequest(targetPath, opts);
        setData(result);
        return result;
      } catch (err) {
        setError(err.message || "Request failed");
        setData(null);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const refresh = useCallback(() => execute(pathRef.current), [execute]);

  const depsString = JSON.stringify(deps);

  useEffect(() => {
    if (immediate && path) {
      execute(path);
    }
  }, [path, immediate, execute, depsString]);

  return { data, loading, error, execute, refresh, setData };
}
