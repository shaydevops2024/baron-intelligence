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

  const inCart = typeof cart !== 'undefined' && cart.find(x => x.id === course.id);
  card.innerHTML = `
    <span class="course-level-badge level-${course.level}">${course.levelLabel}</span>
    <div class="course-thumb">
      <div class="course-thumb-icon" style="background:${course.color}">${course.emoji}</div>
      <div class="course-body">
        <div class="course-cat">${getCategoryLabel(course.category)}</div>
        <h3 class="course-title">${course.title}</h3>
        <p class="course-tagline">${course.tagline}</p>
        <div class="course-stars">★★★★★ <span>4.9</span></div>
        <div class="course-meta">
          <span>🕐 ${course.duration}</span>
          <span>📈 ${course.levelLabel}</span>
        </div>
      </div>
    </div>
    <div class="course-footer">
      <div class="course-price">
        <span class="price-now">₪${course.price.toLocaleString()}</span>
        <span class="price-was">₪${course.oldPrice.toLocaleString()}</span>
        <div class="price-sub">תשלום חד פעמי</div>
      </div>
      <button class="btn-navy ${inCart ? 'added' : ''}"
        onclick="event.stopPropagation(); addToCart('${course.id}')" id="cartbtn-${course.id}">
        ${inCart ? '✓ בעגלה' : '+ הוספה'}
      </button>
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
  const pills = $$(".pill");
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

/* ============================================================
   CART SYSTEM (added for mockup parity)
   ============================================================ */
let cart = [];

function addToCart(courseId) {
  if (cart.find(x => x.id === courseId)) { toggleCart(); return; }
  const course = COURSES.find(c => c.id === courseId);
  if (!course) return;
  cart.push(course);
  updateCart();
  renderCourses();
  showToast(`${course.title} נוספה לעגלה ✓`);
}

function removeFromCart(courseId) {
  cart = cart.filter(x => x.id !== courseId);
  updateCart();
  renderCourses();
}

function updateCart() {
  const countEl = document.getElementById('cartCount');
  if (countEl) countEl.textContent = cart.length;

  const items  = document.getElementById('cartItems');
  const footer = document.getElementById('cartFooter');
  if (!items) return;

  if (!cart.length) {
    items.innerHTML = `<div class="cart-empty"><div class="empty-icon">🛒</div><p>העגלה ריקה<br>בחרי קורס להתחיל!</p></div>`;
    if (footer) footer.style.display = 'none';
  } else {
    items.innerHTML = cart.map(c => `
      <div class="cart-item">
        <div class="cart-item-icon">${c.emoji}</div>
        <div class="cart-item-info"><strong>${c.title}</strong><span>${c.duration}</span></div>
        <div class="cart-item-price">₪${c.price.toLocaleString()}</div>
        <button class="cart-remove" onclick="removeFromCart('${c.id}')">🗑</button>
      </div>`).join('');
    const total = cart.reduce((s, c) => s + c.price, 0);
    const totalEl = document.getElementById('cartTotal');
    if (totalEl) totalEl.textContent = `₪${total.toLocaleString()}`;
    if (footer) footer.style.display = 'block';
  }
}

function toggleCart() {
  document.getElementById('cartPanel').classList.toggle('open');
  document.getElementById('panelBackdrop').classList.toggle('open');
}
function closeCart() {
  document.getElementById('cartPanel').classList.remove('open');
  document.getElementById('panelBackdrop').classList.remove('open');
}

function openCheckout() {
  closeCart();
  const total    = cart.reduce((s, c) => s + c.price, 0);
  const discount = cart.reduce((s, c) => s + (c.oldPrice - c.price), 0);
  document.getElementById('checkoutContent').innerHTML = `
    <div class="checkout-header">
      <button class="checkout-close" onclick="closeCheckoutDirect()">×</button>
      <h2>🔐 תשלום מאובטח</h2>
      <p>הנתונים שלך מוצפנים ומאובטחים</p>
    </div>
    <div class="checkout-body">
      <div class="checkout-order">
        <h4>סיכום הזמנה</h4>
        ${cart.map(c => `<div class="order-item"><span>${c.emoji} ${c.title}</span><span>₪${c.price.toLocaleString()}</span></div>`).join('')}
        <div class="order-item"><span>חיסכון</span><span style="color:var(--mint)">-₪${discount.toLocaleString()}</span></div>
        <div class="order-item"><span>סה"כ לתשלום</span><span>₪${total.toLocaleString()}</span></div>
      </div>
      <div class="form-section">
        <h4>פרטים אישיים</h4>
        <div class="form-row">
          <div class="form-group"><label>שם פרטי</label><input type="text" placeholder="שרה"></div>
          <div class="form-group"><label>שם משפחה</label><input type="text" placeholder="לוי"></div>
        </div>
        <div class="form-row single"><div class="form-group"><label>אימייל</label><input type="email" placeholder="sarah@example.com"></div></div>
        <div class="form-row single"><div class="form-group"><label>טלפון</label><input type="tel" placeholder="050-0000000"></div></div>
      </div>
      <div class="form-section">
        <h4>פרטי תשלום</h4>
        <div class="secure-badge">🔒 SSL מוצפן · Visa · MasterCard · Amex</div>
        <div class="form-row single"><div class="form-group"><label>מספר כרטיס</label><input type="text" placeholder="0000 0000 0000 0000"></div></div>
        <div class="form-row card">
          <div class="form-group"><label>שם בעל הכרטיס</label><input type="text" placeholder="SARAH LEVY"></div>
          <div class="form-group"><label>תוקף</label><input type="text" placeholder="MM/YY"></div>
          <div class="form-group"><label>CVV</label><input type="text" placeholder="123"></div>
        </div>
      </div>
      <button class="pay-btn" onclick="processPayment()">💳 שלמי ₪${total.toLocaleString()} עכשיו</button>
    </div>`;
  document.getElementById('checkoutOverlay').classList.add('open');
}

function closeCheckout(e) {
  if (e.target === document.getElementById('checkoutOverlay')) closeCheckoutDirect();
}
function closeCheckoutDirect() {
  document.getElementById('checkoutOverlay').classList.remove('open');
}

function processPayment() {
  document.getElementById('checkoutContent').innerHTML = `
    <div class="success-screen">
      <div class="success-icon">🎉</div>
      <h2>התשלום אושר!</h2>
      <p>ברכות! הרישום שלך הושלם בהצלחה.<br>שלחנו אישור למייל שלך.<br><br>נתראה בשיעור הראשון! 🌸</p>
      <button class="btn btn-primary" style="margin-top:28px" onclick="closeCheckoutDirect()">חזרה לאתר</button>
    </div>`;
  cart = []; updateCart(); renderCourses();
}
