/* ============================================================
   تطبيق عيادة د. سمر — نسخة ثابتة بالكامل (HTML/CSS/JS)
   من غير أي سيرفر؛ كل البيانات محفوظة في متصفحك.
   ============================================================ */

const toothSVG = `
<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path class="tooth-path" d="M32 8c-7 0-10 4-14 4-5 0-8 4-8 10 0 8 3 13 5 20 1.5 5 2 12 6 12 5 0 4-11 6-15 1-2 2-3 5-3s4 1 5 3c2 4 1 15 6 15 4 0 4.5-7 6-12 2-7 5-12 5-20 0-6-3-10-8-10-4 0-7-4-14-4z"/>
</svg>`;

/* ---------- أدوات مساعدة ---------- */
function esc(str) {
    return (str ?? "").toString()
        .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
}
function fmtDate(d) {
    if (!d) return "";
    const dt = new Date(d);
    if (isNaN(dt)) return d;
    return dt.toISOString().slice(0, 10);
}
function todayISO() { return new Date().toISOString().slice(0, 10); }
function round2(n) { return Math.round((n || 0) * 100) / 100; }
function money(n) { return round2(n).toString(); }
function patientCode(p) { return "#" + p.id.toString().padStart(4, "0"); }
function waLink(phone, message) {
    const digits = (phone || "").replace(/\D/g, "");
    if (!digits) return "#";
    const intl = digits.replace(/^0/, "20");
    return `https://wa.me/${intl}?text=${encodeURIComponent(message)}`;
}
function waReminderText(patient, visit) {
    return `حضرتك عندك معاد يوم ${fmtDate(visit.next_visit_date)} في عيادة د. سمر مجدي الاسكندراني` +
        (visit.next_visit_note ? ` (${visit.next_visit_note})` : "") + ". في انتظارك 🦷";
}

