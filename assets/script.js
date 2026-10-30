/*
 * Контакты хозяина — заполните, и кнопки появятся в окне заявки и в блоке «Как добраться».
 *   phone    — номер для звонка, например "+79001234567"
 *   whatsapp — номер для WhatsApp без "+", например "79001234567"
 *   telegram — имя пользователя без "@", например "bayalag_arshan"
 *   email    — почта для заявок
 *   price    — стоимость за одного гостя в сутки, ₽
 */
const CONFIG = {
  phone: "",
  whatsapp: "",
  telegram: "",
  email: "",
  price: 1300,
};

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

document.getElementById("year").textContent = new Date().getFullYear();

/* ---------- Nav: solid on scroll, mobile CTA ---------- */
const nav = $("#nav");
const cta = $(".mobile-cta");
const booking = $("#booking");
const onScroll = () => {
  const y = window.scrollY;
  nav.classList.toggle("is-solid", y > 40);
  const b = booking.getBoundingClientRect();
  const inBooking = b.top < window.innerHeight && b.bottom > 0;
  cta.classList.toggle("is-on", y > window.innerHeight * 0.7 && !inBooking);
};
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

/* ---------- Reveal on scroll ---------- */
const io = new IntersectionObserver(
  (entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
  }),
  { rootMargin: "0px 0px -8% 0px" }
);
$$(".reveal").forEach((el, i) => {
  el.style.transitionDelay = `${(i % 4) * 70}ms`;
  io.observe(el);
});

/* ---------- Dates ---------- */
const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const addDays = (s, n) => { const d = new Date(s + "T00:00"); d.setDate(d.getDate() + n); return iso(d); };
const today = iso(new Date());
const nightsBetween = (a, b) => Math.round((new Date(b + "T00:00") - new Date(a + "T00:00")) / 86400000);
const fmtDate = (s) => new Date(s + "T00:00").toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
const rub = (n) => n.toLocaleString("ru-RU") + " ₽";
const plural = (n, [one, few, many]) => {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
};

function linkDates(form) {
  const ci = form.elements.checkin, co = form.elements.checkout;
  ci.min = today;
  co.min = addDays(today, 1);
  ci.addEventListener("change", () => {
    if (!ci.value) return;
    co.min = addDays(ci.value, 1);
    if (!co.value || co.value <= ci.value) co.value = addDays(ci.value, 1);
    form.dispatchEvent(new Event("input"));
  });
}
const quick = $("#quick");
const bform = $("#bform");
linkDates(quick);
linkDates(bform);

/* Quick form → fills the main form and scrolls to it */
quick.addEventListener("submit", (e) => {
  e.preventDefault();
  const q = quick.elements, b = bform.elements;
  b.checkin.value = q.checkin.value;
  b.checkout.min = addDays(q.checkin.value, 1);
  b.checkout.value = q.checkout.value;
  b.adults.value = q.guests.value;
  b.kids.value = 0;
  updateSummary();
  booking.scrollIntoView({ behavior: "smooth" });
  setTimeout(() => b.name.focus({ preventScroll: true }), 700);
});

/* ---------- Steppers ---------- */
$$(".stepper").forEach((st) => {
  const input = $("input", st);
  $$("button", st).forEach((btn) => btn.addEventListener("click", () => {
    const v = (+input.value || 0) + +btn.dataset.step;
    input.value = Math.min(+input.max, Math.max(+input.min, v));
    updateSummary();
  }));
});

/* ---------- Summary ---------- */
const sum = $("#sum");
function updateSummary() {
  const f = bform.elements;
  const guests = (+f.adults.value || 0) + (+f.kids.value || 0);
  if (f.checkin.value && f.checkout.value && f.checkout.value > f.checkin.value) {
    const n = nightsBetween(f.checkin.value, f.checkout.value);
    sum.hidden = false;
    sum.textContent = `${n} ${plural(n, ["ночь", "ночи", "ночей"])} · ${guests} ${plural(guests, ["гость", "гостя", "гостей"])} · ≈ ${rub(n * guests * CONFIG.price)}`;
  } else {
    sum.hidden = true;
  }
}
bform.addEventListener("input", updateSummary);
bform.addEventListener("change", updateSummary);

