
window.MemberManager = (() => {
  let getState = null;
  let refresh = null;

  let selectedSkillLineIds = new Set();
  let selectedSkillLineId = "";
  let skillDraft = new Map();

  let lineSearchBound = false;
  let skillSearchBound = false;

  const $ = id => document.getElementById(id);

  /* =====================================================
     CONFIGURATION
     ===================================================== */

  function configure(options = {}) {
    getState = options.getState || null;
    refresh = options.refresh || null;
  }

  function state() {
    return getState ? getState() : null;
  }

  /* =====================================================
     HELPERS
     ===================================================== */

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char]));
  }

  function toast(message) {
    if (window.App && typeof window.App.toast === "function") {
      window.App.toast(message);
    }
  }

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

    return String(value || "").trim();
  }

  function getActiveLines() {
    return (state()?.lines || [])
      .filter(line => line.active !== false)
      .sort((a, b) =>
        String(a.name || "").localeCompare(String(b.name || ""))
      );
  }

  function getActiveStations() {
    return (state()?.stations || [])
      .filter(station => station.active !== false);
  }

  function getSkillKey(stationId) {
    return String(stationId);
  }

  function getStoredSkill(memberId, stationId) {
    const s = state();

    return (s?.skills || []).find(skill =>
      String(skill.member_id) === String(memberId || "") &&
      String(skill.station_id) === String(stationId)
    );
  }

  function getSkillLevel(memberId, stationId) {
    const key = getSkillKey(stationId);

    if (skillDraft.has(key)) {
      return Number(skillDraft.get(key)) || 0;
    }

    return Number(
      getStoredSkill(memberId, stationId)?.skill_level || 0
    );
  }

  function rememberVisibleSkills() {
    document.querySelectorAll("[data-member-skill]").forEach(select => {
      skillDraft.set(
        getSkillKey(select.dataset.memberSkill),
        Number(select.value) || 0
      );
    });
  }

  /* =====================================================
     LINE ASAL SEARCH
     ===================================================== */

  function populateLines(selected = "") {
    const s = state();
    if (!s) return;

    const hidden = $("memberHomeLine");
    const search = $("memberHomeLineSearch");
    const results = $("memberHomeLineResults");

    // Kompatibilitas dengan dropdown lama.
    if (!search || !hidden || !results) {
      const select = $("memberHomeLine");
      if (!select) return;

      select.innerHTML =
        '<option value="">Pilih Line Asal</option>' +
        getActiveLines().map(line => `
          <option value="${esc(line.id)}">
            ${esc(line.name)}
          </option>
        `).join("");

      select.value = selected || "";
      return;
    }

    hidden.value = selected || "";

    const selectedLine = getActiveLines().find(
      line => String(line.id) === String(selected)
    );

    search.value = selectedLine?.name || "";
    results.innerHTML = "";
    results.hidden = true;
  }

  function bindHomeLineSearch() {
    const search = $("memberHomeLineSearch");
    const hidden = $("memberHomeLine");
    const results = $("memberHomeLineResults");

    if (!search || !hidden || !results || lineSearchBound) return;

    lineSearchBound = true;

    function renderResults() {
      const query = search.value.trim().toLocaleLowerCase("id-ID");

      const lines = getActiveLines().filter(line =>
        String(line.name || "").toLocaleLowerCase("id-ID").includes(query)
      );

      results.innerHTML = "";

      if (!lines.length) {
        results.innerHTML = `
          <div class="line-search-empty">Line tidak ditemukan.</div>
        `;
        results.hidden = false;
        return;
      }

      lines.slice(0, 30).forEach(line => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "line-search-option";
        button.textContent = line.name;

        button.addEventListener("click", () => {
          hidden.value = line.id;
          search.value = line.name;
          results.hidden = true;
        });

        results.appendChild(button);
      });

      results.hidden = false;
    }

    search.addEventListener("input", () => {
      hidden.value = "";
      renderResults();
    });

    search.addEventListener("focus", renderResults);

    document.addEventListener("click", event => {
      if (!search.contains(event.target) && !results.contains(event.target)) {
        results.hidden = true;
      }
    });
  }

  /* =====================================================
     SKILL MATRIX LINE SEARCH
     Bisa menambahkan beberapa line dalam satu form.
     ===================================================== */

  function bindSkillLineSearch() {
    const search = $("memberSkillLineSearch");
    const results = $("memberSkillLineResults");

    if (!search || !results || skillSearchBound) return;

    skillSearchBound = true;

    function renderResults() {
      const query = search.value.trim().toLocaleLowerCase("id-ID");

      const lines = getActiveLines().filter(line =>
        String(line.name || "").toLocaleLowerCase("id-ID").includes(query) &&
        !selectedSkillLineIds.has(String(line.id))
      );

      results.innerHTML = "";

      if (!lines.length) {
        results.innerHTML = `
          <div class="line-search-empty">
            ${query
              ? "Line tidak ditemukan atau sudah ditambahkan."
              : "Semua line yang cocok sudah ditambahkan."}
          </div>
        `;
        results.hidden = false;
        return;
      }

      lines.slice(0, 30).forEach(line => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "line-search-option";
        button.textContent = `+ ${line.name}`;

        button.addEventListener("click", () => {
          rememberVisibleSkills();

          selectedSkillLineIds.add(String(line.id));
          selectedSkillLineId = String(line.id);

          search.value = "";
          results.hidden = true;

          renderMemberSkills($("memberEditId")?.value || null);
          search.focus();
        });

        results.appendChild(button);
      });

      results.hidden = false;
    }

    search.addEventListener("input", renderResults);
    search.addEventListener("focus", renderResults);

    document.addEventListener("click", event => {
      if (!search.contains(event.target) && !results.contains(event.target)) {
        results.hidden = true;
      }
    });
  }

  /* =====================================================
     RENDER SKILL MATRIX
     Menampilkan seluruh line yang dipilih.
     ===================================================== */

  function renderMemberSkills(memberId = null) {
    const s = state();
    const container = $("memberSkillEditor");

    if (!s || !container) return;

    const selectedLines = getActiveLines().filter(line =>
      selectedSkillLineIds.has(String(line.id))
    );

    if (!selectedLines.length) {
      container.innerHTML = `
        <div class="empty">
          Cari dan pilih satu atau beberapa line untuk menampilkan
          station dan Skill Matrix.
        </div>
      `;
      return;
    }

    container.innerHTML = selectedLines.map(line => {
      const stations = getActiveStations()
        .filter(station => String(station.line_id) === String(line.id))
        .sort((a, b) =>
          String(a.name || "").localeCompare(String(b.name || ""))
        );

      return `
        <section
          class="member-skill-line-group"
          data-skill-line="${esc(line.id)}"
        >
          <div class="member-skill-line-title">
            <div>
              <strong>${esc(line.name)}</strong>
              <small>${stations.length} station</small>
            </div>

            <button
              type="button"
              class="secondary small"
              data-remove-skill-line="${esc(line.id)}"
              aria-label="Hapus line ${esc(line.name)} dari form"
            >Hapus Line</button>
          </div>

          ${
            stations.length
              ? stations.map(station => {
                  const level = getSkillLevel(memberId, station.id);

                  return `
                    <div class="member-skill-row">
                      <div class="member-skill-info">
                        <strong>${esc(station.name)}</strong>
                        <small>
                          ${esc(station.position_name || line.name)}
                        </small>
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
                          <option value="1" ${level === 1 ? "selected" : ""}>
                            L1 — 25%
                          </option>
                          <option value="2" ${level === 2 ? "selected" : ""}>
                            L2 — 50%
                          </option>
                          <option value="3" ${level === 3 ? "selected" : ""}>
                            L3 — 75%
                          </option>
                          <option value="4" ${level === 4 ? "selected" : ""}>
                            L4 — 82%
                          </option>
                          <option value="5" ${level === 5 ? "selected" : ""}>
                            L5 — 92%
                          </option>
                          <option value="6" ${level === 6 ? "selected" : ""}>
                            L6 — 100%
                          </option>
                        </select>
                      </label>
                    </div>
                  `;
                }).join("")
              : `
                <div class="empty">
                  Belum ada station aktif di line ${esc(line.name)}.
                </div>
              `
          }
        </section>
      `;
    }).join("");

    container.querySelectorAll("[data-member-skill]").forEach(select => {
      select.addEventListener("change", () => {
        skillDraft.set(
          getSkillKey(select.dataset.memberSkill),
          Number(select.value) || 0
        );
      });
    });

    container.querySelectorAll("[data-remove-skill-line]").forEach(button => {
      button.addEventListener("click", () => {
        rememberVisibleSkills();

        const lineId = String(button.dataset.removeSkillLine);
        const line = getActiveLines().find(
          item => String(item.id) === lineId
        );

        selectedSkillLineIds.delete(lineId);

        if (selectedSkillLineId === lineId) {
          selectedSkillLineId = "";
        }

        // Draft tetap disimpan jika line ditambahkan lagi.
        renderMemberSkills(memberId);

        $("memberSkillLineSearch")?.focus();

        toast(
          `Line ${line?.name || ""} dihapus dari tampilan form. ` +
          "Perubahan belum disimpan."
        );
      });
    });
  }

  /* =====================================================
     RESET FORM STATE
     ===================================================== */

  function resetSkillSearch() {
    selectedSkillLineIds = new Set();
    selectedSkillLineId = "";
    skillDraft = new Map();

    if ($("memberSkillLineSearch")) {
      $("memberSkillLineSearch").value = "";
    }

    if ($("memberSkillLineResults")) {
      $("memberSkillLineResults").innerHTML = "";
      $("memberSkillLineResults").hidden = true;
    }

    if ($("memberHomeLineResults")) {
      $("memberHomeLineResults").innerHTML = "";
      $("memberHomeLineResults").hidden = true;
    }
  }

  /* =====================================================
     OPEN ADD
     ===================================================== */

  function openAddModal() {
    const form = $("memberForm");
    if (!form) return;

    form.reset();
    resetSkillSearch();

    $("memberModalTitle").textContent = "Tambah Member + Skill";
    $("memberModalSubtitle").textContent =
      "Lengkapi identitas, line asal, shift, dan skill member.";

    $("memberEditId").value = "";

    if ($("memberDelete")) {
      $("memberDelete").style.display = "none";
    }

    populateLines("");
    renderMemberSkills();

    $("memberModal").classList.add("open");

    setTimeout(() => $("memberName")?.focus(), 80);
  }

  /* =====================================================
     OPEN EDIT
     Tampilkan semua line yang memiliki skill tersimpan.
     ===================================================== */

  function openEditModal(id) {
    const s = state();

    const member = s?.members.find(
      item => String(item.id) === String(id)
    );

    if (!member) {
      toast("Data member tidak ditemukan.");
      return;
    }

    resetSkillSearch();

    $("memberModalTitle").textContent = "Edit Member + Skill";
    $("memberModalSubtitle").textContent =
      "Perbarui data member dan Skill Matrix dalam satu form.";

    $("memberEditId").value = member.id;

    if ($("memberDelete")) {
      $("memberDelete").style.display = "inline-flex";
    }

    $("memberName").value = member.name || "";
    $("memberStatus").value = member.status || "PERMANENT";
    $("memberShift").value = normalizeShift(member.shift);

    populateLines(member.home_line_id || "");

    const memberSkills = (s.skills || []).filter(skill =>
      String(skill.member_id) === String(member.id) &&
      Number(skill.skill_level) > 0
    );

    const skilledStationIds = new Set(
      memberSkills.map(skill => String(skill.station_id))
    );

    getActiveStations().forEach(station => {
      if (skilledStationIds.has(String(station.id))) {
        selectedSkillLineIds.add(String(station.line_id));
      }
    });

    memberSkills.forEach(skill => {
      skillDraft.set(
        getSkillKey(skill.station_id),
        Number(skill.skill_level) || 0
      );
    });

    renderMemberSkills(member.id);

    $("memberModal").classList.add("open");
  }

  /* =====================================================
     DELETE MEMBER
     ===================================================== */

  async function removeMember() {
    const s = state();

    if (!s) {
      toast("State aplikasi belum siap.");
      return;
    }

    const memberId = $("memberEditId").value;

    if (!memberId) {
      toast("Member yang akan dihapus belum dipilih.");
      return;
    }

    const member = s.members.find(
      item => String(item.id) === String(memberId)
    );

    if (!member) {
      toast("Data member tidak ditemukan.");
      return;
    }

    const confirmed = window.confirm(
      `Hapus member "${member.name}"?\n\n` +
      "Data member dan seluruh skill member ini akan dihapus.\n\n" +
      "Tindakan ini tidak dapat dibatalkan."
    );

    if (!confirmed) return;

    const button = $("memberDelete");
    if (button) button.disabled = true;

    try {
      if (!SupabaseClient.configured()) {
        s.members = s.members.filter(
          item => String(item.id) !== String(memberId)
        );

        s.skills = s.skills.filter(
          item => String(item.member_id) !== String(memberId)
        );

        toast("Demo: member berhasil dihapus.");
      } else {
        await DB.remove("members", memberId);
        toast("Member berhasil dihapus.");
      }

      closeModal();

      if (typeof refresh === "function") {
        await refresh();
      }
    } catch (error) {
      console.error("Member delete error:", error);

      const message = String(error?.message || "").toLowerCase();

      if (
        message.includes("foreign key") ||
        message.includes("manpower_changes")
      ) {
        toast(
          "Member tidak dapat dihapus karena sudah digunakan " +
          "dalam riwayat replacement."
        );
      } else {
        toast(error?.message || "Gagal menghapus member.");
      }
    } finally {
      if (button) button.disabled = false;
    }
  }

  /* =====================================================
     CLOSE MODAL
     ===================================================== */

  function closeModal() {
    $("memberModal")?.classList.remove("open");
  }

  /* =====================================================
     SAVE MEMBER + SKILL MATRIX
     ===================================================== */

