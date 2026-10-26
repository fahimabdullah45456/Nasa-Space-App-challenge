import { useLayoutEffect, useState } from 'react';
import gsap from 'gsap';

// One state update at the content swap, never per animation frame. A new
// destination cancels the previous fade before its stale callback can run.
export function useDestinationPresentation(destination, phase, reduced, ref) {
  const [shown, setShown] = useState(destination);
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    gsap.killTweensOf(node);
    if (reduced) { setShown(destination); gsap.set(node, { opacity: 1, y: 0 }); return; }
    const tween = shown !== destination
      ? gsap.to(node, { opacity: .18, y: 6, duration: .2, ease: 'power1.out', onComplete: () => setShown(destination) })
      : gsap.to(node, { opacity: phase === 'traveling' ? .48 : 1, y: phase === 'traveling' ? 3 : 0, duration: phase === 'traveling' ? .3 : .5, ease: 'power2.out' });
    return () => tween.kill();
  }, [destination, shown, phase, reduced, ref]);
  return shown;
}
