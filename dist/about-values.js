/* Optional About-page values scroll reveal; content stays visible without JS. */
document.addEventListener('DOMContentLoaded', () => {
  const section = document.querySelector('.dd-values');
  if (!section || !('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cards = [...section.querySelectorAll('.dd-values__card')];
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08 });
  section.classList.add('dd-values--reveal');
  cards.forEach(card => observer.observe(card));
});
