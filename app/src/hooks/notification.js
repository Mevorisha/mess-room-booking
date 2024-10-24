import { useState, useEffect, useCallback } from "react";

export default function useNotification() {
  const [queue, setQueue] = useState(
    /** @type {{ message: string, kind: "info" | "success" | "warning" | "error" }[]} */
    ([])
  );

  const [currentNotification, setCurrentNotification] = useState(
    /** @type {{ message: string, kind: "info" | "success" | "warning" | "error" }} */
    ({
      message: "",
      kind: "info",
    })
  );

  const notify = useCallback(
    /**
     *
     * @param {string} message
     * @param {"info" | "success" | "warning" | "error"} kind
     */
    (message, kind) => {
      setQueue((prevQueue) => [...prevQueue, { message, kind }]);
    },
    []
  );

  useEffect(() => {
    if (!currentNotification.message && queue.length > 0) {
      const nextNotification = queue[0];
      setCurrentNotification(nextNotification);

      const timer = setTimeout(() => {
        setCurrentNotification({ message: "", kind: "info" });
        setQueue((prevQueue) => prevQueue.slice(1));
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [currentNotification, queue]);

  return {
    notify,
    currentNotification,
  };
}
