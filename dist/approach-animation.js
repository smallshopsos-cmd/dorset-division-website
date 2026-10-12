(() => {
  const section = document.querySelector('.approach-process');
  if (!section || !('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cards = Array.from(section.querySelectorAll('.approach-animated-card'));
  if (!cards.length) return;
  cards.forEach((card, index) => card.style.setProperty('--approach-card-index', index));
  const targets = [...cards, ...section.querySelectorAll('.approach-animated-close')];
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('approach-card-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  section.classList.add('approach-process--ready');
  targets.forEach(target => observer.observe(target));
})();
