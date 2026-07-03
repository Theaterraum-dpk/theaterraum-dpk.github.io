// 테아터라움 철학하는 몸 — 연극 평론 게시판
// GitHub Pages 등 정적 호스팅 환경을 고려해 브라우저 localStorage에 저장합니다.
// (주의: 방문자마다 각자의 브라우저에 저장되므로, 실제로 모든 방문자가
//  공유하는 게시판이 필요하다면 README.md의 "게시판을 실제로 공유하려면" 항목을 참고하세요.)

(() => {
  const STORAGE_KEY = 'taru_review_posts_v1';

  const seedPosts = [
    {
      id: 'seed-1',
      title: '침묵 다음의 문장 — 몸은 어떻게 말하는가',
      workTitle: '『숨은 문장들』',
      author: '오세연',
      rating: 5,
      date: '2026-05-12',
      content:
        '무대 위에는 대사보다 침묵이 더 자주 놓여 있었다. 배우들은 문장을 말하는 대신 문장의 무게만큼 몸을 기울였고, 관객은 그 기울기를 해독하는 역할을 떠맡았다.\n\n테아터라움 철학하는 몸의 이번 작업은 언어 이전의 몸짓이 언어보다 더 정확할 수 있다는 것을 증명하려는 실험처럼 보인다. 특히 2막의 정지 장면은 이 극단이 왜 "철학하는 몸"이라는 이름을 택했는지 설명해 준다.'
    },
    {
      id: 'seed-2',
      title: '해체된 무대, 재조립되는 관객',
      workTitle: '『의자 없는 방』',
      author: '김도현',
      rating: 4,
      date: '2026-06-03',
      content:
        '이 작품은 관객석의 개념 자체를 흔든다. 정해진 좌석 없이 관객이 공간 안을 이동하며 관람하는 방식은 낯설고 불편했지만, 그 불편함이야말로 연출 임형진이 의도한 것이었다.\n\n다만 후반부로 갈수록 구조적 실험이 감정선을 압도하는 지점이 아쉬웠다. 형식이 내용을 완전히 지배하는 순간, 관객은 해석을 포기하고 관찰자로만 남게 된다.'
    }
  ];

  const els = {};
  let posts = [];
  let activeId = null;

  function loadPosts() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        posts = seedPosts.slice();
        savePosts();
      } else {
        posts = JSON.parse(raw);
      }
    } catch (e) {
      posts = seedPosts.slice();
    }
  }

  function savePosts() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    } catch (e) {
      console.error('저장 공간에 접근할 수 없습니다.', e);
    }
  }

  function stars(n) {
    const full = '★'.repeat(n);
    const empty = '☆'.repeat(5 - n);
    return full + empty;
  }

  function excerpt(text, len = 90) {
    const clean = text.replace(/\s+/g, ' ').trim();
    return clean.length > len ? clean.slice(0, len) + '…' : clean;
  }

  function render() {
    const query = (els.search.value || '').trim().toLowerCase();
    const filtered = posts
      .slice()
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .filter(p => {
        if (!query) return true;
        return (
          p.title.toLowerCase().includes(query) ||
          p.workTitle.toLowerCase().includes(query) ||
          p.author.toLowerCase().includes(query) ||
          p.content.toLowerCase().includes(query)
        );
      });

    els.count.textContent = `총 ${filtered.length}편의 평론`;

    if (!filtered.length) {
      els.list.innerHTML = '';
      els.empty.style.display = 'block';
      return;
    }
    els.empty.style.display = 'none';

    els.list.innerHTML = filtered.map(p => `
      <li class="post-item" data-id="${p.id}" tabindex="0" role="button" aria-expanded="${activeId === p.id}">
        <div class="row1">
          <h3>${escapeHtml(p.title)}<span class="stars" aria-label="평점 ${p.rating}점">${stars(p.rating)}</span></h3>
          <span class="meta">${escapeHtml(p.author)} · ${p.date}</span>
        </div>
        <p class="excerpt">${escapeHtml(excerpt(p.content))}</p>
        <span class="tag">${escapeHtml(p.workTitle)}</span>
      </li>
    `).join('');

    els.list.querySelectorAll('.post-item').forEach(item => {
      item.addEventListener('click', () => openPost(item.dataset.id));
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPost(item.dataset.id); }
      });
    });

    if (activeId) renderFull();
  }

  function openPost(id) {
    activeId = activeId === id ? null : id;
    renderFull();
    render();
    if (activeId) {
      els.full.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function renderFull() {
    if (!activeId) { els.full.classList.remove('open'); els.full.innerHTML = ''; return; }
    const p = posts.find(x => x.id === activeId);
    if (!p) { activeId = null; els.full.classList.remove('open'); return; }

    const isCustom = !p.id.startsWith('seed-');

    els.full.innerHTML = `
      <button class="close" aria-label="닫기">닫기 ✕</button>
      <span class="tag">${escapeHtml(p.workTitle)}</span>
      <h3>${escapeHtml(p.title)}</h3>
      <div class="meta">${escapeHtml(p.author)} · ${p.date} · <span class="stars">${stars(p.rating)}</span></div>
      <div class="body-text">${escapeHtml(p.content)}</div>
      ${isCustom ? '<button class="btn ghost del-btn" data-id="' + p.id + '">이 글 삭제하기</button>' : ''}
    `;
    els.full.classList.add('open');

    els.full.querySelector('.close').addEventListener('click', () => openPost(activeId));
    const delBtn = els.full.querySelector('.del-btn');
    if (delBtn) delBtn.addEventListener('click', () => deletePost(delBtn.dataset.id));
  }

  function deletePost(id) {
    if (!confirm('이 평론을 삭제할까요? 이 작업은 되돌릴 수 없습니다.')) return;
    posts = posts.filter(p => p.id !== id);
    savePosts();
    activeId = null;
    render();
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function handleSubmit(e) {
    e.preventDefault();
    const title = els.fTitle.value.trim();
    const workTitle = els.fWork.value.trim();
    const author = els.fAuthor.value.trim();
    const rating = Number(els.fRating.value);
    const content = els.fContent.value.trim();

    if (!title || !workTitle || !author || !content) {
      els.formMsg.textContent = '제목, 작품명, 이름, 내용을 모두 입력해 주세요.';
      els.formMsg.style.color = 'var(--red)';
      return;
    }

    const newPost = {
      id: 'post-' + Date.now(),
      title, workTitle, author, rating,
      date: new Date().toISOString().slice(0, 10),
      content
    };
    posts.push(newPost);
    savePosts();
    els.form.reset();
    els.fRating.value = '5';
    els.formMsg.textContent = '평론이 등록되었습니다. (이 브라우저에만 저장됩니다)';
    els.formMsg.style.color = 'var(--ink-soft)';
    activeId = newPost.id;
    render();
  }

  document.addEventListener('DOMContentLoaded', () => {
    els.list = document.getElementById('postList');
    els.full = document.getElementById('postFull');
    els.empty = document.getElementById('emptyState');
    els.count = document.getElementById('postCount');
    els.search = document.getElementById('boardSearch');
    els.form = document.getElementById('reviewForm');
    els.fTitle = document.getElementById('fTitle');
    els.fWork = document.getElementById('fWork');
    els.fAuthor = document.getElementById('fAuthor');
    els.fRating = document.getElementById('fRating');
    els.fContent = document.getElementById('fContent');
    els.formMsg = document.getElementById('formMsg');

    if (!els.list) return; // 게시판 페이지가 아니면 종료

    loadPosts();
    render();

    els.search.addEventListener('input', render);
    els.form.addEventListener('submit', handleSubmit);
  });
})();