/* ---------- Phone mask ---------- */
bform.elements.phone.addEventListener("input", (e) => {
  let d = e.target.value.replace(/\D/g, "");
  if (!d) { e.target.value = ""; return; }
  if (d[0] === "8") d = "7" + d.slice(1);
  if (d[0] !== "7") d = "7" + d;
  d = d.slice(0, 11);
  let out = "+7";
  if (d.length > 1) out += " (" + d.slice(1, 4);
  if (d.length >= 4) out += ")";
  if (d.length > 4) out += " " + d.slice(4, 7);
  if (d.length > 7) out += "-" + d.slice(7, 9);
  if (d.length > 9) out += "-" + d.slice(9, 11);
  e.target.value = out;
});

/* ---------- Submit ---------- */
const err = $("#err");
bform.addEventListener("submit", (e) => {
  e.preventDefault();
  const f = bform.elements;
  $$(".invalid", bform).forEach((el) => el.classList.remove("invalid"));
  const problems = [];
  if (!f.checkin.value) problems.push(f.checkin);
  if (!f.checkout.value || f.checkout.value <= f.checkin.value) problems.push(f.checkout);
  if (f.name.value.trim().length < 2) problems.push(f.name);
  if (f.phone.value.replace(/\D/g, "").length < 11) problems.push(f.phone);
  const guests = (+f.adults.value || 0) + (+f.kids.value || 0);
  if (problems.length) {
    problems.forEach((el) => el.classList.add("invalid"));
    err.textContent = "Пожалуйста, укажите даты, имя и номер телефона.";
    problems[0].focus();
    return;
  }
  if (guests > 11) {
    err.textContent = "В доме помещается до 11 гостей.";
    return;
  }
  err.textContent = "";

  const n = nightsBetween(f.checkin.value, f.checkout.value);
  const lines = [
    "Здравствуйте! Хочу забронировать в гостевом доме «Баялиг» (Аршан).",
    `Формат: ${f.type.value}`,
    `Даты: ${fmtDate(f.checkin.value)} — ${fmtDate(f.checkout.value)} (${n} ${plural(n, ["ночь", "ночи", "ночей"])})`,
    `Гости: ${f.adults.value} взр.` + (+f.kids.value ? `, ${f.kids.value} дет.` : ""),
    `Ориентировочно: ${rub(n * guests * CONFIG.price)} (${rub(CONFIG.price)} × ${guests} гост. × ${n} ноч.)`,
    `Имя: ${f.name.value.trim()}`,
    `Телефон: ${f.phone.value}`,
  ];
  if (f.tour.value) lines.push(`Экскурсия: ${f.tour.value}`);
  if (f.comment.value.trim()) lines.push(`Пожелания: ${f.comment.value.trim()}`);
  openModal(lines.join("\n"));
});