const TOOTH_STATUSES = [
    { key: "healthy", label: "سليمة", color: "#e9ecef", text: "#495057" },
    { key: "decayed", label: "مسوسة", color: "#dc3545", text: "#fff" },
    { key: "filled", label: "محشوة", color: "#0d6efd", text: "#fff" },
    { key: "root_canal", label: "عصب", color: "#6f42c1", text: "#fff" },
    { key: "crown", label: "تركيبة", color: "#ffc107", text: "#000" },
    { key: "missing", label: "مخلوعة", color: "#6c757d", text: "#fff" },
];
let currentToothStatus = "decayed"; // الحالة (اللون) المختارة حاليًا من الباليتة للتلوين
function toothSVGShape(n, color) {
    // مجسم أقرب لشكل السنة الحقيقي: تاج بيضاوي فوق + جذرين متفرعين تحت (زي المجسم التعليمي)
    return `
    <button type="button" class="tooth-cell" data-tooth="${n}" title="سنة ${n}" style="background:none;border:none;padding:0;cursor:pointer;">
      <svg width="28" height="36" viewBox="0 0 28 36" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 13 C 20 19, 19 27, 16.5 33" stroke="${color}" stroke-width="4" fill="none" stroke-linecap="round"/>
        <path d="M10 13 C 8 19, 9 27, 11.5 33" stroke="${color}" stroke-width="4" fill="none" stroke-linecap="round"/>
        <ellipse cx="14" cy="9" rx="10.5" ry="8" fill="${color}" stroke="#adb5bd" stroke-width="1"/>
        <path d="M8 8 Q14 12 20 8" stroke="#ffffff88" stroke-width="1" fill="none"/>
      </svg>
      <div style="font-size:8px;text-align:center;color:#888;">${n}</div>
    </button>`;
}
function toothChartHTML(patient) {
    const teeth = patient.teeth || {};
    const upper = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
    const lower = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
    const cell = (n) => {
        const cfg = TOOTH_STATUSES.find((s) => s.key === (teeth[n] || "healthy")) || TOOTH_STATUSES[0];
        return toothSVGShape(n, cfg.color);
    };
    const row = (arr) => `<div class="d-flex gap-1 justify-content-center mb-1 flex-wrap">${arr.map(cell).join("")}</div>`;
    // كل لون مكتوب عليه اسم حالته على طول (مش لازم تدوسي عليه عشان تعرفي معناه)
    const palette = TOOTH_STATUSES.map((s) => `
        <button type="button" class="tooth-palette-swatch" data-status="${s.key}"
            style="padding:6px 12px;border-radius:8px;cursor:pointer;background:${s.color};color:${s.text};
                   font-size:0.85rem;font-weight:600;
                   border:3px solid ${s.key === currentToothStatus ? "#212529" : "transparent"};">${s.label}</button>`).join(" ");
    return `
    <div class="card p-3 mb-4">
      <h6 class="mb-3"><i class="bi ${ICON.tooth}"></i> خريطة الأسنان</h6>
      <div class="mb-3">
        <div class="text-muted small mb-2">دوسي على الحالة اللي عايزاها، وبعدين دوسي على السنة تلوّنها بيها</div>
        <div class="d-flex gap-2 flex-wrap" id="toothPalette">${palette}</div>
      </div>
      ${row(upper)}
      ${row(lower)}
    </div>`;
}
function attachToothChart(patient) {
    document.querySelectorAll(".tooth-palette-swatch").forEach((btn) => {
        btn.addEventListener("click", () => {
            currentToothStatus = btn.dataset.status;
            document.querySelectorAll(".tooth-palette-swatch").forEach((b) => {
                b.style.border = "3px solid " + (b.dataset.status === currentToothStatus ? "#212529" : "transparent");
            });
        });
    });
    document.querySelectorAll(".tooth-cell").forEach((btn) => {
        btn.addEventListener("click", () => {
            const n = btn.dataset.tooth;
            const teeth = patient.teeth || (patient.teeth = {});
            if (currentToothStatus === "healthy") delete teeth[n]; else teeth[n] = currentToothStatus;
            DB.Patients.update(patient.id, { teeth });
            const cfg = TOOTH_STATUSES.find((s) => s.key === currentToothStatus);
            btn.querySelector("ellipse").setAttribute("fill", cfg.color);
            btn.querySelectorAll("path[stroke-width='4']").forEach((p) => p.setAttribute("stroke", cfg.color));
        });
    });
}
function galleryHTML(patient) {
    const photos = patient.photos || [];
    return `
    <div class="card p-3 mb-4">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h6 class="mb-0"><i class="bi bi-images"></i> الأشعة وصور الأسنان</h6>
        <div>
          <button id="addPhotoBtn" class="btn btn-sm btn-outline-primary"><i class="bi bi-plus-lg"></i> إضافة صورة</button>
          <input type="file" id="galleryInput" accept="image/*" multiple class="d-none">
        </div>
      </div>
      <div class="d-flex gap-2 flex-wrap" id="galleryGrid">
        ${photos.length ? photos.map((src, i) => `
        <div class="position-relative gallery-thumb" data-idx="${i}">
          <img src="${src}" class="gallery-view" style="width:90px;height:90px;object-fit:cover;border-radius:8px;cursor:pointer;border:1px solid #ddd;">
          <button class="btn btn-sm btn-danger gallery-delete" style="position:absolute;top:-6px;left:-6px;border-radius:50%;width:22px;height:22px;padding:0;font-size:0.65rem;line-height:1;">×</button>
        </div>`).join("") : `<div class="text-muted small py-2">مفيش صور أو أشعة مرفوعة لسه</div>`}
      </div>
    </div>`;
}
function attachGallery(patient) {
    document.getElementById("addPhotoBtn").addEventListener("click", () => {
        document.getElementById("galleryInput").click();
    });
    document.getElementById("galleryInput").addEventListener("change", (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        let pending = files.length;
        files.forEach((file) => {
            if (!file.type.startsWith("image/")) { pending -= 1; return; }
            const reader = new FileReader();
            reader.onload = () => {
                const img = new Image();
                img.onload = () => {
                    const maxSize = 500;
                    const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
                    const canvas = document.createElement("canvas");
                    canvas.width = img.width * scale;
                    canvas.height = img.height * scale;
                    canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
                    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
                    const photos = patient.photos || (patient.photos = []);
                    photos.push(dataUrl);
                    DB.Patients.update(patient.id, { photos });
                    pending -= 1;
                    if (pending === 0) { toast("تم إضافة الصور", "success"); viewPatientProfile(patient.id); }
                };
                img.src = reader.result;
            };
            reader.readAsDataURL(file);
        });
    });
    document.querySelectorAll(".gallery-view").forEach((img) => {
        img.addEventListener("click", () => window.open(img.src, "_blank"));
    });
    document.querySelectorAll(".gallery-delete").forEach((btn) => {
        btn.addEventListener("click", () => {
            if (!confirmAction("حذف الصورة دي؟")) return;
            const idx = parseInt(btn.closest(".gallery-thumb").dataset.idx, 10);
            const photos = patient.photos || [];
            photos.splice(idx, 1);
            DB.Patients.update(patient.id, { photos });
            viewPatientProfile(patient.id);
        });
    });
}
function printReceipt(patient, visit) {
    const w = window.open("", "_blank", "width=420,height=600");
    if (!w) { toast("المتصفح منع فتح نافذة الطباعة، اسمحي بالنوافذ المنبثقة", "danger"); return; }
    w.document.write(`
    <!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
    <title>إيصال زيارة</title>
    <style>
      body { font-family: Cairo, Arial, sans-serif; padding: 24px; color: #222; }
      h2 { text-align: center; margin-bottom: 0; }
      .sub { text-align: center; color: #666; margin-bottom: 20px; }
      table { width: 100%; border-collapse: collapse; margin: 12px 0; }
      td, th { padding: 6px 4px; border-bottom: 1px solid #eee; text-align: right; }
      .totals td { font-weight: bold; }
      .muted { color: #666; font-size: 0.9em; }
      hr { border: none; border-top: 1px dashed #999; margin: 16px 0; }
    </style></head><body>
      <h2>عيادة د. سمر مجدي الاسكندراني</h2>
      <div class="sub">إيصال زيارة</div>
      <hr>
      <div>المريض: <strong>${esc(patient.full_name)}</strong> (${patientCode(patient)})</div>
      <div>التاريخ: ${esc(fmtDate(visit.visit_date))}</div>
      <hr>
      <table>
        <tr><th>الخدمة</th></tr>
        ${(visit.services && visit.services.length) ? visit.services.map((s) => `<tr><td>${esc(s)}</td></tr>`).join("") : `<tr><td>—</td></tr>`}
      </table>
      <table class="totals">
        <tr><td>الإجمالي</td><td>${money(visit.total_price)} جنيه</td></tr>
        ${visit.discount ? `<tr><td>الخصم</td><td>${money(visit.discount)} جنيه</td></tr>` : ""}
        <tr><td>المدفوع</td><td>${money(visit.paid_amount)} جنيه</td></tr>
        <tr><td>المتبقي</td><td>${money(visit.remaining_amount)} جنيه</td></tr>
      </table>
      ${visit.next_visit_date ? `<div class="muted">الزيارة الجاية: ${esc(fmtDate(visit.next_visit_date))}${visit.next_visit_note ? " — " + esc(visit.next_visit_note) : ""}</div>` : ""}
      <hr>
      <div class="muted" style="text-align:center">شكرًا لزيارتكم 🦷</div>
    </body></html>`);
    w.document.close();
    w.onload = () => { w.focus(); w.print(); };
}
function printFullFile(patient, visits) {
    const w = window.open("", "_blank");
    if (!w) { toast("المتصفح منع فتح نافذة الطباعة، اسمحي بالنوافذ المنبثقة", "danger"); return; }
    w.document.write(`
    <!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
    <title>ملف المريض - ${esc(patient.full_name)}</title>
    <style>
      body { font-family: Cairo, Arial, sans-serif; padding: 24px; color: #222; max-width: 700px; margin: 0 auto; }
      h2 { text-align: center; margin-bottom: 0; }
      .sub { text-align: center; color: #666; margin-bottom: 20px; }
      table { width: 100%; border-collapse: collapse; margin: 8px 0 20px; }
      td, th { padding: 6px 4px; border-bottom: 1px solid #eee; text-align: right; }
      .totals td { font-weight: bold; }
      .muted { color: #666; font-size: 0.9em; }
      hr { border: none; border-top: 1px dashed #999; margin: 16px 0; }
      .visit-block { break-inside: avoid; margin-bottom: 18px; padding-bottom: 12px; border-bottom: 2px solid #eee; }
    </style></head><body>
      <h2>عيادة د. سمر مجدي الاسكندراني</h2>
      <div class="sub">ملف المريض الكامل</div>
      <hr>
      <div>الاسم: <strong>${esc(patient.full_name)}</strong> (${patientCode(patient)})</div>
      <div>الموبايل: ${esc(patient.phone || "—")} | السن: ${esc(patient.age || "—")} | النوع: ${esc(patient.gender || "—")}</div>
      ${patient.address ? `<div>العنوان: ${esc(patient.address)}</div>` : ""}
      ${patient.medical_notes ? `<div>ملاحظات طبية: ${esc(patient.medical_notes)}</div>` : ""}
      <hr>
      <h3>سجل الزيارات (${visits.length})</h3>
      ${visits.length ? visits.map((v) => `
      <div class="visit-block">
        <div><strong>${esc(fmtDate(v.visit_date))}</strong></div>
        <div>الخدمات: ${(v.services && v.services.length) ? esc(v.services.join("، ")) : "—"}</div>
        <table class="totals">
          <tr><td>الإجمالي</td><td>${money(v.total_price)} جنيه</td></tr>
          ${v.discount ? `<tr><td>الخصم</td><td>${money(v.discount)} جنيه</td></tr>` : ""}
          <tr><td>المدفوع</td><td>${money(v.paid_amount)} جنيه</td></tr>
          <tr><td>المتبقي</td><td>${money(v.remaining_amount)} جنيه</td></tr>
        </table>
        ${v.notes ? `<div class="muted">ملاحظات: ${esc(v.notes)}</div>` : ""}
        ${v.next_visit_date ? `<div class="muted">الزيارة الجاية: ${esc(fmtDate(v.next_visit_date))}${v.next_visit_note ? " — " + esc(v.next_visit_note) : ""}</div>` : ""}
      </div>`).join("") : `<div class="muted">مفيش زيارات مسجلة</div>`}
      <hr>
      <div class="muted" style="text-align:center">شكرًا لزيارتكم 🦷</div>
    </body></html>`);
    w.document.close();
    w.onload = () => { w.focus(); w.print(); };
}
function printStatement(patient, visits) {
    const w = window.open("", "_blank");
    if (!w) { toast("المتصفح منع فتح نافذة الطباعة، اسمحي بالنوافذ المنبثقة", "danger"); return; }
    let totalBilled = 0, totalPaid = 0, totalRemaining = 0;
    visits.forEach((v) => {
        totalBilled = round2(totalBilled + (v.total_price || 0));
        totalPaid = round2(totalPaid + (v.paid_amount || 0));
        totalRemaining = round2(totalRemaining + (v.remaining_amount || 0));
    });
    w.document.write(`
    <!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
    <title>كشف حساب - ${esc(patient.full_name)}</title>
    <style>
      body { font-family: Cairo, Arial, sans-serif; padding: 24px; color: #222; max-width: 650px; margin: 0 auto; }
      h2 { text-align: center; margin-bottom: 0; }
      .sub { text-align: center; color: #666; margin-bottom: 20px; }
      table { width: 100%; border-collapse: collapse; margin: 10px 0; }
      td, th { padding: 7px 5px; border-bottom: 1px solid #eee; text-align: right; }
      thead th { border-bottom: 2px solid #999; }
      .totals td { font-weight: bold; font-size: 1.05em; }
      .muted { color: #666; font-size: 0.9em; }
      hr { border: none; border-top: 1px dashed #999; margin: 16px 0; }
    </style></head><body>
      <h2>عيادة د. سمر مجدي الاسكندراني</h2>
      <div class="sub">كشف حساب</div>
      <hr>
      <div>المريض: <strong>${esc(patient.full_name)}</strong> (${patientCode(patient)})</div>
      <div>الموبايل: ${esc(patient.phone || "—")}</div>
      <div>تاريخ الكشف: ${esc(fmtDate(todayISO()))}</div>
      <hr>
      <table>
        <thead><tr><th>التاريخ</th><th>الإجمالي</th><th>المدفوع</th><th>المتبقي</th></tr></thead>
        <tbody>
          ${visits.length ? visits.map((v) => `
          <tr>
            <td>${esc(fmtDate(v.visit_date))}</td>
            <td>${money(v.total_price)}</td>
            <td>${money(v.paid_amount)}</td>
            <td>${v.remaining_amount > 0 ? money(v.remaining_amount) : "—"}</td>
          </tr>`).join("") : `<tr><td colspan="4" class="muted">مفيش زيارات مسجلة</td></tr>`}
        </tbody>
      </table>
      <hr>
      <table class="totals">
        <tr><td>إجمالي المطلوب</td><td>${money(totalBilled)} جنيه</td></tr>
        <tr><td>إجمالي المدفوع</td><td>${money(totalPaid)} جنيه</td></tr>
        <tr><td>الإجمالي المتبقي</td><td>${money(totalRemaining)} جنيه</td></tr>
      </table>
      <hr>
      <div class="muted" style="text-align:center">شكرًا لتعاملكم معنا 🦷</div>
    </body></html>`);
    w.document.close();
    w.onload = () => { w.focus(); w.print(); };
}
const PAGE_SIZE = 10;

function toast(message, category = "success") {
    const icons = {
        success: "bi-check-circle-fill",
        danger: "bi-x-circle-fill",
        warning: "bi-exclamation-triangle-fill",
        info: "bi-info-circle-fill",
    };
    const stack = document.getElementById("toastStack");
    const el = document.createElement("div");
    el.className = `toast-msg ${category}`;
    el.innerHTML = `<i class="bi ${icons[category] || icons.info}"></i><span>${esc(message)}</span>`;
    stack.appendChild(el);
    setTimeout(() => {
        el.classList.add("leaving");
        setTimeout(() => el.remove(), 350);
    }, 3200);
}

function confirmAction(message) {
    return window.confirm(message);
}

