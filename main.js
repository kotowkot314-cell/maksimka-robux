const API = "https://ВАШ_ЛОГИН.pythonanywhere.com/api/osint";

const form = document.getElementById("form");
const queryI = document.getElementById("query");
const prefix = document.getElementById("prefix");
const gChk = document.getElementById("g");
const statusEl = document.getElementById("status");
const tbody = document.getElementById("tbody");
const empty = document.getElementById("empty");
const run = document.getElementById("run");
const filter = document.getElementById("filter");
const statTotal = document.getElementById("stat-total");
const statFound = document.getElementById("stat-found");

document.getElementById("year").textContent = new Date().getFullYear();

let allRows = [];
let mode = "phone";
let activeSources = new Set(["telegram", "vk", "whatsapp", "max", "dorks"]);

function esc(v) {
  if (v === null || v === undefined || v === "") return "—";
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function statusCell(reg) {
  if (reg === true) return '<span class="status-ok">Найден</span>';
  if (reg === false) return '<span class="status-no">Не найден</span>';
  return '<span class="status-na">—</span>';
}

function render() {
  let rows = allRows.filter(r => activeSources.has(r.source));
  const q = filter.value.trim().toLowerCase();
  if (q) {
    rows = rows.filter(r => (r.source || "").toLowerCase().includes(q));
  }

  tbody.innerHTML = "";
  if (!rows.length) {
    empty.classList.remove("hidden");
    statTotal.textContent = "0";
    statFound.textContent = "0";
    return;
  }
  empty.classList.add("hidden");

  const found = rows.filter(r => r.registered === true).length;
  statTotal.textContent = rows.length;
  statFound.textContent = found;

  rows.forEach(r => {
    const tr = document.createElement("tr");
    const name = r.name || r.username || "";
    const extra = r.about || r.snippet || r.note || r.error || "";
    const link = r.link
      ? `<a class="link" href="${esc(r.link)}" target="_blank" rel="noopener">открыть</a>`
      : "—";
    const badge = r.error
      ? `<span class="src-badge err">${esc(r.source)}</span>`
      : `<span class="src-badge">${esc(r.source)}</span>`;

    tr.innerHTML = `
      <td>${badge}</td>
      <td>${statusCell(r.registered)}</td>
      <td>${esc(name)}</td>
      <td>${esc(extra)}</td>
      <td>${link}</td>
    `;
    tbody.appendChild(tr);
  });
}

document.querySelectorAll(".mode-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".mode-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    mode = btn.dataset.mode;
    if (mode === "phone") {
      prefix.textContent = "+";
      queryI.placeholder = "7 900 123 45 67";
      queryI.type = "tel";
    } else {
      prefix.textContent = "@";
      queryI.placeholder = "example@mail.com";
      queryI.type = "email";
    }
    queryI.value = "";
    queryI.focus();
  });
});

document.querySelectorAll(".chip").forEach(chip => {
  chip.addEventListener("click", () => {
    const src = chip.dataset.source;
    if (activeSources.has(src)) {
      activeSources.delete(src);
      chip.classList.remove("active");
    } else {
      activeSources.add(src);
      chip.classList.add("active");
    }
    render();
  });
});

filter.addEventListener("input", render);

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const query = queryI.value.trim();
  if (!query) return;

  run.disabled = true;
  run.classList.add("loading");
  statusEl.textContent = "Поиск...";
  tbody.innerHTML = "";
  empty.classList.add("hidden");

  try {
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        query, 
        type: mode, 
        use_google: gChk.checked 
      })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    allRows = data.results || [];
    statusEl.textContent = `Найдено: ${data.count}`;
    render();
  } catch (err) {
    statusEl.textContent = "Ошибка: " + err.message;
    empty.classList.remove("hidden");
    empty.querySelector(".empty-title").textContent = "Ошибка запроса";
    empty.querySelector(".empty-sub").textContent = err.message;
  } finally {
    run.disabled = false;
    run.classList.remove("loading");
  }
});