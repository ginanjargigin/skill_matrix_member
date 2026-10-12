window.MemberManager = (() => {

  let getState = null;
  let refresh = null;


  const $ = id =>
    document.getElementById(id);


  /* =====================================================
     CONFIGURE
     ===================================================== */

  function configure(options = {}) {

    getState = options.getState || null;

    refresh = options.refresh || null;

  }


  function state() {

    return getState
      ? getState()
      : null;

  }


  /* =====================================================
     ESCAPE HTML
     ===================================================== */

  function esc(value) {

    return String(value ?? "")
      .replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      }[char]));

  }


  /* =====================================================
     TOAST
     ===================================================== */

  function toast(message) {

    if (
      window.App &&
      typeof window.App.toast === "function"
    ) {

      window.App.toast(message);

      return;

    }

  }


  /* =====================================================
     POPULATE LINE
     ===================================================== */

  function populateLines(selected = "") {

    const s = state();

    const select =
      $("memberHomeLine");

    if (!select) {
      return;
    }


    const lines =
      (s?.lines || [])
        .filter(line => line.active !== false);


    select.innerHTML =
      `<option value="">
        Belum ditentukan
      </option>` +

      lines.map(line => {

        const area =
          line.area
            ? ` — ${esc(line.area)}`
            : "";

        return `
          <option value="${esc(line.id)}">
            ${esc(line.name)}${area}
          </option>
        `;

      }).join("");


    select.value = selected || "";

  }

  function renderMemberSkills(memberId = null) {
  const s = state();
  const container = $("memberSkillEditor");

  if (!s || !container) return;

  const activeStations = s.stations
    .filter(station => station.active !== false)
    .sort((a, b) => {
      const lineA = s.lines.find(
        line => String(line.id) === String(a.line_id)
      )?.name || "";

      const lineB = s.lines.find(
        line => String(line.id) === String(b.line_id)
      )?.name || "";

      return lineA.localeCompare(lineB) ||
        String(a.name).localeCompare(String(b.name));
    });

  if (!activeStations.length) {
    container.innerHTML = `
      <div class="empty">
        Belum ada station aktif. Buat station terlebih dahulu
        di menu Master Line & Station.
      </div>
    `;
    return;
  }

  container.innerHTML = activeStations.map(station => {
    const line = s.lines.find(
      item => String(item.id) === String(station.line_id)
    );

    const skill = s.skills.find(item =>
      String(item.member_id) === String(memberId) &&
      String(item.station_id) === String(station.id)
    );

    const level = Number(skill?.skill_level || 0);

    return `
      <div class="member-skill-row">
        <div class="member-skill-info">
          <strong>${esc(station.name)}</strong>
          <small>${esc(line?.name || "-")}</small>
        </div>

        <label class="member-skill-level">
          <span>Level</span>
          <select
            data-member-skill="${esc(station.id)}"
            aria-label="Skill ${esc(station.name)}"
          >
            <option value="0" ${level === 0 ? "selected" : ""}>
              0 — Belum bisa
            </option>
            <option value="1" ${level === 1 ? "selected" : ""}>L1 — 25%</option>
            <option value="2" ${level === 2 ? "selected" : ""}>L2 — 50%</option>
            <option value="3" ${level === 3 ? "selected" : ""}>L3 — 75%</option>
            <option value="4" ${level === 4 ? "selected" : ""}>L4 — 82%</option>
            <option value="5" ${level === 5 ? "selected" : ""}>L5 — 92%</option>
            <option value="6" ${level === 6 ? "selected" : ""}>L6 — 100%</option>
          </select>
        </label>
      </div>
    `;
  }).join("");
}

  /* =====================================================
     OPEN ADD
     ===================================================== */

function openAddModal() {
  const form = $("memberForm");
  if (!form) return;

  form.reset();

  $("memberModalTitle").textContent = "Tambah Member + Skill";
  $("memberModalSubtitle").textContent =
    "Lengkapi identitas, line asal, shift, dan skill member.";

  $("memberEditId").value = "";
  $("memberDelete").style.display = "none";

  populateLines();
  renderMemberSkills();

  $("memberModal").classList.add("open");
  setTimeout(() => $("memberName")?.focus(), 80);
}

  /* =====================================================
     OPEN EDIT
     ===================================================== */
