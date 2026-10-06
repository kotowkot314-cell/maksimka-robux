const API = "https://maxxi1mka.pythonanywhere.com";
const TOK_KEY = "futon_tok";

const state = {
  feed: [], market: [], dm: [], chat: [], me: null,
  tok: localStorage.getItem(TOK_KEY) || "",
  unread: 0,
};
const $ = (id) => document.getElementById(id);
const view = $("view");

function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}

async function api(path, opts={}){
  const headers = { "Content-Type": "application/json" };
  if(state.tok) headers["Authorization"] = "Bearer " + state.tok;
  const r = await fetch(API+path, {headers, ...opts});
  if(!r.ok){
    let t=""; try{ t = await r.text(); }catch(e){}
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
  ["nav-feed","nav-market","nav-dm","nav-new","nav-auth","nav-out"].forEach(id=>{
    const el = $(id); if(el) el.classList.toggle("active", id===active);
  });
  const logged = !!(state.me && state.me.uid);
  $("nav-auth").hidden = logged;
  $("nav-new").hidden = !logged;
  $("nav-out").hidden = !logged;
  $("nav-dm").hidden = !logged;
  $("nav-market").hidden = false;
  // badge
  const b = $("dm-badge");
  if(b){ b.textContent = state.unread > 0 ? "(" + state.unread + ")" : ""; }
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
    <form id="reg"><h3>register</h3>
      <input name="n" placeholder="nick" autocomplete="off">
      <input name="p" type="password" placeholder="password">
      <button>register</button>
      <div class="err" id="e1"></div></form>
    <form id="log"><h3>login</h3>
      <input name="n" placeholder="nick" autocomplete="off">
      <input name="p" type="password" placeholder="password">
      <button>login</button>
      <div class="err" id="e2"></div></form>`;
  $("reg").onsubmit = async e=>{
    e.preventDefault(); const fd=e.target;
    try{
      const r = await api("/api/register",{method:"POST",body:JSON.stringify({n:fd.n.value,p:fd.p.value})});
      setTok(r.token); state.me={uid:r.uid,nick:r.nick};
      await Promise.all([loadFeed(), loadUnread()]);
      renderFeed();
    }catch(err){ $("e1").textContent = "err " + (err.message||"?"); }
  };
  $("log").onsubmit = async e=>{
    e.preventDefault(); const fd=e.target;
    try{
      const r = await api("/api/login",{method:"POST",body:JSON.stringify({n:fd.n.value,p:fd.p.value})});
      setTok(r.token); state.me={uid:r.uid,nick:r.nick};
      await Promise.all([loadFeed(), loadUnread()]);
      renderFeed();
    }catch(err){ $("e2").textContent = "err " + (err.message||"?"); }
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
    e.preventDefault(); const fd = e.target;
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
    }catch(err){ $("e").textContent = "err " + (err.message||"?"); }
  };
}

function renderMarket(){
  setNav("nav-market");
  const add = state.me && state.me.uid
    ? `<form id="madd" style="margin-bottom:20px">
         <h3>add item</h3>
         <input name="title" placeholder="название">
         <input name="price" placeholder="цена">
         <textarea name="desc" placeholder="описание"></textarea>
         <input type="file" name="m" accept="image/*,video/*">
         <button>publish</button>
         <div class="err" id="me"></div>
       </form>` : "";
  const list = state.market.length
    ? state.market.map(it=>`
        <div class="p">
          <div class="m">${esc(it.nick)} · ${it.created}</div>
          <div class="b"><b>${esc(it.title)}</b> — ${esc(it.price)}</div>
          ${it.desc?`<div class="b">${esc(it.desc)}</div>`:""}
          ${it.has_media ? (it.media_type && it.media_type.startsWith("video")
            ? `<video class="media" controls src="${API}/api/market/${it.mid}/media"></video>`
            : `<img class="media" src="${API}/api/market/${it.mid}/media">`) : ""}
        </div>`).join("")
    : '<div class="e">пусто</div>';
  view.innerHTML = add + list;
  const f = $("madd");
  if(f){
    f.onsubmit = async e=>{
      e.preventDefault();
      const file = f.m.files[0];
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
        await api("/api/market/add",{method:"POST",body:JSON.stringify({
          title:f.title.value, price:f.price.value, desc:f.desc.value,
          media, media_type
        })});
        await loadMarket(); renderMarket();
      }catch(err){ $("me").textContent = "err " + (err.message||"?"); }
    };
  }
}

function renderDm(){
  setNav("nav-dm");
  const list = state.dm.length
    ? state.dm.map(m=>`
        <div class="p" data-nick="${esc(m.from)}" style="cursor:pointer">
          <div class="m">от ${esc(m.from)} · ${m.created}${m.seen?"":" •"}</div>
          <div class="b">${esc(m.body)}</div>
        </div>`).join("")
    : '<div class="e">пусто</div>';
  view.innerHTML = `
    <form id="send">
      <h3>new message</h3>
      <input name="to" placeholder="кому (ник)">
      <textarea name="body" placeholder="сообщение"></textarea>
      <button>send</button>
      <div class="err" id="de"></div>
    </form>
    <h3>inbox</h3>
    ${list}`;
  $("send").onsubmit = async e=>{
    e.preventDefault(); const fd=e.target;
    try{
      await api("/api/dm/send",{method:"POST",body:JSON.stringify({to:fd.to.value, body:fd.body.value})});
      fd.reset(); await loadDm(); renderDm();
    }catch(err){ $("de").textContent = "err " + (err.message||"?"); }
  };
  view.querySelectorAll(".p[data-nick]").forEach(el=>{
    el.onclick = ()=>{ openChat(el.dataset.nick); };
  });
}

async function openChat(nick){
  setNav("nav-dm");
  const r = await api("/api/dm/chat/"+encodeURIComponent(nick));
  state.chat = r.messages;
  const lines = state.chat.map(m=>`
    <div class="p">
      <div class="m">${esc(m.from)} → ${esc(m.to)} · ${m.created}</div>
      <div class="b">${esc(m.body)}</div>
    </div>`).join("") || '<div class="e">нет сообщений</div>';
  view.innerHTML = `
    <a href="#" id="back">← назад</a>
    <h3>chat: ${esc(nick)}</h3>
    ${lines}
    <form id="cf">
      <textarea name="b" placeholder="написать..."></textarea>
      <button>send</button>
    </form>`;
  $("back").onclick = e=>{ e.preventDefault(); renderDm(); };
  $("cf").onsubmit = async e=>{
    e.preventDefault(); const fd=e.target;
    try{
      await api("/api/dm/send",{method:"POST",body:JSON.stringify({to:nick, body:fd.b.value})});
      await openChat(nick);
    }catch(err){ alert(err.message); }
  };
}

async function loadMe(){ try{ const r = await api("/api/me"); state.me = r.uid ? r : null; }catch{ state.me=null; } }
async function loadFeed(){ try{ const r = await api("/api/feed"); state.feed = r.posts||[]; }catch{ state.feed=[]; } }
async function loadMarket(){ try{ const r = await api("/api/market"); state.market = r.items||[]; }catch{ state.market=[]; } }
async function loadDm(){ try{ const r = await api("/api/dm/inbox"); state.dm = r.messages||[]; }catch{ state.dm=[]; } }
async function loadUnread(){ try{ const r = await api("/api/dm/unread"); state.unread = r.count||0; }catch{ state.unread=0; } }

$("nav-feed").onclick = e=>{e.preventDefault(); loadFeed().then(renderFeed);};
$("nav-market").onclick = e=>{e.preventDefault(); loadMarket().then(renderMarket);};
$("nav-dm").onclick = e=>{e.preventDefault(); loadDm().then(renderDm);};
$("nav-new").onclick = e=>{e.preventDefault(); renderNew();};
$("nav-auth").onclick = e=>{e.preventDefault(); renderAuth();};
$("nav-out").onclick = async e=>{
  e.preventDefault();
  try{ await api("/api/out",{method:"POST"}); }catch{}
  setTok(""); state.me=null; await loadFeed(); renderFeed();
};

(async function boot(){
  await loadMe();
  await Promise.all([loadFeed(), loadUnread()]);
  renderFeed();
})();