/* تأثير ripple على الأزرار */
document.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn");
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement("span");
    const size = Math.max(rect.width, rect.height);
    ripple.className = "ripple";
    ripple.style.width = ripple.style.height = size + "px";
    ripple.style.left = (e.clientX - rect.left - size / 2) + "px";
    ripple.style.top = (e.clientY - rect.top - size / 2) + "px";
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 650);
});

/* عدّاد أرقام متحرك */
function animateNumber(el, target) {
    if (isNaN(target)) { el.textContent = target; return; }
    const start = 0;
    const duration = 900;
    const t0 = performance.now();
    function step(t) {
        const p = Math.min((t - t0) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(start + (target - start) * eased);
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = target;
    }
    requestAnimationFrame(step);
}

/* ---------- الأيقونات الشائعة ---------- */
const ICON = {
    add: "bi-plus-circle-fill",
    patients: "bi-people-fill",
    money: "bi-cash-coin",
    calc: "bi-calculator-fill",
    bell: "bi-bell-fill",
    phone: "bi-telephone-fill",
    save: "bi-save-fill",
    backup: "bi-box-seam-fill",
    download: "bi-download",
    restore: "bi-arrow-repeat",
    home: "bi-house-door-fill",
    settings: "bi-gear-fill",
    search: "bi-search",
    edit: "bi-pencil-square",
    trash: "bi-trash3-fill",
    view: "bi-eye-fill",
    logout: "bi-box-arrow-left",
    calendar: "bi-calendar-event-fill",
    wave: "bi-stars",
    doc: "bi-clipboard2-pulse-fill",
    printer: "bi-printer-fill",
    reports: "bi-bar-chart-line-fill",
    whatsapp: "bi-whatsapp",
    sort: "bi-arrow-down-up",
    archive: "bi-archive-fill",
    restore: "bi-arrow-counterclockwise",
    tooth: "bi-emoji-smile",
};

/* ============================================================
   المصادقة والتنقل
   ============================================================ */
async function requireGate() {
    await DB.ensureSeed();
    const path = location.hash.replace(/^#/, "") || "/dashboard";

    const authed = !!DB.Session.currentUser();
    if (!authed && path !== "/login") { location.hash = "/login"; return false; }
    if (authed && path === "/login") { location.hash = "/dashboard"; return false; }

    return true;
}

function renderNav() {
    const nav = document.getElementById("navSlot");
    const user = DB.Session.currentUser();
    if (!user) { nav.innerHTML = ""; return; }
    const path = location.hash.replace(/^#/, "");
    const link = (href, label, icon) =>
        `<li class="nav-item"><a class="nav-link ${path === href ? "active" : ""}" href="#${href}"><i class="bi ${icon}"></i> ${label}</a></li>`;

    nav.innerHTML = `
    <nav class="navbar navbar-expand-lg app-navbar">
      <div class="container-fluid px-4">
        <a class="navbar-brand" href="#/dashboard">
          <span class="brand-mark">${toothSVG}</span>
          عيادة د. سمر
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMenu">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navMenu">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            ${link("/dashboard", "الرئيسية", ICON.home)}
            ${link("/patients", "المرضى", ICON.patients)}
            ${link("/reports", "التقارير", ICON.reports)}
            ${link("/expenses", "المصروفات", ICON.money)}
            ${link("/services", "الأسعار والخدمات", ICON.money)}
            ${link("/calculator", "الآلة الحاسبة", ICON.calc)}
            ${link("/settings", "الإعدادات", ICON.settings)}
            ${link("/archive", "الأرشيف", ICON.archive)}
          </ul>
          <button id="logoutBtn" class="btn btn-outline-light btn-sm"><i class="bi ${ICON.logout}"></i> تسجيل خروج</button>
        </div>
      </div>
    </nav>`;
    document.getElementById("logoutBtn").addEventListener("click", () => {
        DB.Session.logout();
        toast("تم تسجيل الخروج", "info");
        location.hash = "/login";
    });

    window.onscroll = () => {
        const barEl = nav.querySelector(".app-navbar");
        if (!barEl) return;
        barEl.classList.toggle("is-scrolled", window.scrollY > 4);
    };
}

function mount(html) {
    const root = document.getElementById("viewRoot");
    root.classList.remove("page-build");
    // إجبار المتصفح على إعادة تشغيل الأنيميشن
    void root.offsetWidth;
    root.innerHTML = html;
    root.classList.add("page-build");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ============================================================
   الصفحات
   ============================================================ */

function viewLogin() {
    mount(`
    <div class="login-wrapper">
      <div class="card login-card text-center anim-top">
        <div class="login-logo anim-bottom anim-delay-1">${toothSVG}</div>
        <h4 class="mb-1 anim-right anim-delay-2">عيادة د. سمر مجدي</h4>
        <p class="text-muted mb-4 anim-right anim-delay-2">سجلي دخولك للمتابعة</p>
        <form id="loginForm" class="text-start">
          <div class="mb-3">
            <label class="form-label">اليوزر نيم</label>
            <input type="text" name="username" class="form-control" required autofocus>
          </div>
          <div class="mb-3">
            <label class="form-label">الباسورد</label>
            <div class="input-group">
              <input type="password" id="loginPassword" name="password" class="form-control" required>
              <button type="button" id="togglePwBtn" class="btn btn-outline-secondary"><i class="bi bi-eye-fill"></i></button>
            </div>
          </div>
          <button type="submit" class="btn btn-primary w-100 anim-left anim-delay-3"><i class="bi bi-box-arrow-in-left"></i> دخول</button>
        </form>
      </div>
    </div>`);

    document.getElementById("togglePwBtn").addEventListener("click", () => {
        const input = document.getElementById("loginPassword");
        const icon = document.querySelector("#togglePwBtn i");
        const showing = input.type === "text";
        input.type = showing ? "password" : "text";
        icon.className = showing ? "bi bi-eye-fill" : "bi bi-eye-slash-fill";
    });

    document.getElementById("loginForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const username = (fd.get("username") || "").toString().trim();
        const password = (fd.get("password") || "").toString();
        const user = DB.Users.findByUsername(username);

        if (user && (await DB.Users.checkPassword(user, password))) {
            DB.Users.resetFailures(user);
            DB.Session.login(user.id);
            location.hash = "/dashboard";
            return;
        }
        if (user) {
            const n = DB.Users.registerFailure(user);
            toast(n >= 3 ? "فيه أكتر من 3 محاولات غلط! تأكد من اليوزر والباسورد" : "اليوزر أو الباسورد غلط", "danger");
        } else {
            toast("اليوزر أو الباسورد غلط", "danger");
        }
    });
}

function viewDashboard() {
    const totalPatients = DB.Patients.all().length;
    const upcoming = DB.Visits.upcoming(3);
    const patientsById = Object.fromEntries(DB.Patients.all().map((p) => [p.id, p]));

    mount(`
    <div class="row g-3 mb-4 stagger">
      <div class="col-md-4">
        <div class="card stat-card">
          <div class="stat-icon"><i class="bi ${ICON.patients}"></i></div>
          <div class="stat-number" data-count="${totalPatients}">0</div>
          <div class="stat-label">إجمالي المرضى</div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card stat-card">
          <div class="stat-icon"><i class="bi ${ICON.bell}"></i></div>
          <div class="stat-number" data-count="${upcoming.length}">0</div>
          <div class="stat-label">مواعيد قريبة (٣ أيام)</div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card stat-card">
          <div class="stat-icon"><i class="bi ${ICON.calendar}"></i></div>
          <div class="stat-number" style="font-size:1.5rem">${todayISO()}</div>
          <div class="stat-label">النهارده</div>
        </div>
      </div>
    </div>

    ${upcoming.length ? `
    <div class="card mb-4 p-3">
      <h5 class="section-title mb-3"><span class="title-icon"><i class="bi ${ICON.bell}"></i></span> تنبيهات المواعيد القريبة</h5>
      <div class="stagger">
        ${upcoming.map((v) => {
            const p = patientsById[v.patient_id];
            if (!p) return "";
            return `
            <div class="alert alert-appointment d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div>
                    <strong>${esc(p.full_name)}</strong> — ${esc(p.phone || "—")}<br>
                    <small class="text-muted">
                        الموعد: ${esc(fmtDate(v.next_visit_date))}
                        ${v.next_visit_note ? " — " + esc(v.next_visit_note) : ""}
                    </small>
                </div>
                <div class="d-flex gap-2">
                  ${p.phone ? `<a href="${waLink(p.phone, waReminderText(p, v))}" target="_blank" rel="noopener" class="btn btn-sm btn-success"><i class="bi ${ICON.whatsapp}"></i> تذكير واتساب</a>` : ""}
                  <a href="#/patients/${p.id}" class="btn btn-sm btn-outline-secondary"><i class="bi ${ICON.view}"></i> عرض المريض</a>
                </div>
            </div>`;
        }).join("")}
      </div>
    </div>` : ""}

    <div class="row g-3 stagger">
      <div class="col-md-3 col-6">
        <a href="#/patients/add" class="big-action-btn"><i class="bi ${ICON.add}"></i> إضافة مريض جديد</a>
      </div>
      <div class="col-md-3 col-6">
        <a href="#/patients" class="big-action-btn"><i class="bi ${ICON.patients}"></i> عرض كل المرضى</a>
      </div>
      <div class="col-md-3 col-6">
        <a href="#/services" class="big-action-btn"><i class="bi ${ICON.money}"></i> قائمة الأسعار</a>
      </div>
      <div class="col-md-3 col-6">
        <a href="#/calculator" class="big-action-btn"><i class="bi ${ICON.calc}"></i> الآلة الحاسبة</a>
      </div>
    </div>`);

    document.querySelectorAll(".stat-number[data-count]").forEach((el) => {
        animateNumber(el, parseInt(el.dataset.count, 10));
    });
}

function viewPatientsList(query) {
    const params = new URLSearchParams(query || "");
    const q = params.get("q") || "";
    const filterType = params.get("filter") || "";
    const dateFilter = params.get("date") || "";
    const page = Math.max(parseInt(params.get("page") || "1", 10) || 1, 1);
    const sortBy = params.get("sort") || "";
    const sortDir = params.get("dir") === "desc" ? "desc" : "asc";

    let patients = DB.Patients.search(q);

    // خريطة سريعة: مريض -> أقرب مواعيده الجاية (لاستخدامها في الفلترة والتلوين)
    const nextVisitByPatient = {};
    patients.forEach((p) => {
        const dates = DB.Visits.forPatient(p.id)
            .filter((v) => v.next_visit_date)
            .map((v) => new Date(v.next_visit_date));
        if (dates.length) nextVisitByPatient[p.id] = dates.sort((a, b) => a - b);
    });

    if (dateFilter) {
        patients = patients.filter((p) => {
            const dates = nextVisitByPatient[p.id];
            if (!dates) return false;
            return dates.some((d) => fmtDate(d) === dateFilter);
        });
    } else if (["today", "week", "late"].includes(filterType)) {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const weekEnd = new Date(today); weekEnd.setDate(weekEnd.getDate() + 7);
        patients = patients.filter((p) => {
            const dates = nextVisitByPatient[p.id];
            if (!dates) return false;
            if (filterType === "today") return dates.some((d) => d.toDateString() === today.toDateString());
            if (filterType === "week") return dates.some((d) => d >= today && d <= weekEnd);
            if (filterType === "late") return dates.some((d) => d < today);
            return true;
        });
    }

    if (sortBy === "name" || sortBy === "age") {
        patients = [...patients].sort((a, b) => {
            let cmp;
            if (sortBy === "age") cmp = (a.age || 0) - (b.age || 0);
            else cmp = (a.full_name || "").localeCompare(b.full_name || "", "ar");
            return sortDir === "desc" ? -cmp : cmp;
        });
    }

    const totalCount = patients.length;
    const totalPages = Math.max(Math.ceil(totalCount / PAGE_SIZE), 1);
    const currentPage = Math.min(page, totalPages);
    const pageStart = (currentPage - 1) * PAGE_SIZE;
    const pagePatients = patients.slice(pageStart, pageStart + PAGE_SIZE);

    const baseParams = (overrides = {}) =>
        new URLSearchParams({
            q,
            ...(filterType ? { filter: filterType } : {}),
            ...(dateFilter ? { date: dateFilter } : {}),
            ...(sortBy ? { sort: sortBy, dir: sortDir } : {}),
            ...overrides,
        });

    const sortHeader = (col, label) => {
        const nextDir = sortBy === col && sortDir === "asc" ? "desc" : "asc";
        return `<th style="cursor:pointer" title="ترتيب"><a class="text-reset text-decoration-none" href="#/patients?${baseParams({ sort: col, dir: nextDir, page: 1 })}">
            ${label} ${sortBy === col ? `<i class="bi ${sortDir === "asc" ? "bi-caret-up-fill" : "bi-caret-down-fill"}"></i>` : `<i class="bi ${ICON.sort} text-muted small"></i>`}
        </a></th>`;
    };

    const tab = (type, label) =>
        `<li class="nav-item"><a class="nav-link ${!dateFilter && filterType === type ? "active" : ""}"
            href="#/patients?${new URLSearchParams({ q, ...(type ? { filter: type } : {}) })}">${label}</a></li>`;

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const isOverdue = (p) => {
        const dates = nextVisitByPatient[p.id];
        return dates && dates.some((d) => d < today);
    };

    const pageLink = (n, label, disabled) =>
        `<li class="page-item ${disabled ? "disabled" : ""} ${n === currentPage ? "active" : ""}">
            <a class="page-link" href="#/patients?${baseParams({ page: n })}">${label}</a>
        </li>`;

    mount(`
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <h4 class="mb-0 section-title"><span class="title-icon"><i class="bi ${ICON.patients}"></i></span> المرضى</h4>
      <div class="d-flex gap-2">
        <button id="exportCsvBtn" class="btn btn-outline-secondary"><i class="bi ${ICON.download}"></i> تصدير CSV</button>
        <a href="#/patients/add" class="btn btn-primary"><i class="bi ${ICON.add}"></i> إضافة مريض جديد</a>
      </div>
    </div>

    <form id="searchForm" class="row g-2 mb-3">
      <div class="col-md-5">
        <input type="text" name="q" value="${esc(q)}" class="form-control" placeholder="بحث بالاسم أو رقم الموبايل">
      </div>
      <div class="col-md-3">
        <input type="date" name="date" value="${esc(dateFilter)}" class="form-control" title="فلترة بموعد معيّن">
      </div>
      <div class="col-md-2">
        <button type="submit" class="btn btn-outline-primary w-100"><i class="bi ${ICON.search}"></i> بحث</button>
      </div>
      ${dateFilter ? `<div class="col-md-2"><a href="#/patients?${new URLSearchParams({ q })}" class="btn btn-outline-secondary w-100">مسح فلتر التاريخ</a></div>` : ""}
    </form>

    <ul class="nav nav-pills mb-3">
      ${tab("", "الكل")}
      ${tab("today", "مواعيد النهارده")}
      ${tab("week", "الأسبوع ده")}
      ${tab("late", "متأخرين عن الميعاد")}
    </ul>

    <div class="card">
      <table class="table table-hover mb-0 align-middle">
        <thead>
          <tr><th>الكود</th>${sortHeader("name", "الاسم")}<th>الموبايل</th>${sortHeader("age", "السن")}<th>النوع</th><th></th></tr>
        </thead>
        <tbody class="stagger">
          ${pagePatients.length ? pagePatients.map((p) => `
          <tr class="${isOverdue(p) ? "table-danger" : ""}">
            <td><span class="badge bg-secondary">${patientCode(p)}</span></td>
            <td>${esc(p.full_name)}</td>
            <td>${esc(p.phone || "—")}</td>
            <td>${esc(p.age || "—")}</td>
            <td>${esc(p.gender || "—")}</td>
            <td class="text-end"><a href="#/patients/${p.id}" class="btn btn-sm btn-outline-primary"><i class="bi ${ICON.view}"></i> عرض</a></td>
          </tr>`).join("") : `<tr><td colspan="6" class="text-center text-muted py-4">مفيش مرضى مطابقين</td></tr>`}
        </tbody>
      </table>
    </div>

    ${totalPages > 1 ? `
    <nav class="mt-3">
      <ul class="pagination justify-content-center">
        ${pageLink(currentPage - 1, "السابق", currentPage <= 1)}
        ${Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => pageLink(n, n, false)).join("")}
        ${pageLink(currentPage + 1, "التالي", currentPage >= totalPages)}
      </ul>
    </nav>` : ""}
    <div class="text-center text-muted small mb-2">إجمالي النتائج: ${totalCount}</div>`);

    document.getElementById("searchForm").addEventListener("submit", (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        location.hash = "/patients?" + new URLSearchParams({ q: fd.get("q") || "", ...(fd.get("date") ? { date: fd.get("date") } : {}) });
    });

    document.getElementById("exportCsvBtn").addEventListener("click", () => {
        const rows = [["الكود", "الاسم", "الموبايل", "السن", "النوع"]];
        patients.forEach((p) => rows.push([patientCode(p), p.full_name, p.phone || "", p.age || "", p.gender || ""]));
        const csv = "\uFEFF" + rows.map((r) => r.map((c) => `"${(c ?? "").toString().replaceAll('"', '""')}"`).join(",")).join("\r\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "patients.csv";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        toast("تم تصدير قائمة المرضى", "success");
    });
}

function serviceCheckboxes(services, name) {
    return services.map((s) => `
    <div class="col-md-4 col-6">
      <div class="form-check border rounded p-2">
        <input class="form-check-input service-check" type="checkbox" ${name ? `name="${name}"` : ""}
               value="${esc(s.name)}" data-price="${s.default_price}" id="svc${s.id}">
        <label class="form-check-label" for="svc${s.id}">
          ${esc(s.name)} <span class="text-muted">(${money(s.default_price)} جنيه)</span>
        </label>
      </div>
    </div>`).join("");
}

function attachCalcLogic(prefix = "") {
    function recalc() {
        let total = 0;
        document.querySelectorAll(".service-check:checked").forEach((cb) => {
            total = round2(total + parseFloat(cb.dataset.price || 0));
        });
        document.getElementById("rawTotal").value = total.toFixed(2);
        const discount = round2(parseFloat(document.getElementById("discount").value || 0));
        const finalTotal = round2(Math.max(total - discount, 0));
        document.getElementById("finalTotal").value = finalTotal.toFixed(2);
        const paid = round2(parseFloat(document.getElementById("paidAmount").value || 0));
        const remaining = round2(Math.max(finalTotal - paid, 0));
        document.getElementById("remainingDisplay").innerText = remaining.toFixed(2);
    }
    document.querySelectorAll(".service-check").forEach((cb) => cb.addEventListener("change", recalc));
    document.getElementById("discount").addEventListener("input", recalc);
    document.getElementById("paidAmount").addEventListener("input", recalc);
    recalc();
}

function viewCalculator() {
    const services = DB.Services.all();
    mount(`
    <h4 class="section-title mb-1"><span class="title-icon"><i class="bi ${ICON.calc}"></i></span> الآلة الحاسبة للفاتورة</h4>
    <div class="divider-deco"></div>
    <p class="text-muted">استخدمها للحساب السريع بس — لو عايز تربط الفاتورة بمريض معين، روح لبروفايل المريض واضغط "تسجيل زيارة جديدة".</p>

    <div class="card p-4">
      <h6 class="mb-3">اختار الخدمات</h6>
      <div class="row g-2 mb-3 stagger">${serviceCheckboxes(services)}</div>

      <div class="row g-3 align-items-end">
        <div class="col-md-3"><label class="form-label">إجمالي الخدمات</label><input type="number" id="rawTotal" class="form-control" readonly value="0"></div>
        <div class="col-md-3"><label class="form-label">الخصم (جنيه)</label><input type="number" id="discount" class="form-control" value="0"></div>
        <div class="col-md-3"><label class="form-label">الإجمالي بعد الخصم</label><input type="number" id="finalTotal" class="form-control" readonly value="0"></div>
        <div class="col-md-3"><label class="form-label">المدفوع الآن</label><input type="number" id="paidAmount" class="form-control" value="0"></div>
      </div>

      <div class="alert alert-info mt-3 mb-0">المتبقي: <strong id="remainingDisplay">0</strong> جنيه</div>
    </div>`);

    attachCalcLogic();
}

function viewPatientForm(patientId) {
    const patient = patientId ? DB.Patients.getById(patientId) : null;
    mount(`
    <h4 class="section-title mb-1"><span class="title-icon"><i class="bi ${patient ? ICON.edit : ICON.add}"></i></span> ${patient ? "تعديل بيانات المريض" : "إضافة مريض جديد"}</h4>
    <div class="divider-deco"></div>

    <div class="card p-4">
      <form id="patientForm">
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label">الاسم الكامل</label>
            <input type="text" name="full_name" class="form-control" required value="${esc(patient?.full_name)}">
          </div>
          <div class="col-md-6">
            <label class="form-label">رقم الموبايل</label>
            <input type="text" name="phone" class="form-control" value="${esc(patient?.phone)}">
          </div>
          <div class="col-md-4">
            <label class="form-label">السن</label>
            <input type="number" name="age" class="form-control" value="${esc(patient?.age)}">
          </div>
          <div class="col-md-4">
            <label class="form-label">النوع</label>
            <select name="gender" class="form-select">
              <option value="ذكر" ${patient?.gender === "ذكر" ? "selected" : ""}>ذكر</option>
              <option value="أنثى" ${patient?.gender === "أنثى" ? "selected" : ""}>أنثى</option>
            </select>
          </div>
          <div class="col-md-4">
            <label class="form-label">العنوان (اختياري)</label>
            <input type="text" name="address" class="form-control" value="${esc(patient?.address)}">
          </div>
          <div class="col-12">
            <label class="form-label">ملاحظات طبية عامة (حساسية، أمراض مزمنة...)</label>
            <textarea name="medical_notes" class="form-control" rows="3">${esc(patient?.medical_notes)}</textarea>
          </div>
        </div>
        <div class="mt-4 d-flex gap-2">
          <button type="submit" class="btn btn-primary"><i class="bi ${ICON.save}"></i> حفظ</button>
          <a href="#/patients" class="btn btn-outline-secondary">إلغاء</a>
        </div>
      </form>
    </div>`);

    document.getElementById("patientForm").addEventListener("submit", (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const data = {
            full_name: (fd.get("full_name") || "").toString().trim(),
            phone: (fd.get("phone") || "").toString().trim(),
            age: fd.get("age") || null,
            gender: fd.get("gender"),
            address: (fd.get("address") || "").toString().trim(),
            medical_notes: (fd.get("medical_notes") || "").toString().trim(),
        };
        if (!data.full_name) { toast("لازم تدخل اسم المريض", "danger"); return; }
        if (data.phone && !/^01[0-9]{9}$/.test(data.phone)) {
            toast("رقم الموبايل لازم يبقى رقم مصري صحيح (01 وبعده 9 أرقام)", "danger");
            return;
        }
        if (data.age !== null && (data.age < 0 || data.age > 120)) {
            toast("السن المدخل مش منطقي", "danger");
            return;
        }
        if (data.phone) {
            const dup = DB.Patients.findByPhone(data.phone, patient ? patient.id : null);
            if (dup && !confirmAction(`الرقم ده متسجل قبل كده باسم "${dup.full_name}" ${patientCode(dup)}. عايزة تكمّلي الحفظ؟`)) return;
        }
        if (patient) {
            DB.Patients.update(patient.id, data);
            toast("تم تعديل بيانات المريض", "success");
            location.hash = "/patients/" + patient.id;
        } else {
            const p = DB.Patients.create(data);
            toast("تم إضافة المريض بنجاح", "success");
            location.hash = "/patients/" + p.id;
        }
    });
}

function paymentBadge(v) {
    if (v.payment_status === "paid") return `<span class="badge badge-paid ms-2">مدفوع بالكامل</span>`;
    if (v.payment_status === "partial") return `<span class="badge badge-partial ms-2">تحت الحساب</span>`;
    return `<span class="badge badge-unpaid ms-2">غير مدفوع</span>`;
}

function viewPatientProfile(patientId) {
    const patient = DB.Patients.getById(patientId);
    if (!patient) { location.hash = "/patients"; return; }
    const visits = DB.Visits.forPatient(patientId);

    mount(`
    ${patient.archived ? `
    <div class="alert alert-warning d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
      <div><i class="bi ${ICON.archive}"></i> المريض ده متأرشف (اتحذف بتاريخ ${esc(fmtDate(patient.archived_at))})</div>
      <div class="d-flex gap-2">
        <button id="restorePatientBtn" class="btn btn-sm btn-success"><i class="bi ${ICON.restore}"></i> استرجاع</button>
        <button id="purgePatientBtn" class="btn btn-sm btn-outline-danger"><i class="bi ${ICON.trash}"></i> حذف نهائي</button>
      </div>
    </div>` : ""}

    <div class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
      <div>
        <h4 class="mb-1">${esc(patient.full_name)} <span class="badge bg-secondary align-middle">${patientCode(patient)}</span></h4>
        <div class="text-muted">
          <i class="bi ${ICON.phone}"></i> ${esc(patient.phone || "—")} &nbsp;|&nbsp;
          ${esc(patient.age || "—")} سنة &nbsp;|&nbsp;
          ${esc(patient.gender || "—")}
        </div>
      </div>
      <div class="d-flex gap-2 flex-wrap">
        <button id="printFullFileBtn" class="btn btn-outline-secondary"><i class="bi ${ICON.printer}"></i> طباعة ملف كامل</button>
        <button id="printStatementBtn" class="btn btn-outline-secondary"><i class="bi bi-receipt"></i> كشف حساب</button>
        ${!patient.archived ? `
        <a href="#/patients/${patient.id}/visits/add" class="btn btn-primary"><i class="bi ${ICON.add}"></i> تسجيل زيارة جديدة</a>
        <a href="#/patients/${patient.id}/edit" class="btn btn-outline-secondary"><i class="bi ${ICON.edit}"></i> تعديل البيانات</a>
        <button id="deletePatientBtn" class="btn btn-outline-danger"><i class="bi ${ICON.trash}"></i> حذف المريض</button>` : ""}
      </div>
    </div>

    ${(patient.address || patient.medical_notes) ? `
    <div class="card p-3 mb-4">
      ${patient.address ? `<div><strong>العنوان:</strong> ${esc(patient.address)}</div>` : ""}
      ${patient.medical_notes ? `<div class="mt-2"><strong>ملاحظات طبية:</strong> ${esc(patient.medical_notes)}</div>` : ""}
    </div>` : ""}

    ${toothChartHTML(patient)}
    ${galleryHTML(patient)}

    <h5 class="section-title mb-3"><span class="title-icon"><i class="bi ${ICON.doc}"></i></span> سجل الزيارات</h5>

    <div class="stagger">
    ${visits.length ? visits.map((v) => `
    <div class="card visit-card p-3 mb-3">
      <div class="d-flex justify-content-between flex-wrap gap-2">
        <div><strong>${esc(fmtDate(v.visit_date))}</strong>${paymentBadge(v)}</div>
        <div class="d-flex gap-2 flex-wrap">
          <button class="btn btn-sm btn-outline-secondary print-visit-btn" data-id="${v.id}"><i class="bi ${ICON.printer}"></i> طباعة الإيصال</button>
          ${(v.next_visit_date && patient.phone) ? `<a href="${waLink(patient.phone, waReminderText(patient, v))}" target="_blank" rel="noopener" class="btn btn-sm btn-success"><i class="bi ${ICON.whatsapp}"></i> تذكير واتساب</a>` : ""}
          <button class="btn btn-sm btn-outline-danger delete-visit-btn" data-id="${v.id}"><i class="bi ${ICON.trash}"></i> حذف</button>
        </div>
      </div>
      <div class="mt-2"><strong>الخدمات:</strong> ${(v.services && v.services.length) ? esc(v.services.join("، ")) : "—"}</div>
      <div class="mt-1"><strong>الإجمالي:</strong> ${money(v.total_price)} جنيه
        ${v.remaining_amount > 0 ? ` — <span class="text-danger">متبقي ${money(v.remaining_amount)} جنيه</span>` : ""}
      </div>
      ${v.notes ? `<div class="mt-1"><strong>ملاحظات:</strong> ${esc(v.notes)}</div>` : ""}
      ${v.next_visit_date ? `<div class="mt-1 text-primary"><strong>الزيارة الجاية:</strong> ${esc(fmtDate(v.next_visit_date))}${v.next_visit_note ? " — " + esc(v.next_visit_note) : ""}</div>` : ""}
    </div>`).join("") : `<div class="card empty-state"><i class="bi bi-journal-x"></i>مفيش زيارات مسجلة لسه</div>`}
    </div>`);

    attachToothChart(patient);
    attachGallery(patient);

    document.getElementById("printFullFileBtn").addEventListener("click", () => printFullFile(patient, visits));
    document.getElementById("printStatementBtn").addEventListener("click", () => printStatement(patient, visits));

    document.getElementById("deletePatientBtn")?.addEventListener("click", () => {
        if (!confirmAction("هيتم نقل المريض للأرشيف، وتقدري تسترجعيه بعد كده من صفحة الأرشيف. متأكدة؟")) return;
        DB.Patients.remove(patient.id);
        toast("تم نقل المريض للأرشيف", "info");
        location.hash = "/patients";
    });
    document.getElementById("restorePatientBtn")?.addEventListener("click", () => {
        DB.Patients.restore(patient.id);
        toast("تم استرجاع المريض", "success");
        viewPatientProfile(patientId);
    });
    document.getElementById("purgePatientBtn")?.addEventListener("click", () => {
        if (!confirmAction("حذف نهائي! مش هينفع ترجعي البيانات دي تاني. متأكدة؟")) return;
        DB.Patients.purge(patient.id);
        toast("تم حذف المريض نهائيًا", "info");
        location.hash = "/patients";
    });
    document.querySelectorAll(".print-visit-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            const v = DB.Visits.getById(parseInt(btn.dataset.id, 10));
            if (v) printReceipt(patient, v);
        });
    });
    document.querySelectorAll(".delete-visit-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            if (!confirmAction("هتتنقل الزيارة دي للأرشيف وتقدري تسترجعيها بعدين. تحذفيها؟")) return;
            DB.Visits.remove(parseInt(btn.dataset.id, 10));
            toast("تم نقل الزيارة للأرشيف", "info");
            viewPatientProfile(patientId);
        });
    });
}