function normalizeShift(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ");

  if (["a", "ns", "n/s", "non shift", "nonshift"].includes(normalized)) {
    return "Non Shift";
  }

  if (["b", "red"].includes(normalized)) return "Red";
  if (["c", "white"].includes(normalized)) return "White";

  return value || "";
}
  function openEditModal(id) {
  const s = state();

  const member = s?.members.find(
    item => String(item.id) === String(id)
  );

  if (!member) {
    toast("Data member tidak ditemukan.");
    return;
  }

  $("memberModalTitle").textContent = "Edit Member + Skill";
  $("memberModalSubtitle").textContent =
    "Perbarui data member dan Skill Matrix dalam satu form.";

  $("memberEditId").value = member.id;
  $("memberDelete").style.display = "inline-flex";

  $("memberName").value = member.name || "";
  $("memberStatus").value = member.status || "PERMANENT";
  $("memberShift").value = normalizeShift(member.shift);

  populateLines(member.home_line_id || "");
  renderMemberSkills(member.id);

  $("memberModal").classList.add("open");
}

   /* =====================================================
   DELETE MEMBER
   ===================================================== */

async function removeMember() {

  const s = state();

  if (!s) {

    toast(
      "State aplikasi belum siap."
    );

    return;

  }


  const memberId =
    $("memberEditId").value;


  if (!memberId) {

    toast(
      "Member yang akan dihapus belum dipilih."
    );

    return;

  }


  const member =
    s.members.find(
      item =>
        String(item.id) ===
        String(memberId)
    );


  if (!member) {

    toast(
      "Data member tidak ditemukan."
    );

    return;

  }


 const confirmed = window.confirm(
  `Hapus member "${member.name}"?\n\n` +
  `Data member dan seluruh skill member ini akan dihapus.\n\n` +
  `Tindakan ini tidak dapat dibatalkan.`
);


  if (!confirmed) {
    return;
  }


  const button =
    $("memberDelete");


  if (button) {
    button.disabled = true;
  }


  try {

    /* =================================================
       DEMO
       ================================================= */

    if (
      !SupabaseClient.configured()
    ) {

      s.members =
        s.members.filter(
          item =>
            String(item.id) !==
            String(memberId)
        );


      s.skills =
        s.skills.filter(
          item =>
            String(item.member_id) !==
            String(memberId)
        );


      toast(
        "Demo: member berhasil dihapus."
      );

    }


    /* =================================================
       SUPABASE
       ================================================= */

    else {

      await DB.remove(
        "members",
        memberId
      );


      toast(
        "Member berhasil dihapus."
      );

    }


    closeModal();


    if (
      typeof refresh === "function"
    ) {

      await refresh();

    }


  } catch (error) {

    console.error(
      "Member delete error:",
      error
    );


    /*
      Jika member sudah digunakan
      dalam manpower_changes sebagai
      replacement_member_id, Supabase
      dapat menolak DELETE karena FK.
    */

    const message =
      String(
        error?.message ||
        ""
      ).toLowerCase();


    if (
      message.includes("foreign key") ||
      message.includes("manpower_changes")
    ) {

      toast(
        "Member tidak dapat dihapus karena sudah digunakan dalam riwayat replacement."
      );

    } else {

      toast(
        error?.message ||
        "Gagal menghapus member."
      );

    }

  } finally {

    if (button) {
      button.disabled = false;
    }

  }

}
  
  /* =====================================================
     CLOSE
     ===================================================== */

  function closeModal() {

    $("memberModal")
      ?.classList
      .remove("open");

  }




  /* =====================================================
     SAVE
     ===================================================== */

 
