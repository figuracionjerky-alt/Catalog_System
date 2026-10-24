import { useEffect, useState } from "react";

export default function useContentProtection() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const stop = (e) => e.preventDefault();

    function flash() {
      setHidden(true);
      setTimeout(() => setHidden(false), 1500);
    }

    function onKeyDown(e) {
      const key = e.key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;
      const blocked =
        e.key === "PrintScreen" ||
        e.key === "F12" ||
        (ctrl && e.shiftKey && ["s", "i", "j", "c"].includes(key)) ||
        (ctrl && ["p", "s", "u"].includes(key));
      if (blocked) {
        e.preventDefault();
        flash();
      }
    }

    function onKeyUp(e) {
      if (e.key === "PrintScreen") {
        navigator.clipboard?.writeText("").catch(() => {});
        flash();
      }
    }

    const onBlur = () => setHidden(true);
    const onFocus = () => setHidden(false);
    const onVisibility = () => setHidden(document.hidden);

    document.addEventListener("contextmenu", stop);
    document.addEventListener("dragstart", stop);
    document.addEventListener("copy", stop);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      document.removeEventListener("contextmenu", stop);
      document.removeEventListener("dragstart", stop);
      document.removeEventListener("copy", stop);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return hidden;
}