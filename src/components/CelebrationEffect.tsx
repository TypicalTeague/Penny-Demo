import confetti from 'canvas-confetti';

export function triggerCelebration(): void {
  // Respect user preference for reduced motion
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  try {
    // Tasteful, compact burst designed for mobile message screen
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.65, x: 0.5 },
      colors: ['#34C759', '#007AFF', '#FFD60A', '#30B0C7', '#32D74B'],
      disableForReducedMotion: true,
      ticks: 160,
      gravity: 1.1,
      scalar: 0.8,
    });
  } catch (err) {
    console.error('Failed to trigger celebration confetti:', err);
  }
}