function viewVisitForm(patientId) {
    const patient = DB.Patients.getById(patientId);
    if (!patient) { location.hash = "/patients"; return; }
    const services = DB.Services.all();

    mount(`
    <h4 class="section-title mb-1"><span class="title-icon"><i class="bi ${ICON.add}"></i></span> تسجيل زيارة جديدة — ${esc(patient.full_name)}</h4>
    <div class="divider-deco"></div>

    <div class="card p-4">
      <form id="visitForm">
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label">تاريخ الزيارة</label>
            <input type="date" name="visit_date" class="form-control" value="${todayISO()}">
          </div>
        </div>

        <hr class="my-4">
        <h6 class="mb-3">الخدمات اللي اتعملت</h6>
        <div class="row g-2 mb-3 stagger">${serviceCheckboxes(services, "services")}</div>

        <div class="row g-3 align-items-end">
          <div class="col-md-3"><label class="form-label">إجمالي الخدمات</label><input type="number" step="0.01" id="rawTotal" class="form-control" readonly value="0"></div>
          <div class="col-md-3"><label class="form-label">الخصم (جنيه)</label><input type="number" step="0.01" name="discount" id="discount" class="form-control" value="0"></div>
          <div class="col-md-3"><label class="form-label">الإجمالي بعد الخصم</label><input type="number" step="0.01" name="total_price" id="finalTotal" class="form-control" readonly value="0"></div>
          <div class="col-md-3"><label class="form-label">المدفوع الآن</label><input type="number" step="0.01" name="paid_amount" id="paidAmount" class="form-control" value="0"></div>
        </div>

        <div class="alert alert-info mt-3 mb-0">المتبقي: <strong id="remainingDisplay">0</strong> جنيه</div>

        <hr class="my-4">
        <div class="row g-3">
          <div class="col-12">
            <label class="form-label">ملاحظات عن الحالة (مثلاً: حشو ضرس رقم 6 يمين)</label>
            <textarea name="notes" class="form-control" rows="2"></textarea>
          </div>
          <div class="col-md-6">
            <label class="form-label">موعد الزيارة الجاية (اختياري)</label>
            <input type="date" name="next_visit_date" class="form-control">
          </div>
          <div class="col-md-6">
            <label class="form-label">ملاحظة عن الزيارة الجاية (المتوقع عمله)</label>
            <input type="text" name="next_visit_note" class="form-control">
          </div>
        </div>

        <div class="mt-4 d-flex gap-2">
          <button type="submit" class="btn btn-primary"><i class="bi ${ICON.save}"></i> حفظ كزيارة</button>
          <a href="#/patients/${patient.id}" class="btn btn-outline-secondary">إلغاء</a>
        </div>
      </form>
    </div>`);

    attachCalcLogic();

    document.getElementById("visitForm").addEventListener("submit", (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const selectedServices = fd.getAll("services");
        const totalPrice = round2(parseFloat(fd.get("total_price") || 0));
        const discount = round2(parseFloat(fd.get("discount") || 0));
        const paidAmount = round2(parseFloat(fd.get("paid_amount") || 0));
        const finalTotal = round2(Math.max(totalPrice - discount, 0));
        const remaining = round2(Math.max(finalTotal - paidAmount, 0));

        let paymentStatus = "partial";
        if (remaining <= 0) paymentStatus = "paid";
        else if (paidAmount <= 0) paymentStatus = "unpaid";

        DB.Visits.create({
            patient_id: patient.id,
            visit_date: fd.get("visit_date") || todayISO(),
            services: selectedServices,
            total_price: finalTotal,
            discount,
            paid_amount: paidAmount,
            notes: (fd.get("notes") || "").toString().trim(),
            next_visit_date: fd.get("next_visit_date") || null,
            next_visit_note: (fd.get("next_visit_note") || "").toString().trim(),
            payment_status: paymentStatus,
            remaining_amount: remaining,
        });
        toast("تم حفظ الزيارة بنجاح", "success");
        location.hash = "/patients/" + patient.id;
    });
}

