const API = "https://maxxi1mka.pythonanywhere.com";
const TOK_KEY = "futon_tok";

const state = { feed: [], me: null, tok: localStorage.getItem(TOK_KEY) || "" };
const $ = (id) => document.getElementById(id);
const view = $("view");

function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}

async function api(path, opts={}){
  const headers = { "Content-Type": "application/json" };
  if(state.tok) headers["Authorization"] = "Bearer " + state.tok;
  const r = await fetch(API+path, {headers, ...opts});
  if(!r.ok){
    let t = "";
    try{ t = await r.text(); }catch(e){}
    throw new Error(r.status + " " + t.slice(0,140));
  }
  return r.json();
}

function setTok(t){
  state.tok = t || "";
  if(t) localStorage.setItem(TOK_KEY, t);
  else localStorage.removeItem(TOK_KEY);
}

function setNav(active){
  ["nav-feed","nav-auth","nav-new","nav-out"].forEach(id=>$(id).classList.toggle("active", id===active));
  const logged = !!state.me && !!state.me.uid;
  $("nav-auth").hidden = logged;
  $("nav-new").hidden = !logged;
  $("nav-out").hidden = !logged;
}

function renderFeed(){
  setNav("nav-feed");
  if(!state.feed.length){ view.innerHTML = '<div class="e">∅</div>'; return; }
  view.innerHTML = state.feed.map(p=>`
    <div class="p">
      <div class="m">${esc(p.nick||p.uid.slice(0,6))} · ${p.created}</div>
      ${p.body?`<div class="b">${esc(p.body)}</div>`:""}
      ${p.has_media ? (p.media_type && p.media_type.startsWith("video")
          ? `<video class="media" controls src="${API}/api/media/${p.pid}"></video>`
          : `<img class="media" src="${API}/api/media/${p.pid}">`) : ""}
    </div>`).join("");
}

function renderAuth(){
  setNav("nav-auth");
  view.innerHTML = `
    <form id="reg">
      <h3>register</h3>
      <input name="n" placeholder="nick" autocomplete="off">
      <input name="p" type="password" placeholder="password">
      <button>register</button>
      <div class="err" id="e1"></div>
    </form>
    <form id="log">
      <h3>login</h3>
      <input name="n" placeholder="nick" autocomplete="off">
      <input name="p" type="password" placeholder="password">
      <button>login</button>
      <div class="err" id="e2"></div>
    </form>`;
  $("reg").onsubmit = async e=>{
    e.preventDefault();
    const fd=e.target;
    try{
      const r = await api("/api/register",{method:"POST",body:JSON.stringify({n:fd.n.value,p:fd.p.value})});
      setTok(r.token);
      state.me = {uid:r.uid, nick:r.nick};
      await loadFeed(); renderFeed();
    }catch(err){ $("e1").textContent = "err " + (err.message||"?"); console.log("register failed:", err); }
  };
  $("log").onsubmit = async e=>{
    e.preventDefault();
    const fd=e.target;
    try{
      const r = await api("/api/login",{method:"POST",body:JSON.stringify({n:fd.n.value,p:fd.p.value})});
      setTok(r.token);
      state.me = {uid:r.uid, nick:r.nick};
      await loadFeed(); renderFeed();
    }catch(err){ $("e2").textContent = "err " + (err.message||"?"); console.log("login failed:", err); }
  };
}

function renderNew(){
  setNav("nav-new");
  view.innerHTML = `
    <form id="f">
      <textarea name="b" placeholder="..." maxlength="2000"></textarea>
      <input type="file" name="m" accept="image/*,video/*">
      <button>send</button>
      <div class="err" id="e"></div>
    </form>`;
  $("f").onsubmit = async e=>{
    e.preventDefault();
    const fd = e.target;
    const file = fd.m.files[0];
    let media=null, media_type=null;
    if(file){
      media = await new Promise(res=>{
        const fr = new FileReader();
        fr.onload = ()=>res(fr.result.split(",")[1]);
        fr.readAsDataURL(file);
      });
      media_type = file.type;
    }
    try{
      await api("/api/post",{method:"POST",body:JSON.stringify({b:fd.b.value, media, media_type})});
      await loadFeed(); renderFeed();
    }catch(err){
      $("e").textContent = "err " + (err.message||"?");
      console.log("post failed:", err);
    }
  };
}

async function loadMe(){
  try{ const r = await api("/api/me"); state.me = r.uid ? r : null; }
  catch{ state.me = null; }
}
async function loadFeed(){
  try{ const r = await api("/api/feed"); state.feed = r.posts || []; }
  catch{ state.feed = []; }
}

$("nav-feed").onclick=e=>{e.preventDefault();renderFeed();};
$("nav-auth").onclick=e=>{e.preventDefault();renderAuth();};
$("nav-new").onclick=e=>{e.preventDefault();renderNew();};
$("nav-out").onclick=async e=>{
  e.preventDefault();
  try{ await api("/api/out",{method:"POST"}); }catch{}
  setTok("");
  state.me=null; await loadFeed(); renderFeed();
};

(async function boot(){
  await loadMe();
  await loadFeed();
  renderFeed();
})();