/**
 * Varol Nakliyat - Blog listing
 * Yeni yazı: data/blog-posts.json'a kayıt ekleyin + blog/posts/{slug}.html oluşturun.
 */
(function () {
  "use strict";

  const CATEGORY_LABELS = {
    rehber: "Rehber",
    ipuclari: "İpuçları",
    "evden-eve": "Evden Eve",
    "sehirler-arasi": "Şehirler Arası",
    "parca-esya": "Parça Eşya",
    genel: "Genel",
  };

  const MONTHS = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
  ];

  function formatDate(isoDate) {
    if (!isoDate) return "";
    const [year, month, day] = isoDate.split("-").map(Number);
    if (!year || !month || !day) return isoDate;
    return `${day} ${MONTHS[month - 1]} ${year}`;
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function getPublishedPosts(posts) {
    return posts
      .filter((post) => post.published !== false)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  function activateReveals(container) {
    if (!container) return;
    container.querySelectorAll(".reveal, .fade-up").forEach((el) => {
      el.classList.add("is-visible", "visible");
    });
  }

  function renderCard(post) {
    const category = CATEGORY_LABELS[post.categorySlug] || post.category || "Blog";
    const imageHtml = post.image
      ? `<img src="${escapeHtml(post.image)}" alt="" loading="lazy">`
      : `<div class="blog-card-placeholder" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-9.5z"/></svg></div>`;

    return `
          <article class="blog-card" data-category="${escapeHtml(post.categorySlug || "genel")}">
        <a href="posts/${escapeHtml(post.slug)}.html" class="blog-card-link">
          <div class="blog-card-media">${imageHtml}</div>
          <div class="blog-card-body">
            <div class="blog-card-meta">
              <span class="blog-tag">${escapeHtml(category)}</span>
              <time datetime="${escapeHtml(post.date)}">${escapeHtml(formatDate(post.date))}</time>
            </div>
            <h2>${escapeHtml(post.title)}</h2>
            <p>${escapeHtml(post.excerpt)}</p>
            <span class="blog-card-more">Devamını oku <span aria-hidden="true">→</span></span>
          </div>
        </a>
      </article>
    `;
  }

  function renderEmptyState() {
    return `
      <div class="blog-empty">
        <div class="blog-empty-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
            <path d="M8 7h8M8 11h8M8 15h5"/>
          </svg>
        </div>
        <h2>Yakında burada olacağız</h2>
        <p>Taşınma rehberleri, ipuçları ve nakliyat hakkında faydalı içerikler çok yakında yayında. Bu arada ücretsiz teklif alabilirsiniz.</p>
        <a href="../teklif-al.html" class="btn btn-primary">Ücretsiz Teklif Al</a>
      </div>
    `;
  }

  function renderFilters(categories) {
    if (!categories.length) return "";

    const buttons = [
      `<button type="button" class="blog-filter is-active" data-filter="all">Tümü</button>`,
      ...categories.map(
        (slug) =>
          `<button type="button" class="blog-filter" data-filter="${escapeHtml(slug)}">${escapeHtml(CATEGORY_LABELS[slug] || slug)}</button>`
      ),
    ];

    return `<div class="blog-filters reveal" data-reveal">${buttons.join("")}</div>`;
  }

  function bindFilters(root) {
    const filters = root.querySelector(".blog-filters");
    const grid = root.querySelector(".blog-grid");
    if (!filters || !grid) return;

    filters.addEventListener("click", (event) => {
      const button = event.target.closest(".blog-filter");
      if (!button) return;

      const filter = button.dataset.filter;
      filters.querySelectorAll(".blog-filter").forEach((el) => el.classList.toggle("is-active", el === button));

      grid.querySelectorAll(".blog-card").forEach((card) => {
        const show = filter === "all" || card.dataset.category === filter;
        card.hidden = !show;
      });
    });
  }

  async function initBlogListing() {
    const root = document.querySelector("[data-blog-listing]");
    if (!root) return;

    const dataPath = root.dataset.posts || "../data/blog-posts.json";
    const grid = root.querySelector(".blog-grid");
    const filtersSlot = root.querySelector("[data-blog-filters]");

    try {
      const response = await fetch(dataPath);
      if (!response.ok) throw new Error("Blog verisi yüklenemedi");
      const data = await response.json();
      const posts = getPublishedPosts(data.posts || []);

      if (!posts.length) {
        grid.innerHTML = renderEmptyState();
        activateReveals(grid);
        if (filtersSlot) filtersSlot.innerHTML = "";
        return;
      }

      const categories = [...new Set(posts.map((post) => post.categorySlug).filter(Boolean))];
      if (filtersSlot) filtersSlot.innerHTML = renderFilters(categories);
      grid.innerHTML = posts.map(renderCard).join("");
      activateReveals(grid);
      bindFilters(root);
    } catch (error) {
      grid.innerHTML = renderEmptyState();
      activateReveals(grid);
      if (filtersSlot) filtersSlot.innerHTML = "";
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    initBlogListing();
    initBlogRecent();
  });

  async function initBlogRecent() {
    const container = document.querySelector("[data-blog-recent]");
    if (!container) return;

    const dataPath = container.dataset.posts || "../../data/blog-posts.json";
    const currentSlug = container.dataset.current || "";

    try {
      const response = await fetch(dataPath);
      if (!response.ok) throw new Error("Blog verisi yüklenemedi");
      const data = await response.json();
      const posts = getPublishedPosts(data.posts || [])
        .filter((post) => post.slug !== currentSlug)
        .slice(0, 4);

      if (!posts.length) {
        container.innerHTML = `<a href="../index.html">Blog ana sayfasına dön <span>→</span></a>`;
        return;
      }

      container.innerHTML = posts
        .map(
          (post) =>
            `<a href="${escapeHtml(post.slug)}.html">${escapeHtml(post.title)} <span>→</span></a>`
        )
        .join("");
    } catch (error) {
      container.innerHTML = `<a href="../index.html">Blog ana sayfasına dön <span>→</span></a>`;
    }
  }
})();