function viewServices() {
    const services = DB.Services.all();
    mount(`
    <h4 class="section-title mb-1"><span class="title-icon"><i class="bi ${ICON.money}"></i></span> قائمة الأسعار والخدمات</h4>
    <div class="divider-deco"></div>

    <div class="card p-4 mb-4">
      <h6 class="mb-3">إضافة خدمة جديدة</h6>
      <form id="addServiceForm" class="row g-2">
        <div class="col-md-6"><input type="text" name="name" class="form-control" placeholder="اسم الخدمة" required></div>
        <div class="col-md-3"><input type="number" step="0.01" name="price" class="form-control" placeholder="السعر (جنيه)" required></div>
        <div class="col-md-3"><button type="submit" class="btn btn-primary w-100"><i class="bi ${ICON.add}"></i> إضافة</button></div>
      </form>
    </div>

    <div class="card">
      <table class="table table-hover mb-0 align-middle">
        <thead><tr><th>الخدمة والسعر</th><th></th></tr></thead>
        <tbody class="stagger">
          ${services.length ? services.map((s) => `
          <tr>
            <td>
              <form class="service-edit-form" data-id="${s.id}">
                <div class="d-flex flex-wrap gap-2 align-items-center">
                  <input type="text" name="name" value="${esc(s.name)}" class="form-control form-control-sm" style="flex:1 1 140px;min-width:100px">
                  <input type="number" step="0.01" name="price" value="${s.default_price}" class="form-control form-control-sm" style="flex:0 0 90px">
                  <button type="submit" class="btn btn-sm btn-outline-primary" style="flex:0 0 auto;white-space:nowrap"><i class="bi ${ICON.save}"></i> حفظ</button>
                </div>
              </form>
            </td>
            <td class="text-end" style="width:80px">
              <button class="btn btn-sm btn-outline-danger delete-service-btn" data-id="${s.id}" style="white-space:nowrap"><i class="bi ${ICON.trash}"></i> حذف</button>
            </td>
          </tr>`).join("") : `<tr><td colspan="2" class="text-center text-muted py-4">مفيش خدمات مضافة لسه</td></tr>`}
        </tbody>
      </table>
    </div>`);

    document.getElementById("addServiceForm").addEventListener("submit", (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const name = (fd.get("name") || "").toString().trim();
        const price = parseFloat(fd.get("price") || 0);
        if (!name) return;
        DB.Services.create(name, price);
        toast("تم إضافة الخدمة", "success");
        viewServices();
    });

    document.querySelectorAll(".service-edit-form").forEach((form) => {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            const fd = new FormData(form);
            DB.Services.update(parseInt(form.dataset.id, 10), (fd.get("name") || "").toString().trim(), parseFloat(fd.get("price") || 0));
            toast("تم تعديل الخدمة", "success");
            viewServices();
        });
    });
    document.querySelectorAll(".delete-service-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            if (!confirmAction("حذف الخدمة دي؟")) return;
            DB.Services.remove(parseInt(btn.dataset.id, 10));
            toast("تم حذف الخدمة", "info");
            viewServices();
        });
    });
}

