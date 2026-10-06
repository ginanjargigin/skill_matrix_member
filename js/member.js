window.MemberManager={
  editingId:null,

  getMember(id){
    return (AppData.data.members||[]).find(member=>member.id===id)||null;
  },

  openAddModal(){
    this.editingId=null;

    document.getElementById("memberModalTitle").textContent="Tambah Member";
    document.getElementById("memberForm").reset();
    document.getElementById("memberEditId").value="";
    document.getElementById("photoPreview").textContent="👤";

    this.renderSkillFields({});
    document.getElementById("memberModal").classList.remove("hidden");

    setTimeout(()=>document.getElementById("newId").focus(),50);
  },

  openEditModal(id){
    const member=this.getMember(id);
    if(!member) return;

    this.editingId=id;

    document.getElementById("memberModalTitle").textContent="Edit Member";
    document.getElementById("memberEditId").value=id;
    document.getElementById("newId").value=member.id;
    document.getElementById("newName").value=member.name;
    document.getElementById("newStatus").value=member.status||"PERMANENT";

    if(member.photoUrl){
      document.getElementById("photoPreview").innerHTML=`<img src="${UI.esc(member.photoUrl)}" alt="">`;
    }else{
      document.getElementById("photoPreview").textContent=UI.initials(member.name);
    }

    this.renderSkillFields(member.skills||{});
    document.getElementById("memberModal").classList.remove("hidden");
  },

  closeModal(){
    document.getElementById("memberModal").classList.add("hidden");
    this.editingId=null;
  },

  renderSkillFields(skills){
    const container=document.getElementById("memberSkillFields");
    const groups=[];

    Object.entries(AppData.data.operations||{}).forEach(([lineId,operations])=>{
      if(!operations.length) return;

      const line=LineManager.getLine(lineId);
      if(!line) return;

      groups.push(`
        <div class="skill-group">
          <div class="skill-group-title">
            <strong>${UI.esc(line.name)}</strong>
            <span>Update level skill terbaru</span>
          </div>

          <div class="skill-edit-grid">
            ${operations.map(operation=>{
              const value=Number(skills[operation.name]||0);

              return `
                <label>
                  ${UI.esc(operation.name)}
                  <select class="skill-input" data-operation="${UI.esc(operation.name)}">
                    <option value="0" ${value===0?"selected":""}>0 — Belum</option>
                    <option value="0.1" ${value===0.1?"selected":""}>0.1 — Training</option>
                    <option value="0.2" ${value===0.2?"selected":""}>0.2 — Training</option>
                    <option value="1" ${value===1?"selected":""}>1 — Qualified</option>
                  </select>
                </label>`;
            }).join("")}
          </div>
        </div>`;
    });

    container.innerHTML=groups.length
      ? groups.join("")
      : `<div class="ranking-empty"><strong>Belum ada operation</strong><span>Skill dapat diedit setelah line memiliki operation.</span></div>`;
  },

  collectSkills(){
    const skills={};

    document.querySelectorAll(".skill-input").forEach(input=>{
      skills[input.dataset.operation]=Number(input.value);
    });

    return skills;
  },

  save(event){
    event.preventDefault();

    const id=document.getElementById("newId").value.trim().toUpperCase();
    const name=document.getElementById("newName").value.trim();
    const status=document.getElementById("newStatus").value;
    const file=document.getElementById("photoInput").files[0];

    if(!id||!name){
      UI.toast("No Reg dan nama wajib diisi.");
      return;
    }

    const duplicate=AppData.data.members.some(member=>
      member.id===id && member.id!==this.editingId
    );

    if(duplicate){
      UI.toast("No Reg sudah digunakan.");
      return;
    }

    const finish=photo=>{
      if(this.editingId){
        const member=this.getMember(this.editingId);
        if(!member) return;

        member.id=id;
        member.name=name;
        member.status=status;
        member.skills=this.collectSkills();

        if(photo!==null) member.photoUrl=photo;

        UI.toast("Data member dan skill berhasil diperbarui.");
      }else{
        AppData.data.members.push({
          id,
          name,
          status,
          availability:"available",
          photoUrl:photo||"",
          skills:this.collectSkills()
        });

        UI.toast("Member berhasil ditambahkan.");
      }

      Storage.save();
      this.closeModal();
      document.getElementById("memberForm").reset();
      document.getElementById("photoPreview").textContent="👤";
      App.renderAll();
    };

    if(file){
      if(file.size>1024*1024){
        UI.toast("Foto maksimal 1 MB sebelum diproses.");
        return;
      }

      const reader=new FileReader();
      reader.onload=()=>finish(reader.result);
      reader.readAsDataURL(file);
    }else{
      finish(this.editingId?null:"");
    }
  }
};