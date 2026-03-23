// ============================================================
//  Baron Intelligence — main.js
//  Handles: navbar, courses render, modal, filters, scroll FX
// ============================================================

/* ── Helpers ── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ── Category labels ── */
const CATEGORY_LABELS = {
  ai:         "🤖 בינה מלאכותית",
  automation: "⚡ אוטומציה",
  design:     "🎨 עיצוב",
  admin:      "📊 אדמין",
};

/* ============================================================
   NAVBAR — scroll shrink + mobile toggle
   ============================================================ */
function initNavbar() {
  const navbar = $("#navbar");

  window.addEventListener("scroll", () => {
    navbar.classList.toggle("scrolled", window.scrollY > 40);
  }, { passive: true });
}

function toggleMobileNav() {
  const btn  = $("#hamburger");
  const menu = $("#mobileMenu");
  const open = menu.classList.toggle("open");
  btn.classList.toggle("open", open);
  btn.setAttribute("aria-expanded", open);
}

/* ============================================================
   COURSES — render + filter
   ============================================================ */
function getCategoryLabel(cat) {
  return CATEGORY_LABELS[cat] || cat;
}

function buildCourseCard(course) {
  const card = document.createElement("article");
  card.className = "course-card reveal";
  card.setAttribute("data-category", course.category);
  card.setAttribute("role", "button");
  card.setAttribute("tabindex", "0");
  card.setAttribute("aria-label", `פתח פרטים על ${course.title}`);

  card.innerHTML = `
    <div class="course-thumb" style="background:${course.color}">
      <div class="course-thumb-dots"></div>
      <span class="course-thumb-icon">${course.emoji}</span>
      <span class="course-level-badge level-${course.level}">${course.levelLabel}</span>
    </div>
    <div class="course-body">
      <div class="course-cat">${getCategoryLabel(course.category)}</div>
      <h3 class="course-title">${course.title}</h3>
      <p class="course-tagline">${course.tagline}</p>
      <div class="course-meta">
        <span>📅 ${course.duration}</span>
        <span>⏱ ${course.hours}</span>
        <span>👩 ${course.students}</span>
      </div>
      <div class="course-footer">
        <div class="course-price">
          <span class="price-now">₪${course.price.toLocaleString()}</span>
          <span class="price-was">₪${course.oldPrice.toLocaleString()}</span>
        </div>
        <button class="btn btn-navy btn-sm" aria-label="פרטים על ${course.title}">
          פרטים ←
        </button>
      </div>
    </div>
  `;

  // Open modal on click or Enter/Space
  card.addEventListener("click", () => openModal(course.id));
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openModal(course.id);
    }
  });

  return card;
}

function renderCourses(filter = "all") {
  const grid = $("#coursesGrid");
  grid.innerHTML = "";

  const list = filter === "all"
    ? COURSES
    : COURSES.filter((c) => c.category === filter);

  list.forEach((course, i) => {
    const card = buildCourseCard(course);
    // Stagger reveal delays
    if (i < 4) card.classList.add(`reveal-delay-${i + 1}`);
    grid.appendChild(card);
  });

  // Trigger reveal observer on new cards
  observeReveal();
}

function initFilters() {
  const pills = $$(".filter-pill");
  pills.forEach((pill) => {
    pill.addEventListener("click", () => {
      pills.forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      renderCourses(pill.dataset.filter);
    });
  });
}

/* ============================================================
   MODAL — open / close / populate
   ============================================================ */
function openModal(courseId) {
  const course = COURSES.find((c) => c.id === courseId);
  if (!course) return;

  const overlay = $("#modalOverlay");
  const modal   = $("#modal");

  // Populate
  $("#modalColorBar").style.background =
    `linear-gradient(90deg, var(--navy), ${course.colorDark}, var(--navy))`;
  $("#modalCat").textContent   = getCategoryLabel(course.category);
  $("#modalTitle").textContent = course.title;

  const thumb = $("#modalThumb");
  thumb.style.background = course.color;
  thumb.querySelector(".modal-thumb-icon").textContent = course.emoji;

  // Calculate discount %
  const pct = Math.round((1 - course.price / course.oldPrice) * 100);
  $("#modalPriceNow").textContent = `₪${course.price.toLocaleString()}`;
  $("#modalPriceWas").textContent = `₪${course.oldPrice.toLocaleString()}`;
  $("#modalDiscount").textContent = `חיסכון ${pct}%`;

  $("#modalChips").innerHTML = `
    <span class="chip">📅 ${course.duration}</span>
    <span class="chip">⏱ ${course.hours}</span>
    <span class="chip">📍 ${course.location}</span>
    <span class="chip">👩 ${course.students} תלמידות</span>
  `;

  $("#modalDesc").textContent = course.description;

  const sylList = $("#modalSyllabus");
  sylList.innerHTML = course.syllabus
    .map(
      (item, i) => `
      <li class="syllabus-row">
        <span class="syllabus-num">${String(i + 1).padStart(2, "0")}</span>
        <span class="syllabus-text">${item}</span>
      </li>`
    )
    .join("");

  // WhatsApp button
  const waMsg = encodeURIComponent(
    `היי אורית לאה, אני מעוניינת להירשם לקורס: ${course.title} 😊`
  );
  $("#modalWaBtn").href = `https://wa.me/${WHATSAPP_NUMBER}?text=${waMsg}`;

  // Show
  overlay.classList.add("open");
  document.body.style.overflow = "hidden";
  modal.focus();
}

function closeModal() {
  $("#modalOverlay").classList.remove("open");
  document.body.style.overflow = "";
}

function initModal() {
  const overlay = $("#modalOverlay");

  // Close on backdrop click
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });

  // Close on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
}

/* ============================================================
   SCROLL REVEAL — IntersectionObserver
   ============================================================ */
function observeReveal() {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  $$(".reveal").forEach((el) => io.observe(el));
}

/* ============================================================
   TOAST
   ============================================================ */
function showToast(msg, duration = 3000) {
  const toast = $("#toast");
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), duration);
}

/* ============================================================
   HERO CARD — card number formatting
   ============================================================ */
function initCardInput() {
  const input = $("#cardNumber");
  if (!input) return;
  input.addEventListener("input", () => {
    let v = input.value.replace(/\D/g, "").substring(0, 16);
    input.value = v.replace(/(.{4})/g, "$1 ").trim();
  });
}

/* ============================================================
   INIT — runs on DOMContentLoaded
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  initNavbar();
  renderCourses();
  initFilters();
  initModal();
  observeReveal();
});