function viewExpenses() {
    const expenses = DB.Expenses.all();
    const total = expenses.reduce((sum, e) => round2(sum + (e.amount || 0)), 0);
    const today = new Date().toISOString().slice(0, 10);

    mount(`
    <h4 class="mb-3 section-title"><span class="title-icon"><i class="bi ${ICON.money}"></i></span> المصروفات</h4>

    <div class="card p-3 mb-4">
      <h6 class="mb-3">إضافة مصروف جديد (أدوات، بنج، مستلزمات...)</h6>
      <form id="expenseForm" class="row g-2">
        <div class="col-md-5">
          <input type="text" name="description" class="form-control" placeholder="البيان (مثلاً: بنج + قفازات)" required>
        </div>
        <div class="col-md-3">
          <input type="number" step="0.01" min="0" name="amount" class="form-control" placeholder="المبلغ" required>
        </div>
        <div class="col-md-3">
          <input type="date" name="date" class="form-control" value="${today}">
        </div>
        <div class="col-md-1">
          <button type="submit" class="btn btn-primary w-100"><i class="bi ${ICON.add}"></i></button>
        </div>
      </form>
    </div>

    <div class="card">
      <table class="table table-hover mb-0 align-middle">
        <thead><tr><th>التاريخ</th><th>البيان</th><th>المبلغ</th><th></th></tr></thead>
        <tbody>
          ${expenses.length ? expenses.map((e) => `
          <tr>
            <td>${esc(fmtDate(e.date))}</td>
            <td>${esc(e.description)}</td>
            <td>${money(e.amount)} جنيه</td>
            <td class="text-end"><button class="btn btn-sm btn-outline-danger delete-expense-btn" data-id="${e.id}"><i class="bi ${ICON.trash}"></i></button></td>
          </tr>`).join("") : `<tr><td colspan="4" class="text-center text-muted py-4">مفيش مصروفات مسجلة لسه</td></tr>`}
        </tbody>
      </table>
    </div>
    <div class="text-end text-muted mt-2">إجمالي المصروفات: <strong>${money(total)} جنيه</strong></div>`);

    document.getElementById("expenseForm").addEventListener("submit", (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const description = (fd.get("description") || "").toString().trim();
        const amount = round2(parseFloat(fd.get("amount") || 0));
        const date = fd.get("date") || today;
        if (!description || amount <= 0) { toast("لازم تكتب البيان والمبلغ صح", "danger"); return; }
        DB.Expenses.create({ description, amount, date });
        toast("تم إضافة المصروف", "success");
        viewExpenses();
    });

    document.querySelectorAll(".delete-expense-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            if (!confirmAction("حذف المصروف ده؟")) return;
            DB.Expenses.remove(parseInt(btn.dataset.id, 10));
            toast("تم الحذف", "info");
            viewExpenses();
        });
    });
}

