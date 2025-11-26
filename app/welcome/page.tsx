// replace your current useEffect(...) with this block
useEffect(() => {
  const audio = audioRef.current;
  if (!audio) return;

  // ensure loop and playsinline attribute
  audio.loop = true;
  audio.setAttribute("playsinline", "");

  const startFadeIn = () => {
    // fade to target volume
    const TARGET_VOLUME = 0.35;
    const FADE_DURATION = 1400;
    const STEP = 60;
    const steps = Math.max(1, Math.round(FADE_DURATION / STEP));
    const increment = TARGET_VOLUME / steps;
    let current = audio.volume ?? 0;

    const id = window.setInterval(() => {
      try {
        current = Math.min(TARGET_VOLUME, (audio.volume ?? 0) + increment);
        audio.volume = current;
        if (current >= TARGET_VOLUME - 0.001) {
          window.clearInterval(id);
          audio.volume = TARGET_VOLUME;
        }
      } catch {
        window.clearInterval(id);
      }
    }, STEP);
  };

  // Attempt immediate play (unmuted). If blocked, wait for a user gesture.
  const tryPlayNow = async (): Promise<boolean> => {
    try {
      // start with a low (or zero) volume to increase chance of success on some platforms
      // but we leave audio.muted = false so if play is allowed it will be audible.
      audio.volume = 0;
      await audio.play();
      // if play succeeded, fade-in
      startFadeIn();
      return true;
    } catch (err) {
      // play blocked
      return false;
    }
  };

  let removedGestureHandler = false;
  let gestureHandler: (() => void) | null = null;

  (async () => {
    const ok = await tryPlayNow();
    if (!ok) {
      // Not allowed: install a one-time user gesture (click/tap) to start audio.
      gestureHandler = async () => {
        try {
          // try to play on user gesture (most browsers will allow this)
          await audio.play();
          startFadeIn();
        } catch (e) {
          // still may fail; nothing more to do
          console.warn("Audio play on gesture failed:", e);
        } finally {
          // remove listener after first gesture
          if (!removedGestureHandler) {
            document.removeEventListener("pointerdown", gestureHandler!);
            removedGestureHandler = true;
          }
        }
      };
      // use passive listener but we remove it after first call (once:true would also work)
      document.addEventListener("pointerdown", gestureHandler, { once: true, passive: true });
    }
  })();

  return () => {
    try {
      audio.pause();
    } catch {}
    if (gestureHandler && !removedGestureHandler) {
      document.removeEventListener("pointerdown", gestureHandler);
    }
  };
}, []);
