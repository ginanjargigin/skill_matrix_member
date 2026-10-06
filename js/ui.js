window.UI={
  esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))},
  toast(msg){const e=document.getElementById("toast");e.textContent=msg;e.classList.add("show");clearTimeout(this.t);this.t=setTimeout(()=>e.classList.remove("show"),2200)},
  initials(n){return String(n||"?").split(" ").slice(0,2).map(x=>x[0]).join("").toUpperCase()},
  photo(m){return m.photoUrl?`<img class="member-photo" src="${this.esc(m.photoUrl)}" alt="">`:`<span class="member-photo">${this.initials(m.name)}</span>`}
};