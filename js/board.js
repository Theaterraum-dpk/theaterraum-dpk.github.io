/* =========================================================
   테아터라움 철학하는 몸 — 평론 게시판 (블로그형)
   localStorage 기반 데모 게시판 스크립트
   ========================================================= */
(function () {
  "use strict";

  var STORAGE_KEY = "trpb_board_posts_v1";

  var els = {};
  var state = {
    posts: [],
    activeCategory: "all",
    searchTerm: "",
    openPostId: null,
  };

  // ---------- 유틸 ----------

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatDate(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return y + "." + m + "." + day;
  }

  function makeExcerpt(content, len) {
    len = len || 110;
    var plain = content.replace(/\n+/g, " ").trim();
    if (plain.length <= len) return plain;
    return plain.slice(0, len).trim() + "…";
  }

  function paragraphsHtml(content) {
    var blocks = content.split(/\n\s*\n/);
    return blocks
      .map(function (block) {
        var safe = escapeHtml(block.trim()).replace(/\n/g, "<br>");
        return "<p>" + safe + "</p>";
      })
      .join("");
  }

  // ---------- 저장소 ----------

  function loadPosts() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      state.posts = raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error("게시판 데이터를 불러오지 못했습니다.", e);
      state.posts = [];
    }
  }

  function savePosts() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.posts));
      return true;
    } catch (e) {
      console.error("게시판 데이터를 저장하지 못했습니다.", e);
      return false;
    }
  }

  // ---------- 렌더링 ----------

  function getFilteredPosts() {
    var list = state.posts.slice().sort(function (a, b) {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    if (state.activeCategory !== "all") {
      list = list.filter(function (p) {
        return p.category === state.activeCategory;
      });
    }

    var term = state.searchTerm.trim().toLowerCase();
    if (term) {
      list = list.filter(function (p) {
        return (
          p.title.toLowerCase().indexOf(term) !== -1 ||
          p.author.toLowerCase().indexOf(term) !== -1 ||
          p.content.toLowerCase().indexOf(term) !== -1 ||
          (p.workTitle || "").toLowerCase().indexOf(term) !== -1
        );
      });
    }

    return list;
  }

  function render() {
    var filtered = getFilteredPosts();

    els.postCount.textContent = "총 " + state.posts.length + "편의 글";
    els.emptyState.style.display = filtered.length ? "none" : "block";

    els.postList.innerHTML = filtered
      .map(function (p) {
        return (
          '<li class="post-item" data-id="' + p.id + '">' +
          '<span class="category-badge cat-' + p.category + '">' + p.category + "</span>" +
          '<h3 class="post-title">' + escapeHtml(p.title) + "</h3>" +
          '<div class="post-meta">' +
          escapeHtml(p.author) +
          (p.workTitle ? " · " + escapeHtml(p.workTitle) : "") +
          " · " +
          formatDate(p.createdAt) +
          "</div>" +
          '<p class="post-excerpt">' + escapeHtml(makeExcerpt(p.content)) + "</p>" +
          "</li>"
        );
      })
      .join("");

    Array.prototype.forEach.call(els.postList.querySelectorAll(".post-item"), function (li) {
      li.addEventListener("click", function () {
        openPost(li.getAttribute("data-id"));
      });
    });
  }

  function openPost(id) {
    var post = state.posts.find(function (p) {
      return p.id === id;
    });
    if (!post) return;

    state.openPostId = id;

    els.postFull.innerHTML =
      '<button class="post-full-back" id="postFullBack">← 목록으로</button>' +
      '<span class="category-badge cat-' + post.category + '">' + post.category + "</span>" +
      '<h2 class="post-full-title">' + escapeHtml(post.title) + "</h2>" +
      '<div class="post-meta">' +
      escapeHtml(post.author) +
      (post.workTitle ? " · " + escapeHtml(post.workTitle) : "") +
      " · " +
      formatDate(post.createdAt) +
      "</div>" +
      '<div class="post-full-body">' + paragraphsHtml(post.content) + "</div>" +
      '<div class="post-full-actions">' +
      '<button id="postDeleteBtn">이 글 삭제</button>' +
      "</div>";

    els.postFull.classList.add("open");
    els.postList.style.display = "none";

    document.getElementById("postFullBack").addEventListener("click", closePost);
    document.getElementById("postDeleteBtn").addEventListener("click", function () {
      if (window.confirm("이 글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
        deletePost(post.id);
      }
    });

    els.postFull.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function closePost() {
    state.openPostId = null;
    els.postFull.classList.remove("open");
    els.postFull.innerHTML = "";
    els.postList.style.display = "";
  }

  function deletePost(id) {
    state.posts = state.posts.filter(function (p) {
      return p.id !== id;
    });
    savePosts();
    closePost();
    render();
  }

  // ---------- 이벤트 ----------

  function handleTabClick(e) {
    var btn = e.target.closest(".board-tab");
    if (!btn) return;

    Array.prototype.forEach.call(els.boardTabs.querySelectorAll(".board-tab"), function (b) {
      b.classList.remove("active");
    });
    btn.classList.add("active");
    state.activeCategory = btn.getAttribute("data-cat");
    render();
  }

  function handleSearch(e) {
    state.searchTerm = e.target.value;
    render();
  }

  function handleSubmit(e) {
    e.preventDefault();

    var title = els.fTitle.value.trim();
    var category = els.fCategory.value;
    var author = els.fAuthor.value.trim();
    var workTitle = els.fWork.value.trim();
    var content = els.fContent.value.trim();

    if (!title || !author || !content) {
      els.formMsg.textContent = "제목, 이름, 내용은 필수 입력 항목입니다.";
      return;
    }

    var post = {
      id: uid(),
      title: title,
      category: category,
      author: author,
      workTitle: workTitle,
      content: content,
      createdAt: new Date().toISOString(),
    };

    state.posts.push(post);
    var ok = savePosts();

    if (!ok) {
      els.formMsg.textContent = "저장에 실패했습니다. 브라우저 저장 공간을 확인해주세요.";
      return;
    }

    els.formMsg.textContent = "글이 등록되었습니다.";
    e.target.reset();
    state.activeCategory = "all";
    Array.prototype.forEach.call(els.boardTabs.querySelectorAll(".board-tab"), function (b) {
      b.classList.toggle("active", b.getAttribute("data-cat") === "all");
    });
    render();

    setTimeout(function () {
      els.formMsg.textContent = "";
    }, 4000);
  }

  // ---------- 초기화 ----------

  function init() {
    els.boardTabs = document.getElementById("boardTabs");
    els.boardSearch = document.getElementById("boardSearch");
    els.postCount = document.getElementById("postCount");
    els.postList = document.getElementById("postList");
    els.postFull = document.getElementById("postFull");
    els.emptyState = document.getElementById("emptyState");
    els.reviewForm = document.getElementById("reviewForm");
    els.fTitle = document.getElementById("fTitle");
    els.fCategory = document.getElementById("fCategory");
    els.fAuthor = document.getElementById("fAuthor");
    els.fWork = document.getElementById("fWork");
    els.fContent = document.getElementById("fContent");
    els.formMsg = document.getElementById("formMsg");

    loadPosts();
    render();

    els.boardTabs.addEventListener("click", handleTabClick);
    els.boardSearch.addEventListener("input", handleSearch);
    els.reviewForm.addEventListener("submit", handleSubmit);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
