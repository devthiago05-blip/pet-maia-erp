import { useEffect } from "react";

export function useMountEffect(callback: () => void) {
  useEffect(() => {
    callback();
    // The callback is intentionally captured once for mount-only bootstrapping.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
