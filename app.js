
const API = "https://maxxi1mka.pythonanywhere.com";

const state = { feed: [], me: null };

const $ = (id) => document.getElementById(id);
const view = $("view");

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}

async function api(path, opts = {}) {
  const r = await fetch(API + path, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...opts
  });
  if (!r.ok) throw new Error(r.status);
  return r.json();
}

function setNav(active) {
  ["nav-feed","nav-in","nav-new","nav-out"].forEach(id => {
    $(id).classList.toggle("active", id === active);
  });
  const logged = !!state.me;
  $("nav-in").hidden = logged;
  $("nav-new").hidden = !logged;
  $("nav-out").hidden = !logged;
}

function renderFeed() {
  setNav("nav-feed");
  if (!state.feed.length) { view.innerHTML = '<div class="e">∅</div>'; return; }
  view.innerHTML = state.feed.map(p => `
    <div class="p">
      <div class="m">${esc(p.uid.slice(0,6))} · ${p.created}</div>
      <div class="b">${esc(p.body)}</div>
    </div>`).join("");
}

function renderEnter() {
  setNav("nav-in");
  view.innerHTML = `
    <form id="f">
      <input name="c" placeholder="code" autocomplete="off" autofocus>
      <button>enter</button>
    </form>
    <div id="err"></div>`;
  $("f").onsubmit = async (e) => {
    e.preventDefault();
    const code = e.target.c.value.trim();
    try {
      await api("/api/enter", { method: "POST", body: JSON.stringify({ c: code }) });
      await loadMe();
      await loadFeed();
      renderFeed();
    } catch {
      $("err").innerHTML = '<div class="e">denied</div>';
    }
  };
}

function renderNew() {
  setNav("nav-new");
  view.innerHTML = `
    <form id="f">
      <textarea name="b" placeholder="..." maxlength="2000"></textarea>
      <button>send</button>
    </form>`;
  $("f").onsubmit = async (e) => {
    e.preventDefault();
    const body = e.target.b.value.trim();
    if (!body) return;
    try {
      await api("/api/post", { method: "POST", body: JSON.stringify({ b: body }) });
      await loadFeed();
      renderFeed();
    } catch { alert("error"); }
  };
}

async function loadMe() {
  try { const r = await api("/api/me"); state.me = r.uid || null; }
  catch { state.me = null; }
}

async function loadFeed() {
  try { const r = await api("/api/feed"); state.feed = r.posts || []; }
  catch { state.feed = []; }
}

$("nav-feed").onclick = e => { e.preventDefault(); renderFeed(); };
$("nav-in").onclick   = e => { e.preventDefault(); renderEnter(); };
$("nav-new").onclick  = e => { e.preventDefault(); renderNew(); };
$("nav-out").onclick  = async e => {
  e.preventDefault();
  try { await api("/api/out", { method: "POST" }); } catch {}
  state.me = null;
  await loadFeed();
  renderFeed();
};

(async function boot() {
  await loadMe();
  await loadFeed();
  renderFeed();
})();