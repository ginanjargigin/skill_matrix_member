window.App={
  async init(){
    await AppData.load();
    this.bindNav();
    this.bindForms();
    this.populateSelectors();
    this.renderAll();
  },

  bindNav(){
    document.querySelectorAll("[data-page]").forEach(button=>{
      button.addEventListener("click",()=>this.go(button.dataset.page));
    });

    document.getElementById("mobileMenu").onclick=()=>{
      document.getElementById("sidebar").classList.toggle("open");
    };
  },

  go(page){
    document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
    document.getElementById("page-"+page).classList.add("active");

    document.querySelectorAll(".nav-item").forEach(n=>{
      n.classList.toggle("active",n.dataset.page===page);
    });

    const titles={
      dashboard:"Dashboard",
      replacement:"Replacement",
      members:"Member",
      lines:"Line",
      history:"Riwayat Replacement"
    };

    document.getElementById("pageTitle").textContent=titles[page];
    document.getElementById("sidebar").classList.remove("open");
  },

  bindForms(){
    document.getElementById("replaceLine").onchange=()=>this.populateOperations();
    document.getElementById("searchCandidate").onclick=()=>Replacement.render();
    document.getElementById("candidateSearch").oninput=()=>Replacement.render();

    document.getElementById("memberSearch").oninput=()=>this.renderMembers();
    document.getElementById("memberStatus").onchange=()=>this.renderMembers();

    document.getElementById("addMemberBtn").onclick=()=>MemberManager.openAddModal();
    document.getElementById("closeModal").onclick=()=>MemberManager.closeModal();
    document.getElementById("cancelModal").onclick=()=>MemberManager.closeModal();
    document.getElementById("photoInput").onchange=e=>this.previewPhoto(e);
    document.getElementById("memberForm").onsubmit=e=>MemberManager.save(e);

    document.getElementById("addLineBtn").onclick=()=>LineManager.openAddModal();
    document.getElementById("addLineBtnPage").onclick=()=>LineManager.openAddModal();
    document.getElementById("closeLineModal").onclick=()=>LineManager.closeModal();
    document.getElementById("cancelLineModal").onclick=()=>LineManager.closeModal();
    document.getElementById("lineForm").onsubmit=e=>LineManager.save(e);
  },

  populateSelectors(){
    const select=document.getElementById("replaceLine");

    select.innerHTML=(AppData.data.lines||[]).map(line=>
      `<option value="${line.id}">${UI.esc(line.name)}</option>`
    ).join("");

    this.populateOperations();
  },

  populateOperations(){
    const lineId=document.getElementById("replaceLine").value;
    const operations=(AppData.data.operations||{})[lineId]||[];

    document.getElementById("replaceOperation").innerHTML=operations.length
      ? operations.map(operation=>
          `<option value="${UI.esc(operation.name)}">${UI.esc(operation.name)}</option>`
        ).join("")
      : `<option value="">Belum ada operation</option>`;

    Replacement.render();
  },

  renderAll(){
    this.renderKpi();
    this.renderLines();
    this.renderMembers();
    this.renderLineTable();
    this.renderHistory();
    Replacement.render();

    if(!LineManager.selectedLineId){
      LineManager.selectedLineId=AppData.data.lines?.[0]?.id || null;
    }

    LineManager.renderLineList();
    LineManager.renderDashboardRanking();
  },

  renderKpi(){
    const data=AppData.data;
    const memberCount=(data.members||[]).length;
    const available=(data.members||[]).filter(member=>member.availability==="available").length;
    const assigned=(data.assignments||[]).length;
    const lineCount=(data.lines||[]).length;

    document.getElementById("kpiGrid").innerHTML=[
      ["Total Member",memberCount,"👥"],
      ["Siap Replace",available,"✓"],
      ["Sedang Ditugaskan",assigned,"↗"],
      ["Total Line",lineCount,"▦"]
    ].map(item=>
      `<div class="kpi"><div class="label">${item[2]} ${item[0]}</div><div class="value">${item[1]}</div></div>`
    ).join("");
  },

  renderLines(){
    LineManager.renderLineList();
  },

  renderMembers(){
    const query=document.getElementById("memberSearch").value.toLowerCase();
    const status=document.getElementById("memberStatus").value;

    const rows=(AppData.data.members||[]).filter(member=>
      (!query ||
        member.name.toLowerCase().includes(query) ||
        member.id.toLowerCase().includes(query)) &&
      (!status || member.status===status)
    );

    document.getElementById("memberTable").innerHTML=rows.length
      ? `<div class="table-wrap"><table class="table">
          <thead><tr><th>Member</th><th>Status</th><th>Ketersediaan</th><th>Skill</th><th>Aksi</th></tr></thead>
          <tbody>
          ${rows.map(member=>`
            <tr>
              <td><div class="member-cell">${UI.photo(member)}
                <div><strong>${UI.esc(member.name)}</strong><div class="muted">${UI.esc(member.id)}</div></div>
              </div></td>
              <td>${UI.esc(member.status)}</td>
              <td><span class="pill ${member.availability==="available"?"green":"red"}">
                ${member.availability==="available"?"Tersedia":"Tidak tersedia"}
              </span></td>
              <td><div class="skill-mini">
                ${Object.entries(member.skills||{}).map(([key,value])=>
                  `<span class="skill-dot">${UI.esc(key)}: ${value}</span>`
                ).join("") || "-"}
              </div></td>
              <td><button class="primary edit-member-btn" onclick="MemberManager.openEditModal('${member.id}')">Edit</button></td>
            </tr>`).join("")}
          </tbody></table></div>`
      : `<div class="empty">Member tidak ditemukan.</div>`;
  },

  renderLineTable(){
    const rows=AppData.data.lines||[];

    document.getElementById("linesTable").innerHTML=rows.length
      ? `<div class="table-wrap"><table class="table">
          <thead><tr><th>Line</th><th>Member Standar</th><th>Operation</th><th>Aksi</th></tr></thead>
          <tbody>
          ${rows.map(line=>{
            const operationCount=(AppData.data.operations?.[line.id]||[]).length;

            return `<tr>
              <td><strong>${UI.esc(line.name)}</strong></td>
              <td>${line.standardMembers}</td>
              <td>${operationCount}</td>
              <td>
                <button class="secondary" onclick="LineManager.openEditModal('${line.id}')">Edit</button>
                <button class="secondary danger-text" onclick="LineManager.remove('${line.id}')">Hapus</button>
              </td>
            </tr>`;
          }).join("")}
          </tbody></table></div>`
      : `<div class="empty">Belum ada line.</div>`;
  },

  renderHistory(){
    const rows=AppData.data.assignments||[];

    document.getElementById("historyTable").innerHTML=rows.length
      ? `<div class="table-wrap"><table class="table">
          <thead><tr><th>Tanggal</th><th>Member</th><th>Line</th><th>Operation</th><th>Alasan</th></tr></thead>
          <tbody>
          ${rows.slice().reverse().map(item=>{
            const line=(AppData.data.lines.find(line=>line.id===item.lineId)||{}).name||item.lineId;

            return `<tr>
              <td>${new Date(item.date).toLocaleString("id-ID")}</td>
              <td><strong>${UI.esc(item.memberName)}</strong></td>
              <td>${UI.esc(line)}</td>
              <td>${UI.esc(item.operation||"-")}</td>
              <td>${UI.esc(item.reason)}</td>
            </tr>`;
          }).join("")}
          </tbody></table></div>`
      : `<div class="empty">Belum ada riwayat replacement.</div>`;
  },

  previewPhoto(event){
    const file=event.target.files[0];
    if(!file) return;

    if(file.size>1024*1024){
      UI.toast("Foto maksimal 1 MB sebelum diproses.");
      event.target.value="";
      return;
    }

    const reader=new FileReader();
    reader.onload=()=>{
      document.getElementById("photoPreview").innerHTML=`<img src="${reader.result}" alt="">`;
    };
    reader.readAsDataURL(file);
  }
};

document.addEventListener("DOMContentLoaded",()=>App.init());