function viewReports() {
    const visits = DB.Visits.all();
    const today = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        months.push({
            key: `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`,
            label: d.toLocaleDateString("ar-EG", { month: "long", year: "numeric" }),
        });
    }
    const incomeByMonth = Object.fromEntries(months.map((m) => [m.key, 0]));
    let totalRevenue = 0;
    let totalOutstanding = 0;
    const serviceCounts = {};
    visits.forEach((v) => {
        const d = new Date(v.visit_date);
        const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
        const paid = round2(v.paid_amount || 0);
        totalRevenue = round2(totalRevenue + paid);
        totalOutstanding = round2(totalOutstanding + (v.remaining_amount || 0));
        if (key in incomeByMonth) incomeByMonth[key] = round2(incomeByMonth[key] + paid);
        (v.services || []).forEach((s) => { serviceCounts[s] = (serviceCounts[s] || 0) + 1; });
    });
    const maxIncome = Math.max(...months.map((m) => incomeByMonth[m.key]), 1);
    const topServices = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const thisMonthIncome = incomeByMonth[months[months.length - 1].key];

    const expenses = DB.Expenses.all();
    const thisMonthKey = months[months.length - 1].key;
    let totalExpenses = 0;
    let thisMonthExpenses = 0;
    expenses.forEach((e) => {
        totalExpenses = round2(totalExpenses + (e.amount || 0));
        if ((e.date || "").slice(0, 7) === thisMonthKey) thisMonthExpenses = round2(thisMonthExpenses + (e.amount || 0));
    });
    const netProfit = round2(totalRevenue - totalExpenses);

    mount(`
    <h4 class="mb-3 section-title"><span class="title-icon"><i class="bi ${ICON.reports}"></i></span> التقارير</h4>

    <div class="row g-3 mb-4 stagger">
      <div class="col-md-4">
        <div class="card stat-card">
          <div class="stat-icon"><i class="bi ${ICON.money}"></i></div>
          <div class="stat-number">${money(thisMonthIncome)}</div>
          <div class="stat-label">تحصيل الشهر ده (جنيه)</div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card stat-card">
          <div class="stat-icon"><i class="bi ${ICON.doc}"></i></div>
          <div class="stat-number" style="font-size:1.15rem">${topServices.length ? esc(topServices[0][0]) : "—"}</div>
          <div class="stat-label">أكتر خدمة بتتعمل</div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card stat-card">
          <div class="stat-icon"><i class="bi ${ICON.bell}"></i></div>
          <div class="stat-number">${money(totalOutstanding)}</div>
          <div class="stat-label">إجمالي المتبقي على كل المرضى (جنيه)</div>
        </div>
      </div>
    </div>

    <div class="row g-3 mb-4 stagger">
      <div class="col-md-4">
        <div class="card stat-card">
          <div class="stat-icon"><i class="bi bi-bag-fill"></i></div>
          <div class="stat-number">${money(thisMonthExpenses)}</div>
          <div class="stat-label">مصروفات الشهر ده (جنيه)</div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card stat-card">
          <div class="stat-icon"><i class="bi bi-bag-fill"></i></div>
          <div class="stat-number">${money(totalExpenses)}</div>
          <div class="stat-label">إجمالي المصروفات من كل الوقت (جنيه)</div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card stat-card">
          <div class="stat-icon"><i class="bi bi-graph-up-arrow"></i></div>
          <div class="stat-number">${money(netProfit)}</div>
          <div class="stat-label">صافي الربح (التحصيل - المصروفات)</div>
        </div>
      </div>
    </div>
    <div class="text-end mb-4"><a href="#/expenses" class="btn btn-sm btn-outline-secondary">إدارة المصروفات</a></div>

    <div class="card p-3 mb-4">
      <h6 class="mb-3">التحصيل خلال آخر ٦ شهور</h6>
      ${months.map((m) => `
        <div class="d-flex align-items-center gap-2 mb-2">
          <div style="min-width:110px" class="text-muted small">${m.label}</div>
          <div class="progress flex-grow-1" style="height:22px">
            <div class="progress-bar bg-success" style="width:${(incomeByMonth[m.key] / maxIncome * 100).toFixed(1)}%">${money(incomeByMonth[m.key])}</div>
          </div>
        </div>`).join("")}
    </div>

    <div class="card p-3 mb-4">
      <h6 class="mb-3">أكتر ٥ خدمات بتتعمل</h6>
      ${topServices.length ? `
      <table class="table table-sm mb-0">
        <thead><tr><th>الخدمة</th><th>عدد المرات</th></tr></thead>
        <tbody>
          ${topServices.map(([name, count]) => `<tr><td>${esc(name)}</td><td>${count}</td></tr>`).join("")}
        </tbody>
      </table>` : `<div class="text-muted text-center py-3">مفيش بيانات كفاية لسه</div>`}
    </div>

    <div class="card p-3">
      <div class="d-flex justify-content-between">
        <span>إجمالي التحصيل من كل الوقت</span><strong>${money(totalRevenue)} جنيه</strong>
      </div>
    </div>`);
}