/* ---------- Modal ---------- */
const modal = $("#modal");
function actionButtons(text) {
  const enc = encodeURIComponent(text);
  const list = [];
  if (CONFIG.whatsapp) list.push(["Отправить в WhatsApp", `https://wa.me/${CONFIG.whatsapp}?text=${enc}`, "gold"]);
  if (CONFIG.telegram) list.push(["Написать в Telegram", `https://t.me/${CONFIG.telegram}`, "dark", true]);
  if (CONFIG.email) list.push(["Отправить на почту", `mailto:${CONFIG.email}?subject=${encodeURIComponent("Бронирование — Баялиг")}&body=${enc}`, "dark"]);
  if (CONFIG.phone) list.push(["Позвонить " + CONFIG.phone, `tel:${CONFIG.phone}`, "dark"]);
  return list;
}
function openModal(text) {
  $("#modalText").textContent = text;
  const box = $("#modalActions");
  box.innerHTML = "";
  for (const [label, href, kind, copyFirst] of actionButtons(text)) {
    const a = document.createElement("a");
    a.className = `btn btn--${kind} btn--block`;
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = label;
    if (copyFirst) a.addEventListener("click", () => navigator.clipboard?.writeText(text).catch(() => {}));
    box.append(a);
  }
  const copy = document.createElement("button");
  copy.type = "button";
  copy.className = "btn btn--block " + (box.children.length ? "btn--ghost" : "btn--gold");
  copy.textContent = "Скопировать текст заявки";
  copy.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(text); copy.textContent = "Скопировано ✓"; }
    catch { copy.textContent = "Выделите текст выше и скопируйте"; }
  });
  box.append(copy);
  modal.hidden = false;
  document.body.style.overflow = "hidden";
  $(".modal__close", modal).focus();
}
function closeModal() { modal.hidden = true; document.body.style.overflow = ""; }
$(".modal__close", modal).addEventListener("click", closeModal);
modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

/* Contact links in the "Как добраться" block */
const links = $("#contactLinks");
if (CONFIG.phone) links.insertAdjacentHTML("afterbegin", `<a class="btn btn--gold" href="tel:${CONFIG.phone}">${CONFIG.phone}</a>`);
if (CONFIG.whatsapp) links.insertAdjacentHTML("beforeend", `<a class="btn btn--dark" target="_blank" rel="noopener" href="https://wa.me/${CONFIG.whatsapp}">WhatsApp</a>`);
if (CONFIG.telegram) links.insertAdjacentHTML("beforeend", `<a class="btn btn--dark" target="_blank" rel="noopener" href="https://t.me/${CONFIG.telegram}">Telegram</a>`);

/* ---------- Lightbox ---------- */
const lb = $("#lb");
const shots = $$("#gallery .g");
let cur = 0;
function show(i) {
  cur = (i + shots.length) % shots.length;
  const img = $("img", shots[cur]);
  $("img", lb).src = img.src;
  $("img", lb).alt = img.alt;
  $("figcaption", lb).textContent = $("figcaption", shots[cur]).textContent;
}
shots.forEach((s, i) => s.addEventListener("click", () => {
  show(i); lb.hidden = false; document.body.style.overflow = "hidden";
}));
const closeLb = () => { lb.hidden = true; document.body.style.overflow = ""; };
$(".lb__close", lb).addEventListener("click", closeLb);
$(".lb__prev", lb).addEventListener("click", () => show(cur - 1));
$(".lb__next", lb).addEventListener("click", () => show(cur + 1));
lb.addEventListener("click", (e) => { if (e.target === lb) closeLb(); });
let tx = 0;
lb.addEventListener("touchstart", (e) => { tx = e.touches[0].clientX; }, { passive: true });
lb.addEventListener("touchend", (e) => {
  const dx = e.changedTouches[0].clientX - tx;
  if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1));
});
document.addEventListener("keydown", (e) => {
  if (!lb.hidden) {
    if (e.key === "Escape") closeLb();
    if (e.key === "ArrowLeft") show(cur - 1);
    if (e.key === "ArrowRight") show(cur + 1);
  } else if (!modal.hidden && e.key === "Escape") closeModal();
});

/* ---------- Reviews slider ---------- */
const track = $("#rvTrack");
$$(".rv-btn").forEach((b) => b.addEventListener("click", () => {
  const card = $(".rv", track);
  track.scrollBy({ left: +b.dataset.dir * (card.offsetWidth + 20), behavior: "smooth" });
}));

/* ---------- Tours → preselect in the booking form ---------- */
$$("[data-tour]").forEach((b) => b.addEventListener("click", () => {
  bform.elements.tour.value = b.dataset.tour;
  booking.scrollIntoView({ behavior: "smooth" });
  setTimeout(() => bform.elements.checkin.focus({ preventScroll: true }), 700);
}));