async function save(event) {
  event?.preventDefault();

  const s = state();
  if (!s) {
    toast("State aplikasi belum siap.");
    return;
  }

  const editId = $("memberEditId").value || null;
  const name = $("memberName").value.trim();
  const status = $("memberStatus").value;
  const shift = normalizeShift($("memberShift").value);
  const homeLineId = $("memberHomeLine").value;

  const skillSelects = [
    ...document.querySelectorAll("[data-member-skill]")
  ];

  const skills = skillSelects.map(select => ({
    station_id: select.dataset.memberSkill,
    skill_level: Number(select.value),
    certified: Number(select.value) >= 4
  }));

  if (!name) {
    toast("Nama member wajib diisi.");
    $("memberName").focus();
    return;
  }

  if (!status) {
    toast("Status member wajib dipilih.");
    $("memberStatus").focus();
    return;
  }

  if (!["Non Shift", "Red", "White"].includes(shift)) {
    toast("Shift wajib dipilih.");
    $("memberShift").focus();
    return;
  }

  if (!homeLineId) {
    toast("Line asal wajib dipilih.");
    $("memberHomeLine").focus();
    return;
  }

  if (!skills.length) {
    toast("Skill Matrix belum tersedia. Tambahkan station terlebih dahulu.");
    return;
  }

  if (!skills.some(skill => skill.skill_level >= 1 && skill.skill_level <= 6)) {
    toast("Isi minimal satu skill dengan level 1–6.");
    return;
  }

  const button = $("memberSave");
  if (button) button.disabled = true;

  try {
    const payload = {
      name,
      status,
      shift,
      home_line_id: homeLineId,
      active: true
    };

    let memberId = editId;

    if (!SupabaseClient.configured()) {
      // MODE DEMO
      if (editId) {
        const member = s.members.find(
          item => String(item.id) === String(editId)
        );

        if (!member) throw new Error("Member tidak ditemukan.");

        Object.assign(member, payload);
      } else {
        memberId = "demo-member-" + Date.now();

        s.members.push({
          id: memberId,
          ...payload
        });
      }
    } else {
      // SIMPAN IDENTITAS MEMBER TERLEBIH DAHULU
      let savedMember;

      if (editId) {
        savedMember = await DB.update("members", editId, payload);
      } else {
        savedMember = await DB.insert("members", payload);
      }

      memberId = savedMember?.id || editId;

      if (!memberId) {
        throw new Error("ID member tidak ditemukan setelah penyimpanan.");
      }
    }

    // Simpan Skill Matrix untuk member yang sama.
    for (const skill of skills) {
      const skillPayload = {
        member_id: memberId,
        station_id: skill.station_id,
        skill_level: skill.skill_level,
        certified: skill.certified
      };

      if (!SupabaseClient.configured()) {
        const existing = s.skills.find(item =>
          String(item.member_id) === String(memberId) &&
          String(item.station_id) === String(skill.station_id)
        );

        if (existing) {
          Object.assign(existing, skillPayload);
        } else {
          s.skills.push({
            id: "demo-skill-" + Date.now() + "-" + skill.station_id,
            ...skillPayload
          });
        }
      } else {
        await DB.save("member_skills", skillPayload);
      }
    }

    toast(
      editId
        ? "Data member dan Skill Matrix berhasil diperbarui."
        : "Member dan Skill Matrix berhasil ditambahkan."
    );

    closeModal();

    if (typeof refresh === "function") {
      await refresh();
    }
  } catch (error) {
    console.error("Member + Skill save error:", error);

    toast(
      error?.message ||
      "Gagal menyimpan member dan Skill Matrix."
    );
  } finally {
    if (button) button.disabled = false;
  }
}


  /* =====================================================
     BIND EVENTS
     ===================================================== */

  function bind() {

    $("addMemberBtn")
      ?.addEventListener(
        "click",
        openAddModal
      );


    $("memberCancel")
      ?.addEventListener(
        "click",
        closeModal
      );


    $("memberCancel2")
      ?.addEventListener(
        "click",
        closeModal
      );
    
    $("memberDelete")
  ?.addEventListener(
    "click",
    removeMember
  );

    $("memberForm")
      ?.addEventListener(
        "submit",
        save
      );


    $("memberModal")
      ?.addEventListener(
        "click",
        event => {

          if (
            event.target ===
            $("memberModal")
          ) {

            closeModal();

          }

        }
      );

  }


  return {

    configure,

    bind,

    openAddModal,

    openEditModal,

    removeMember,

    closeModal,

    populateLines

  };

})();
