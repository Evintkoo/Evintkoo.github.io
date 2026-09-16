export function initCavemanToggle(button: HTMLElement): void {
  button.addEventListener('click', () => {
    const html = document.documentElement;
    const next = !html.classList.contains('caveman');
    html.classList.toggle('caveman', next);
    try {
      localStorage.setItem('caveman', String(next));
    } catch {
      // localStorage unavailable — toggle still applies for this load
    }
  });
}