function viewArchive() {
    const archivedPatients = DB.Patients.archivedList();
    const archivedVisits = DB.Visits.archivedList()
        .map((v) => ({ v, patient: DB.Patients.getById(v.patient_id) }))
        .filter((row) => row.patient);

    mount(`
    <h4 class="mb-3 section-title"><span class="title-icon"><i class="bi ${ICON.archive}"></i></span> الأرشيف</h4>

    <h6 class="mb-2">مرضى محذوفين</h6>
    <div class="card mb-4">
      <table class="table mb-0 align-middle">
        <thead><tr><th>الكود</th><th>الاسم</th><th>تاريخ الحذف</th><th></th></tr></thead>
        <tbody>
          ${archivedPatients.length ? archivedPatients.map((p) => `
          <tr>
            <td><span class="badge bg-secondary">${patientCode(p)}</span></td>
            <td>${esc(p.full_name)}</td>
            <td>${esc(fmtDate(p.archived_at))}</td>
            <td class="text-end d-flex gap-2 justify-content-end">
              <button class="btn btn-sm btn-success restore-patient-btn" data-id="${p.id}"><i class="bi ${ICON.restore}"></i> استرجاع</button>
              <button class="btn btn-sm btn-outline-danger purge-patient-btn" data-id="${p.id}"><i class="bi ${ICON.trash}"></i> حذف نهائي</button>
            </td>
          </tr>`).join("") : `<tr><td colspan="4" class="text-center text-muted py-3">مفيش مرضى في الأرشيف</td></tr>`}
        </tbody>
      </table>
    </div>

    <h6 class="mb-2">زيارات محذوفة</h6>
    <div class="card">
      <table class="table mb-0 align-middle">
        <thead><tr><th>المريض</th><th>تاريخ الزيارة</th><th>تاريخ الحذف</th><th></th></tr></thead>
        <tbody>
          ${archivedVisits.length ? archivedVisits.map(({ v, patient }) => `
          <tr>
            <td>${esc(patient.full_name)} <span class="badge bg-secondary">${patientCode(patient)}</span></td>
            <td>${esc(fmtDate(v.visit_date))}</td>
            <td>${esc(fmtDate(v.archived_at))}</td>
            <td class="text-end d-flex gap-2 justify-content-end">
              <button class="btn btn-sm btn-success restore-visit-btn" data-id="${v.id}"><i class="bi ${ICON.restore}"></i> استرجاع</button>
              <button class="btn btn-sm btn-outline-danger purge-visit-btn" data-id="${v.id}"><i class="bi ${ICON.trash}"></i> حذف نهائي</button>
            </td>
          </tr>`).join("") : `<tr><td colspan="4" class="text-center text-muted py-3">مفيش زيارات في الأرشيف</td></tr>`}
        </tbody>
      </table>
    </div>`);

    document.querySelectorAll(".restore-patient-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            DB.Patients.restore(parseInt(btn.dataset.id, 10));
            toast("تم استرجاع المريض", "success");
            viewArchive();
        });
    });
    document.querySelectorAll(".purge-patient-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            if (!confirmAction("حذف نهائي! مش هينفع ترجعي البيانات دي تاني. متأكدة؟")) return;
            DB.Patients.purge(parseInt(btn.dataset.id, 10));
            toast("تم الحذف النهائي", "info");
            viewArchive();
        });
    });
    document.querySelectorAll(".restore-visit-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            DB.Visits.restore(parseInt(btn.dataset.id, 10));
            toast("تم استرجاع الزيارة", "success");
            viewArchive();
        });
    });
    document.querySelectorAll(".purge-visit-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            if (!confirmAction("حذف نهائي! مش هينفع ترجعي البيانات دي تاني. متأكدة؟")) return;
            DB.Visits.purge(parseInt(btn.dataset.id, 10));
            toast("تم الحذف النهائي", "info");
            viewArchive();
        });
    });
}

function viewSettings() {
    mount(`
    <h4 class="section-title mb-1"><span class="title-icon"><i class="bi ${ICON.settings}"></i></span> الإعدادات</h4>
    <div class="divider-deco"></div>

    <div class="card p-4 mb-4">
      <h6 class="mb-3">تغيير الباسورد</h6>
      <form id="passwordForm">
        <div class="row g-3">
          <div class="col-md-4"><label class="form-label">الباسورد الحالي</label><input type="password" name="current_password" class="form-control" required></div>
          <div class="col-md-4"><label class="form-label">الباسورد الجديد</label><input type="password" name="new_password" class="form-control" required></div>
        </div>
        <button type="submit" class="btn btn-primary mt-3">تغيير الباسورد</button>
      </form>
    </div>

    <div class="card p-4 mb-4">
      <h6 class="mb-3"><i class="bi ${ICON.backup}"></i> نسخة احتياطية</h6>
      <p class="text-muted">حمّل نسخة من كل بيانات العيادة (المرضى والزيارات والأسعار) واحفظها في مكان آمن (فلاشة، جوجل درايف).</p>
      <button id="backupBtn" class="btn btn-outline-primary"><i class="bi ${ICON.download}"></i> تحميل نسخة احتياطية</button>
    </div>

    <div class="card p-4">
      <h6 class="mb-3"><i class="bi ${ICON.restore}"></i> استعادة نسخة احتياطية</h6>
      <p class="text-muted text-danger">تحذير: ده هيستبدل كل البيانات الحالية بالنسخة اللي هترفعها.</p>
      <form id="restoreForm">
        <div class="input-group">
          <input type="file" name="backup_file" accept=".json" class="form-control" required>
          <button type="submit" class="btn btn-outline-danger">استعادة</button>
        </div>
      </form>
    </div>`);

    document.getElementById("passwordForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const current = (fd.get("current_password") || "").toString();
        const next = (fd.get("new_password") || "").toString();
        const user = DB.Session.currentUser();
        if (!(await DB.Users.checkPassword(user, current))) {
            toast("الباسورد الحالي غلط", "danger");
        } else if (next.length < 4) {
            toast("الباسورد الجديد قصير أوي", "danger");
        } else {
            await DB.Users.setPassword(user, next);
            toast("تم تغيير الباسورد بنجاح", "success");
            e.target.reset();
        }
    });

    document.getElementById("backupBtn").addEventListener("click", () => {
        const payload = DB.Backup.exportData();
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "clinic_backup.json";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        toast("تم تحميل النسخة الاحتياطية", "success");
    });

    document.getElementById("restoreForm").addEventListener("submit", (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const file = fd.get("backup_file");
        if (!file || !file.name.endsWith(".json")) { toast("لازم ترفع ملف .json صحيح", "danger"); return; }
        if (!confirmAction("متأكد إنك عايز تستبدل كل البيانات الحالية؟")) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const payload = JSON.parse(reader.result);
                DB.Backup.importData(payload);
                toast("تم استعادة النسخة الاحتياطية بنجاح، سجل دخولك تاني", "success");
                DB.Session.logout();
                location.hash = "/login";
            } catch (err) {
                toast("الملف مش سليم", "danger");
            }
        };
        reader.readAsText(file);
    });
}

/* ============================================================
   الموجّه (Router)
   ============================================================ */
async function router() {
    if (!(await requireGate())) return;
    renderNav();

    const full = location.hash.replace(/^#/, "") || "/dashboard";
    const [path, query] = full.split("?");
    const parts = path.split("/").filter(Boolean);

    try {
        if (path === "/login") return viewLogin();
        if (path === "/dashboard") return viewDashboard();
        if (path === "/patients" && parts.length === 1) return viewPatientsList(query);
        if (path === "/patients/add") return viewPatientForm(null);
        if (parts[0] === "patients" && parts.length === 2) return viewPatientProfile(parseInt(parts[1], 10));
        if (parts[0] === "patients" && parts[2] === "edit") return viewPatientForm(parseInt(parts[1], 10));
        if (parts[0] === "patients" && parts[2] === "visits" && parts[3] === "add") return viewVisitForm(parseInt(parts[1], 10));
        if (path === "/services") return viewServices();
        if (path === "/reports") return viewReports();
        if (path === "/expenses") return viewExpenses();
        if (path === "/calculator") return viewCalculator();
        if (path === "/settings") return viewSettings();
        if (path === "/archive") return viewArchive();
    } catch (err) {
        console.error(err);
    }
    location.hash = "/dashboard";
}

window.addEventListener("hashchange", router);
window.addEventListener("DOMContentLoaded", async () => {
    await router();
    setTimeout(() => document.getElementById("bootLoader")?.classList.add("hide"), 350);
});

/* ============================================================
   قفل تلقائي لعدم النشاط
   ============================================================ */
const AUTO_LOCK_MS = 5 * 60 * 1000; // 5 دقايق من غير أي حركة
let lastActivityAt = Date.now();
["click", "keydown", "mousemove", "touchstart", "scroll"].forEach((evt) =>
    window.addEventListener(evt, () => { lastActivityAt = Date.now(); }, { passive: true })
);
setInterval(() => {
    const path = location.hash.replace(/^#/, "");
    if (DB.Session.currentUser() && path !== "/login" && Date.now() - lastActivityAt > AUTO_LOCK_MS) {
        DB.Session.logout();
        toast("تم تسجيل الخروج تلقائيًا لعدم النشاط", "info");
        location.hash = "/login";
    }
}, 15000);
