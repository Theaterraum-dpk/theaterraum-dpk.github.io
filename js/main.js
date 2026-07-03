// 테아터라움 철학하는 몸 — 공통 스크립트
// 내비게이션 토글 + 스크롤 리빌 애니메이션

document.addEventListener('DOMContentLoaded', () => {
  // 모바일 내비게이션
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.main-nav');
  const backdrop = document.querySelector('.nav-backdrop');

  if (toggle && nav) {
    const closeNav = () => {
      nav.classList.remove('open');
      backdrop && backdrop.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    };
    const openNav = () => {
      nav.classList.add('open');
      backdrop && backdrop.classList.add('open');
      toggle.setAttribute('aria-expanded', 'true');
    };
    toggle.addEventListener('click', () => {
      nav.classList.contains('open') ? closeNav() : openNav();
    });
    backdrop && backdrop.addEventListener('click', closeNav);
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeNav));
  }

  // 스크롤 리빌
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }
});
