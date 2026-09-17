export function initThemeToggle(button: HTMLElement): void {
  button.addEventListener('click', () => {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    const next = current === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', next);
    try {
      localStorage.setItem('theme', next);
    } catch {
      // localStorage unavailable (private browsing) — theme still applies for this load
    }
  });
}