async function save(event) {
  event?.preventDefault();

  const s = state();

  if (!s) {
    toast("State aplikasi belum siap.");
    return;
  }

  rememberVisibleSkills();

  const editId = $("memberEditId").value || null;
  const name = $("memberName").value.trim();
  const status = $("memberStatus").value;
  const shift = normalizeShift($("memberShift").value);
  const homeLineId = $("memberHomeLine").value;

  /* =========================
     VALIDASI MEMBER
     ========================= */
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
    $("memberHomeLineSearch")?.focus();
    return;
  }

  /* =========================
     SIAPKAN SELURUH SKILL
     Pertahankan skill line lain.
     ========================= */
  const skills = getActiveStations().map(station => {
    const stationId = getSkillKey(station.id);
    const existing = getStoredSkill(editId, station.id);

    const level = skillDraft.has(stationId)
      ? Number(skillDraft.get(stationId)) || 0
      : Number(existing?.skill_level || 0);

    return {
      station_id: station.id,
      skill_level: level,
      certified: level >= 4
    };
  });

  if (!skills.length) {
    toast(
      "Skill Matrix belum tersedia. Tambahkan station terlebih dahulu."
    );
    return;
  }

  if (!skills.some(skill =>
    skill.skill_level >= 1 && skill.skill_level <= 6
  )) {
    toast("Isi minimal satu skill dengan level 1–6.");
    return;
  }

  const button = $("memberSave");
  if (button) {
    button.disabled = true;
    button.textContent = "Menyimpan...";
  }

  try {
    const payload = {
      name,
      status,
      shift,
      home_line_id: homeLineId,
      active: true
    };

    let memberId = editId;

    /* =========================
       1. SIMPAN DATA MEMBER
       ========================= */
    if (!SupabaseClient.configured()) {
      if (editId) {
        const member = (s.members || []).find(
          item => String(item.id) === String(editId)
        );

        if (!member) {
          throw new Error("Member tidak ditemukan.");
        }

        Object.assign(member, payload);
      } else {
        memberId = "demo-member-" + Date.now();

        s.members.push({
          id: memberId,
          ...payload
        });
      }
    } else {
      const savedMember = editId
        ? await DB.update("members", editId, payload)
        : await DB.insert("members", payload);

      memberId = savedMember?.id || editId;

      if (!memberId) {
        throw new Error(
          "ID member tidak ditemukan setelah penyimpanan."
        );
      }
    }

    /* =========================
       2. SIAPKAN PAYLOAD BATCH
       ========================= */
    const skillPayloads = skills.map(skill => ({
      member_id: memberId,
      station_id: skill.station_id,
      skill_level: skill.skill_level,
      certified: skill.certified
    }));

    /* =========================
       3. SIMPAN SEMUA SKILL
       ========================= */
    if (!SupabaseClient.configured()) {
      // Mode demo: perbarui record yang ada,
      // tambahkan record baru bila belum ada.
      for (const skill of skillPayloads) {
        const existing = (s.skills || []).find(item =>
          String(item.member_id) === String(memberId) &&
          String(item.station_id) === String(skill.station_id)
        );

        if (existing) {
          Object.assign(existing, skill);
        } else {
          s.skills.push({
            id: "demo-skill-" + Date.now() + "-" + skill.station_id,
            ...skill
          });
        }
      }
    } else {
      // Satu permintaan untuk seluruh station.
      await DB.saveMany("member_skills", skillPayloads);
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
    if (button) {
      button.disabled = false;
      button.textContent = "Simpan Member";
    }
  }
}

  /* =====================================================
     BIND EVENTS
     ===================================================== */

  function bind() {
    bindHomeLineSearch();
    bindSkillLineSearch();

    $("addMemberBtn")?.addEventListener("click", openAddModal);
    $("memberCancel")?.addEventListener("click", closeModal);
    $("memberCancel2")?.addEventListener("click", closeModal);
    $("memberDelete")?.addEventListener("click", removeMember);

    $("memberForm")?.addEventListener("submit", save);

    $("memberModal")?.addEventListener("click", event => {
      if (event.target === $("memberModal")) {
        closeModal();
      }
    });
  }

  return {
    configure,
    bind,
    openAddModal,
    openEditModal,
    removeMember,
    closeModal,
    populateLines,
    renderMemberSkills
  };
})();
