import { useLayoutEffect } from 'react';
import gsap from 'gsap';
export function useIntro(ref) {
  useLayoutEffect(() => {
    let saved;
    try {
      saved = localStorage.getItem('space-motion');
    } catch {}
    if (
      matchMedia('(prefers-reduced-motion: reduce)').matches ||
      saved === 'reduce'
    )
      return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
      tl.from('.chapter', { autoAlpha: 0, y: 4, duration: 0.55 }, 0.15)
        .from('h1', { autoAlpha: 0, y: 8, duration: 0.65 }, 0.3)
        .from(
          '.tagline,.description',
          { autoAlpha: 0, y: 6, duration: 0.6, stagger: 0.08 },
          0.55,
        )
        .from('.hero-actions', { autoAlpha: 0, y: 4, duration: 0.6 }, 0.8)
        .from('.hardware-strip', { autoAlpha: 0, y: 6, duration: 0.65 }, 1.05);
    }, ref);
    return () => ctx.revert();
  }, [ref]);
}
