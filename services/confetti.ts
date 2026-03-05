/**
 * confetti.ts
 * Lightweight CSS-based confetti system.
 */

export const triggerConfetti = () => {
    const container = document.createElement('div');
    container.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
    z-index: 10000;
  `;
    document.body.appendChild(container);

    const colors = ['#E8C96B', '#C9A84C', '#6366f1', '#10b981', '#f43f5e'];
    const particleCount = 40;

    for (let i = 0; i < particleCount; i++) {
        const p = document.createElement('div');
        const color = colors[Math.floor(Math.random() * colors.length)];
        const angle = Math.random() * Math.PI * 2;
        const velocity = 100 + Math.random() * 200;
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity;
        const size = 4 + Math.random() * 8;
        const rotation = Math.random() * 360;

        p.className = 'animate-particle';
        p.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
      --tw-translate-x: ${tx}px;
      --tw-translate-y: ${ty}px;
      transform: rotate(${rotation}deg);
      box-shadow: 0 0 10px ${color}66;
    `;

        container.appendChild(p);
    }

    // Cleanup
    setTimeout(() => {
        container.remove();
    }, 1000);
};
