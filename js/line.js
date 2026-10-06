window.LineManager={
  selectedLineId:null,

  getLine(id){
    return (AppData.data.lines||[]).find(line=>line.id===id)||null;
  },

  getOperations(lineId){
    return (AppData.data.operations||{})[lineId]||[];
  },

  selectLine(lineId){
    this.selectedLineId=lineId;
    App.go("dashboard");
    this.renderDashboardRanking();
    this.renderLineList();
  },

  openAddModal(){
    document.getElementById("lineModalTitle").textContent="Tambah Line";
    document.getElementById("lineForm").reset();
    document.getElementById("lineId").value="";
    document.getElementById("lineModal").classList.remove("hidden");
    setTimeout(()=>document.getElementById("lineName").focus(),50);
  },

  closeModal(){
    document.getElementById("lineModal").classList.add("hidden");
  },

  save(event){
    event.preventDefault();

    const name=document.getElementById("lineName").value.trim();
    const standardMembers=Math.max(0,Number(document.getElementById("lineStandard").value||0));
    const id=document.getElementById("lineId").value;

    if(!name){
      UI.toast("Nama line wajib diisi.");
      return;
    }

    const duplicate=AppData.data.lines.some(line=>
      line.name.toLowerCase()===name.toLowerCase() && line.id!==id
    );

    if(duplicate){
      UI.toast("Nama line sudah ada.");
      return;
    }

    if(id){
      const line=this.getLine(id);

      if(line){
        line.name=name;
        line.standardMembers=standardMembers;
      }

      UI.toast("Line berhasil diperbarui.");
    }else{
      const newId="LINE-"+String(Date.now()).slice(-6);

      AppData.data.lines.push({
        id:newId,
        name,
        standardMembers
      });

      AppData.data.operations[newId]=[];
      this.selectedLineId=newId;
      UI.toast("Line berhasil ditambahkan.");
    }

    Storage.save();
    this.closeModal();
    App.renderAll();
  },

  openEditModal(id){
    const line=this.getLine(id);
    if(!line) return;

    document.getElementById("lineModalTitle").textContent="Edit Line";
    document.getElementById("lineId").value=line.id;
    document.getElementById("lineName").value=line.name;
    document.getElementById("lineStandard").value=line.standardMembers||0;
    document.getElementById("lineModal").classList.remove("hidden");

    setTimeout(()=>document.getElementById("lineName").focus(),50);
  },

  remove(id){
    const line=this.getLine(id);
    if(!line) return;

    const operationCount=this.getOperations(id).length;

    const message=operationCount
      ? `Hapus line "${line.name}" beserta ${operationCount} operation-nya dari prototype?`
      : `Hapus line "${line.name}"?`;

    if(!confirm(message)) return;

    AppData.data.lines=AppData.data.lines.filter(item=>item.id!==id);
    delete AppData.data.operations[id];

    if(this.selectedLineId===id){
      this.selectedLineId=AppData.data.lines[0]?.id||null;
    }

    Storage.save();
    App.renderAll();
    UI.toast("Line berhasil dihapus.");
  },

  renderLineList(){
    const container=document.getElementById("lineList");
    if(!container) return;

    const lines=AppData.data.lines||[];

    if(!lines.length){
      container.innerHTML=`<div class="empty">Belum ada line. Tambahkan line terlebih dahulu.</div>`;
      return;
    }

    container.innerHTML=lines.map(line=>{
      const active=this.selectedLineId===line.id?" line-row-active":"";
      const operations=this.getOperations(line.id);

      return `
        <div class="line-row${active}">
          <button class="line-select" onclick="LineManager.selectLine('${line.id}')">
            <span>
              <strong>${UI.esc(line.name)}</strong>
              <small>Standar ${line.standardMembers} member • ${operations.length} operation</small>
            </span>
            <span class="line-arrow">›</span>
          </button>
          <div class="line-actions">
            <button class="icon-btn" title="Edit line" onclick="LineManager.openEditModal('${line.id}')">Edit</button>
            <button class="icon-btn danger" title="Hapus line" onclick="LineManager.remove('${line.id}')">Hapus</button>
          </div>
        </div>`;
    }).join("");
  },

  rankMembers(lineId){
    const operations=this.getOperations(lineId);

    if(!operations.length) return [];

    return (AppData.data.members||[])
      .filter(member=>member.availability==="available")
      .map(member=>{
        const skills=operations.map(operation=>({
          name:operation.name,
          value:Number((member.skills||{})[operation.name]||0)
        }));

        const best=skills.reduce(
          (winner,current)=>current.value>winner.value?current:winner,
          {name:"-",value:0}
        );

        const average=skills.length
          ? skills.reduce((sum,skill)=>sum+skill.value,0)/skills.length
          : 0;

        return {
          ...member,
          bestSkill:best.name,
          bestValue:best.value,
          average
        };
      })
      .filter(member=>member.bestValue>0)
      .sort((a,b)=>
        b.bestValue-a.bestValue ||
        b.average-a.average ||
        a.name.localeCompare(b.name)
      );
  },

  renderDashboardRanking(){
    const title=document.getElementById("rankingLineName");
    const subtitle=document.getElementById("rankingLineSubtitle");
    const container=document.getElementById("candidatePreview");

    if(!container) return;

    const line=this.getLine(this.selectedLineId);

    if(!line){
      title.textContent="Pilih Line";
      subtitle.textContent="Klik nama line untuk melihat ranking skill";
      container.innerHTML=`<div class="empty">Pilih line di sebelah kiri.</div>`;
      return;
    }

    title.textContent=`Ranking Skill • ${UI.esc(line.name)}`;
    subtitle.textContent="Member tersedia dengan skill tertinggi";

    const operations=this.getOperations(line.id);
    const ranked=this.rankMembers(line.id).slice(0,5);

    if(!operations.length){
      container.innerHTML=`
        <div class="ranking-empty">
          <strong>Belum ada data operation</strong>
          <span>Tambahkan operation dan skill untuk line ${UI.esc(line.name)} agar ranking dapat dihitung.</span>
        </div>`;
      return;
    }

    if(!ranked.length){
      container.innerHTML=`
        <div class="ranking-empty">
          <strong>Belum ada skill yang memenuhi</strong>
          <span>Member tersedia untuk line ini belum memiliki skill di atas 0.</span>
        </div>`;
      return;
    }

    container.innerHTML=ranked.map((member,index)=>`
      <div class="ranking-row">
        <span class="ranking-number">${index+1}</span>
        ${UI.photo(member)}
        <div class="ranking-info">
          <strong>${UI.esc(member.name)}</strong>
          <small>${UI.esc(member.id)} • ${UI.esc(member.bestSkill)}</small>
        </div>
        <div class="ranking-score">
          <strong>${Math.round(member.bestValue*100)}%</strong>
          <span>Skill tertinggi</span>
        </div>
      </div>`
    ).join("");
  }
};