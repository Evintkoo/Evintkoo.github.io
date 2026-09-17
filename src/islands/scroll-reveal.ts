export function initScrollReveal(elements: NodeListOf<Element> | Element[]): void {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLElement;
          setTimeout(() => target.classList.add('visible'), i * 60);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08 },
  );
  elements.forEach((el) => observer.observe(el));
}
