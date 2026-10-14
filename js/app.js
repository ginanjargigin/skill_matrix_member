(() => {

  /* =====================================================
     APP STATE
     ===================================================== */

  const s = {

    lines: [],

    stations: [],

    members: [],

    skills: [],

    changes: [],

    selectedLine: null

  };


  const $ = id =>
    document.getElementById(id);


  /* =====================================================
     HTML ESCAPE
     ===================================================== */

  const esc = value =>
    String(value ?? "")
      .replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      }[char]));


  /* =====================================================
     TOAST
     ===================================================== */

  const toast = message => {

    const element =
      $("toast");

    if (!element) {
      return;
    }


    element.textContent =
      message;


    element.classList.add(
      "show"
    );


    clearTimeout(
      toast.timer
    );


    toast.timer =
      setTimeout(() => {

        element.classList.remove(
          "show"
        );

      }, 2400);

  };


  window.App = {
    toast
  };


  window.AppState = s;


  /* =====================================================
     DEMO DATA
     ===================================================== */

  function loadDemo() {

    Object.assign(s, {

      lines: [
        ...DEMO_DATA.lines
      ],

      stations: [
        ...DEMO_DATA.stations
      ],

      members: [
        ...DEMO_DATA.members
      ],

      skills: [
        ...DEMO_DATA.skills
      ],

      changes: [
        ...DEMO_DATA.changes
      ]

    });

  }


  /* =====================================================
     LOAD SUPABASE
     ===================================================== */

  async function load() {

    if (
      !SupabaseClient.configured()
    ) {

      loadDemo();

      $("mode").textContent =
        "DEMO";

      return;

    }


    const [

      lines,

      stations,

      members,

      skills,

      changes

    ] = await Promise.all([

      DB.list(
        "lines",
        "name"
      ),

      DB.list(
        "stations",
        "name"
      ),

      DB.list(
        "members",
        "name"
      ),

      DB.list(
        "member_skills",
        "updated_at"
      ),

      DB.list(
        "manpower_changes",
        "work_date"
      )

    ]);


    Object.assign(s, {

      lines,

      stations,

      members,

      skills,

      changes

    });


    $("mode").textContent =
      "ONLINE";

  }


  /* =====================================================
     PAGE NAVIGATION
     ===================================================== */

  function page(name) {

  document
    .querySelectorAll(".page")
    .forEach(element => {

      element.classList.remove(
        "active"
      );

    });


  const target =
    $("page-" + name);


  if (target) {

    target.classList.add(
      "active"
    );

  }


  document
    .querySelectorAll("[data-page]")
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.page === name
      );

    });


  const titles = {

    dashboard:
      "Dashboard",

    replacement:
      "Replacement",

    members:
      "Member & Skill",

    history:
      "Riwayat",

    master:
      "Master Line & Station"

  };


  $("pageTitle").textContent =
    titles[name] ||
    "Dashboard";


  document.body
    .classList
    .remove(
      "menu-open"
    );


  if (name === "members") {

    MemberManager.populateLines();

  }


  if (name === "master") {

    MasterManager.render();

  }

}

  /* =====================================================
     GET SKILL
     ===================================================== */

function getSkill(memberId, stationId) {
  const skill = s.skills.find(item =>
    String(item.member_id) === String(memberId) &&
    String(item.station_id) === String(stationId)
  );

  return Number(skill?.skill_level) || 0;
}

/* =====================================================
   NORMALIZE SHIFT
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

  if (["b", "red"].includes(normalized)) {
    return "Red";
  }

  if (["c", "white"].includes(normalized)) {
    return "White";
  }

  return String(value || "").trim();
}

  /* =====================================================
     RENDER ALL
     ===================================================== */

  function render() {

    renderLines();

    renderMembers();

    renderHistory();

    renderDashboard();

    renderReplacement();

  }


  /* =====================================================
     DASHBOARD LINE
     ===================================================== */

 
function renderLines() {
  const lineList = $("lineList");
  if (!lineList) return;

  const searchInput = $("dashboardLineSearch");
  const keyword = String(searchInput?.value || "")
    .trim()
    .toLocaleLowerCase("id-ID");

  const filteredLines = s.lines
    .filter(line => line.active !== false)
    .filter(line =>
      String(line.name || "")
        .toLocaleLowerCase("id-ID")
        .includes(keyword)
    );

  lineList.innerHTML = filteredLines
    .map(line => {
      const stationCount = s.stations.filter(
        station =>
          String(station.line_id) === String(line.id)
      ).length;

      return `
        <button
          class="line-card"
          data-line="${esc(line.id)}"
          type="button"
        >
          <span class="line-icon">▦</span>

          <span>
            <b>${esc(line.name)}</b>
            <small>
              ${esc(line.area || "Area belum diisi")}
              · ${stationCount} station
            </small>
          </span>

          <strong>›</strong>
        </button>
      `;
    })
    .join("");

  if (!filteredLines.length) {
    lineList.innerHTML = `
      <div class="empty">
        ${
          keyword
            ? "Line tidak ditemukan. Coba kata kunci lain."
            : "Belum ada line aktif."
        }
      </div>
    `;
    return;
  }


  lineList.querySelectorAll("[data-line]").forEach(button => {
    button.classList.toggle(
      "is-selected",
      String(button.dataset.line) === String(s.selectedLine)
    );

    button.addEventListener("click", () => {
      s.selectedLine = button.dataset.line;

      // Tetap berada di Dashboard.
      renderLines();
      renderReplacement();

      // Tampilkan area kerja replacement.
      $("dashboardReplacementSection")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });
  });
}

  /* =====================================================
     REPLACEMENT
     ===================================================== */

 
function renderReplacement() {
  const section = $("dashboardReplacementSection");
  const selectedLineElement = $("selectedLine");
  const stationList = $("stationList");
  const stationSelect = $("replaceStation");
  const candidateList = $("candidateList");

  if (
    !section ||
    !selectedLineElement ||
    !stationList ||
    !stationSelect ||
    !candidateList
  ) {
    return;
  }

  const line = s.lines.find(
    item => String(item.id) === String(s.selectedLine)
  );

  // Sembunyikan form sampai pengguna memilih line.
  if (!line) {
    section.hidden = true;
    selectedLineElement.textContent =
      "Pilih line untuk memulai replacement";

    stationList.innerHTML = "";
    stationSelect.innerHTML =
      '<option value="">Pilih station</option>';
    candidateList.innerHTML = `
      <div class="empty">
        Pilih line terlebih dahulu.
      </div>
    `;

    return;
  }

  section.hidden = false;
  selectedLineElement.textContent = line.name;

  // Isi pilihan member yang tidak masuk.
  const absentSelect = $("absentMember");

  if (absentSelect) {
    const previousValue = absentSelect.value;

    absentSelect.innerHTML = `
      <option value="">Pilih member yang tidak masuk</option>
      ${s.members
        .filter(member => member.active !== false)
        .sort((a, b) =>
          String(a.name || "").localeCompare(
            String(b.name || "")
          )
        )
        .map(member => `
          <option value="${esc(member.id)}">
            ${esc(member.name || "-")}
          </option>
        `)
        .join("")}
    `;

    if (
      previousValue &&
      s.members.some(member =>
        String(member.id) === String(previousValue) &&
        member.active !== false
      )
    ) {
      absentSelect.value = previousValue;
    }
  }

  // Ambil station milik line yang dipilih.
  const stations = s.stations.filter(
    station => String(station.line_id) === String(line.id)
  );

  const previousStation = stationSelect.value;

  // Daftar station yang bisa dipilih.
  stationList.innerHTML = stations.length
    ? stations.map(station => `
        <button
          class="station-card ${
            String(station.id) === String(previousStation)
              ? "is-selected"
              : ""
          }"
          data-station="${esc(station.id)}"
          type="button"
        >
          <span>
            <b>${esc(station.name)}</b>
            <small>${esc(station.position_name || "")}</small>
          </span>
          <strong>›</strong>
        </button>
      `).join("")
    : `
        <div class="empty">
          Belum ada station untuk line ini.
        </div>
      `;

  // Dropdown station menggunakan data line yang sama.
  stationSelect.innerHTML = `
    <option value="">Pilih station</option>
    ${stations.map(station => `
      <option value="${esc(station.id)}">
        ${esc(station.name)}${
          station.position_name
            ? " — " + esc(station.position_name)
            : ""
        }
      </option>
    `).join("")}
  `;

  // Pertahankan station sebelumnya jika masih ada.
  if (
    previousStation &&
    stations.some(
      station => String(station.id) === String(previousStation)
    )
  ) {
    stationSelect.value = previousStation;
  } else if (stations.length === 1) {
    // Jika hanya ada satu station, pilih otomatis.
    stationSelect.value = String(stations[0].id);
  }

  // Klik kartu station memperbarui dropdown dan kandidat.
  stationList.querySelectorAll("[data-station]").forEach(button => {
    button.addEventListener("click", () => {
      stationSelect.value = button.dataset.station;

      stationList.querySelectorAll("[data-station]").forEach(item => {
        item.classList.toggle(
          "is-selected",
          item.dataset.station === stationSelect.value
        );
      });

      renderCandidates();
    });
  });

  renderCandidates();
}

  
/* =====================================================
   SKILL DISPLAY
   ===================================================== */
function getSkillStars(level) {
  const value = Math.max(0, Math.min(6, Number(level) || 0));

  if (value === 0) return "—";

  return Array.from({ length: value }, () => `
    <span class="skill-star">★</span>
  `).join("");
}

function getSkillPercent(level) {

  const percentage = {
    0: 0,
    1: 25,
    2: 50,
    3: 75,
    4: 82,
    5: 92,
    6: 100
  };

  return percentage[
    Number(level)
  ] ?? 0;
}
  /* =====================================================
     CANDIDATE
     ===================================================== */

  function renderCandidates() {

    const stationId =
      $("replaceStation").value;


      if (!stationId) {

      $("candidateList").innerHTML = `

        <div class="empty">

          Pilih station terlebih dahulu.

        </div>

      `;

      return;

    }


    


const selectedShift = $("changeShift").value;
const selectedDate = $("changeDate").value;
const absentMemberId = $("absentMember")?.value || "";

const candidates = s.members
  .filter(member => {
    if (member.active === false) return false;

    // Jangan tampilkan member yang sedang digantikan.
    if (String(member.id) === String(absentMemberId)) {
      return false;
    }

    // Shift harus sesuai.
    if (
      normalizeShift(member.shift) !==
      normalizeShift(selectedShift)
    ) {
      return false;
    }

    // Jangan tampilkan member yang sudah ditugaskan
    // pada tanggal dan shift yang sama.
    const alreadyAssigned = s.changes.some(change =>
      String(change.replacement_member_id) === String(member.id) &&
      String(change.work_date || "").slice(0, 10) === selectedDate &&
      normalizeShift(change.shift) === normalizeShift(selectedShift)
    );

    return !alreadyAssigned;
  })
  .map(member => ({
    ...member,
    level: getSkill(member.id, stationId)
  }))
  .filter(member => member.level > 0)
  .sort((a, b) =>
    b.level - a.level ||
    String(a.name || "").localeCompare(String(b.name || ""))
  );
    /* ===================================================
       VERTICAL CANDIDATE CARD
       =================================================== */

    $("candidateList").innerHTML =

      candidates
        .map(member => `

          <article
            class="candidate"
          >

            <div class="candidate-info">

              <span class="candidate-rank">
                Kandidat
              </span>

              <b class="candidate-name">
                ${esc(member.name)}
              </b>

             
              <small>
                Status:
                ${esc(member.status)}
              </small>

              <small>
                Shift:
                ${esc(member.shift || "-")}
              </small>

            </div>


            <div class="candidate-skill">
            
              <span>
                Skill
              </span>
            
              <strong>
            
               <span class="skill-stars ${Number(member.level) === 6 ? "skill-master" : ""}">
                ${getSkillStars(member.level)}
              </span>
                            
                <span class="skill-percent">
                  ${getSkillPercent(member.level)}%
                </span>
            
              </strong>
            
            </div>


            <button
              class="primary candidate-pick"
              data-pick="${esc(member.id)}"
              type="button"
            >
              Pilih sebagai Pengganti
            </button>

          </article>

        `)
        .join("")

      ||

      `<div class="empty">

        Tidak ada kandidat dengan
        skill di atas 0.

      </div>`;


    /* ===================================================
       PICK
       =================================================== */

    document
      .querySelectorAll(
        "[data-pick]"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            const member =
              s.members.find(
                item =>
                  String(item.id) ===
                  String(
                    button.dataset.pick
                  )
              );


            if (!member) {
              return;
            }


            $("confirmText").textContent =

              `${member.name} akan dipilih sebagai pengganti.`;


            $("confirmModal")
              .dataset
              .member =
              member.id;


            $("confirmModal")
              .classList
              .add("open");

          }
        );

      });

  }


  /* =====================================================
     SAVE REPLACEMENT
     ===================================================== */

  async function saveChange() {
    const replacementMember = s.members.find(
      member =>
        String(member.id) ===
        String($("confirmModal").dataset.member)
    );

    const payload = {
      work_date: $("changeDate").value,
      shift: $("changeShift").value,

      // Line tujuan yang membutuhkan backup.
      line_id: s.selectedLine,

      station_id: $("replaceStation").value,

      // Member yang tidak masuk.
      absent_member_id: $("absentMember")?.value || null,

      // Member yang melakukan backup.
      replacement_member_id:
        $("confirmModal").dataset.member,

      // Snapshot line asal pada saat replacement disimpan.
      origin_line_id:
        replacementMember?.home_line_id || null,

      reason: $("changeReason").value,
      notes: $("changeNotes").value.trim()
    };

    if (
      !payload.work_date ||
      !payload.line_id ||
      !payload.station_id ||
      !payload.absent_member_id ||
      !payload.replacement_member_id ||
      !payload.reason
    ) {
      toast(
        "Lengkapi tanggal, member yang diganti, station, kandidat, dan alasan."
      );
      return;
    }

    // DEMO MODE
    if (!SupabaseClient.configured()) {
      s.changes.push({
        id: "demo-" + Date.now(),
        ...payload
      });

      toast("Demo: replacement dicatat.");
      closeModals();
      render();
      return;
    }

    // SUPABASE
    try {
      await DB.insert("manpower_changes", payload);

      toast("Replacement berhasil disimpan.");
      closeModals();

      await load();
      render();
    } catch (error) {
      console.error("Gagal menyimpan replacement:", error);

      toast(
        error?.message ||
        "Gagal menyimpan replacement. Periksa kolom database dan koneksi."
      );
    }
  }


  /* =====================================================
     MEMBER LIST
     ===================================================== */

  

function renderMembers() {
  const searchInput = $("memberSearch");
  const memberList = $("memberList");

  if (!searchInput || !memberList) return;

  const query = searchInput.value
    .trim()
    .toLocaleLowerCase("id-ID");

  const rows = s.members.filter(member => {
    const homeLine = s.lines.find(
      line =>
        String(line.id) === String(member.home_line_id)
    );

    const searchable = [
      member.name,
      member.status,
      normalizeShift(member.shift),
      homeLine?.name
    ].join(" ").toLocaleLowerCase("id-ID");

    return !query || searchable.includes(query);
  });

  const getStatusClass = status => {
    const value = String(status || "")
      .trim()
      .toLowerCase();

    if (value.includes("magang")) return "magang";
    if (value.includes("kontrak")) return "kontrak";

    return "permanent";
  };

  memberList.innerHTML = rows.map(member => {
    const statusClass = getStatusClass(member.status);

    const initials = String(member.name || "?")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(word => word.charAt(0))
      .join("")
      .toUpperCase();

    // Ambil station yang memiliki skill aktif.
    const memberSkills = s.skills.filter(skill =>
      String(skill.member_id) === String(member.id) &&
      Number(skill.skill_level) > 0
    );

    const skillCount = memberSkills.length;

    // Ubah station yang dikuasai menjadi daftar nama line unik.
    const skilledLineIds = new Set(
      memberSkills.map(skill => {
        const station = s.stations.find(
          item =>
            String(item.id) === String(skill.station_id)
        );

        return station?.line_id == null
          ? null
          : String(station.line_id);
      }).filter(Boolean)
    );

    const skilledLines = s.lines.filter(line =>
      skilledLineIds.has(String(line.id))
    );

    const lineChips = skilledLines.length
      ? skilledLines.map(line => `
          <span class="member-line-chip">
            ${esc(line.name)}
          </span>
        `).join("")
      : `<span class="member-no-skill">Belum ada line dengan skill aktif</span>`;

    return `
      <article class="member-card member-id-card ${statusClass}">
      <div class="member-photo-thumb">
  <span class="member-photo-initial">
    ${esc(
      String(member.name || "?")
        .trim()
        .charAt(0)
        .toUpperCase()
    )}
  </span>

  ${
    member.photo_path
      ? `<img
          data-member-photo="${esc(member.id)}"
          alt="Foto ${esc(member.name)}"
          loading="lazy"
        >`
      : ""
  }
</div>

       
        <div class="member-id-content">

          <div class="member-id-heading">
            <div class="member-id-name">
              <h3>${esc(member.name || "-")}</h3>

              <span class="member-status-badge ${statusClass}">
                ${esc(member.status || "-")}
              </span>
            </div>

            <div class="member-skill-count">
              <span class="member-skill-label">Skill aktif</span>
              <strong>${skillCount}</strong>
            </div>
          </div>

          <div class="member-meta">
            <span>
              <span class="member-meta-label">SHIFT</span>
              <strong>${esc(normalizeShift(member.shift) || "-")}</strong>
            </span>

            <span>
              <span class="member-meta-label">LINE ASAL</span>
              <strong>${esc(
                s.lines.find(
                  line =>
                    String(line.id) ===
                    String(member.home_line_id)
                )?.name || "-"
              )}</strong>
            </span>
          </div>

          <div class="member-capabilities">
            <span class="member-meta-label">
              LINE YANG BISA DIKERJAKAN
            </span>

            <div class="member-line-list">
              ${lineChips}
            </div>
          </div>

          <div class="member-id-actions">
            <button
              class="secondary small"
              data-edit-member="${esc(member.id)}"
              type="button"
            >
              ✎ Edit Member + Skill
            </button>
          </div>

        </div>
      </article>
    `;
  }).join("") || `
    <div class="empty">
      Member tidak ditemukan.
    </div>
  `;

  memberList.querySelectorAll("[data-edit-member]")
    .forEach(button => {
      button.addEventListener("click", () => {
        MemberManager.openEditModal(
          button.dataset.editMember
        );
      });
    });
}
  if (SupabaseClient.configured()) {
  rows.forEach(async member => {
    if (!member.photo_path) return;

    try {
      const url = await DB.getMemberPhotoUrl(
        member.photo_path
      );

      const img = [...memberList.querySelectorAll(
        "[data-member-photo]"
      )].find(
        element =>
          element.dataset.memberPhoto === String(member.id)
      );

      if (!img || !url) return;

      img.onload = () => {
        img.classList.add("loaded");
      };

      img.onerror = () => {
        img.remove();
      };

      img.src = url;
    } catch (error) {
      console.error(
        "Gagal memuat foto member:",
        member.name,
        error
      );
    }
  });
}

  /* =====================================================
     OPEN SKILL EDITOR
     ===================================================== */

  function openSkills(id) {

    const member =
      s.members.find(
        item =>
          String(item.id) ===
          String(id)
      );


    if (!member) {

      toast(
        "Member tidak ditemukan."
      );

      return;

    }


  $("skillMemberName").textContent = member.name || "";


    $("skillMemberId")
      .value =
      id;


    $("skillEditor").innerHTML =

      s.stations
        .map(station => {

          const value =
            getSkill(
              id,
              station.id
            );


          const line =
            s.lines.find(
              item =>
                String(item.id) ===
                String(
                  station.line_id
                )
            );


          return `

            <label class="skill-row">

              <span>

                ${esc(
                  station.name
                )}

                <small>
                  ${esc(
                    line?.name || ""
                  )}
                </small>

              </span>


              <select
                data-skill="${esc(station.id)}"
              >

                ${[0,1,2,3,4,5,6]
                  .map(level => `

                    <option
                      value="${level}"
                      ${
                        level === value
                          ? "selected"
                          : ""
                      }
                    >
                      ${level}
                    </option>

                  `)
                  .join("")}

              </select>

            </label>

          `;

        })
        .join("");


    $("skillModal")
      .classList
      .add("open");

  }


  /* =====================================================
     SAVE SKILL
     ===================================================== */

  async function saveSkills() {

    const memberId =
      $("skillMemberId").value;


    const updates =

      [
        ...
        document
          .querySelectorAll(
            "[data-skill]"
          )
      ]
      .map(select => ({

        member_id:
          memberId,

        station_id:
          select.dataset.skill,

        skill_level:
          Number(
            select.value
          ),

        certified:
          Number(
            select.value
          ) >= 4

      }));


    if (
      !SupabaseClient.configured()
    ) {

      updates.forEach(
        update => {

          const existing =
            s.skills.find(
              skill =>
                String(
                  skill.member_id
                ) ===
                String(
                  update.member_id
                ) &&

                String(
                  skill.station_id
                ) ===
                String(
                  update.station_id
                )
            );


          if (existing) {

            Object.assign(
              existing,
              update
            );

          } else {

            s.skills.push({

              id:
                "demo-" +
                Math.random(),

              ...update

            });

          }

        }
      );


      toast(
        "Demo: skill diperbarui."
      );


      closeModals();

      render();

      return;

    }


    try {

      for (const update of updates) {

        await DB.save(
          "member_skills",
          update
        );

      }


      toast(
        "Skill berhasil diperbarui."
      );


      closeModals();

      await load();

      render();

    } catch (error) {

      console.error(error);

      toast(
        error?.message ||
        "Gagal menyimpan skill."
      );

    }

  }


  /* =====================================================
     HISTORY / RIWAYAT REPLACEMENT
     ===================================================== */

  function renderHistory() {
    const historyList = $("historyList");
    if (!historyList) return;

    const monthInput = $("historyMonth");
    const searchInput = $("historySearch");
    const countElement = $("historyCount");

    const now = new Date();
    const currentMonth =
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    if (monthInput && !monthInput.value) {
      monthInput.value = currentMonth;
    }

    const selectedMonth = monthInput?.value || "";
    const query = String(searchInput?.value || "")
      .trim()
      .toLocaleLowerCase("id-ID");

    const getLine = id =>
      s.lines.find(item => String(item.id) === String(id));

    const getStation = id =>
      s.stations.find(item => String(item.id) === String(id));

    const getMember = id =>
      s.members.find(item => String(item.id) === String(id));

    const normalize = value =>
      String(value ?? "").trim().toLocaleLowerCase("id-ID");

    const formatDate = value => {
      if (!value) return "-";

      const parts = String(value).slice(0, 10).split("-");
      if (parts.length !== 3) return String(value);

      const months = [
        "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
        "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
      ];

      const monthIndex = Number(parts[1]) - 1;
      return `${parts[2]} ${months[monthIndex] || ""} ${parts[0]}`;
    };

    const shiftLabels = {
      A: "Non Shift",
      B: "Red",
      C: "White"
    };

    const reasonClass = reason => {
      const value = normalize(reason);
      if (value.includes("sakit")) return "reason-sakit";
      if (value.includes("izin")) return "reason-izin";
      if (value.includes("cuti")) return "reason-cuti";
      if (value.includes("terlambat")) return "reason-terlambat";
      return "reason-default";
    };

    const rows = [...s.changes]
      .filter(change => {
        const date = String(change.work_date || "").slice(0, 10);

        if (selectedMonth && date.slice(0, 7) !== selectedMonth) {
          return false;
        }

        const targetLine = getLine(change.line_id);
        const station = getStation(change.station_id);
        const replacement = getMember(change.replacement_member_id);
        const absent = getMember(change.absent_member_id);
        const originLine = getLine(
          change.origin_line_id || replacement?.home_line_id
        );

        const searchableText = [
          targetLine?.name,
          originLine?.name,
          station?.name,
          station?.position_name,
          absent?.name,
          replacement?.name,
          change.reason,
          change.notes,
          shiftLabels[change.shift] || change.shift,
          change.work_date
        ].map(normalize).join(" ");

        return !query || searchableText.includes(query);
      })
      .sort((a, b) =>
        String(b.work_date || "").localeCompare(String(a.work_date || ""))
      );

    if (countElement) {
      countElement.textContent = `${rows.length} riwayat`;
    }

    historyList.innerHTML = rows.map(change => {
      const targetLine = getLine(change.line_id);
      const station = getStation(change.station_id);
      const replacement = getMember(change.replacement_member_id);
      const absent = getMember(change.absent_member_id);

      // Untuk data baru, gunakan snapshot. Data lama fallback ke home_line_id.
      const originLine = getLine(
        change.origin_line_id || replacement?.home_line_id
      );

      const reason = change.reason || "Tidak disebutkan";
      const notes = change.notes || "";
      const shift = shiftLabels[change.shift] || change.shift || "-";

      return `
        <article class="history-row">

          <div class="history-cell history-line-cell">
            <span class="history-mobile-label">Line &amp; Tanggal</span>
            <strong class="history-line-name">
              ${esc(targetLine?.name || "-")}
            </strong>
            <span class="history-date">
              <span aria-hidden="true">▦</span>
              ${esc(formatDate(change.work_date))}
            </span>
            <span class="history-shift">
              Shift ${esc(shift)}
            </span>
          </div>

          <div class="history-cell">
            <span class="history-mobile-label">Member yang Diganti</span>
            <strong class="history-person-name">
              ${esc(absent?.name || "Member belum dicatat")}
            </strong>
            <span class="history-detail">
              Line: <b>${esc(targetLine?.name || "-")}</b>
            </span>
            <span class="history-detail">
              Station: ${esc(station?.name || "-")}
            </span>
          </div>

          <div class="history-cell">
            <span class="history-mobile-label">Member Pengganti</span>
            <strong class="history-person-name">
              ${esc(replacement?.name || "Member tidak ditemukan")}
            </strong>
            <span class="history-origin">
              Line asal: <b>${esc(originLine?.name || "-")}</b>
            </span>
            <span class="history-detail">
              Station: ${esc(station?.name || "-")}
            </span>
          </div>

          <div class="history-cell history-reason-cell">
            <span class="history-mobile-label">Alasan Tidak Masuk</span>
            <div class="history-reason-box ${reasonClass(reason)}">
              <strong>${esc(reason)}</strong>
              <small>
                ${notes
                  ? esc(notes)
                  : "Tidak ada catatan tambahan"}
              </small>
            </div>
          </div>

          </div>

          <!-- Panel Durasi Backup -->
          <div class="history-duration-panel">
            <div class="history-duration-heading">
              <strong>Durasi Backup</strong>
              ${
                change.backup_duration_minutes != null
                  ? `<span class="history-duration-status is-saved">Sudah diisi</span>`
                  : `<span class="history-duration-status">Belum diisi</span>`
              }
            </div>

            <form
              class="history-duration-form"
              data-change-id="${esc(change.id)}"
            >
              <label>
                <span>Durasi aktual</span>
                <input
                  type="number"
                  name="backup_duration_minutes"
                  min="1"
                  step="1"
                  inputmode="numeric"
                  placeholder="Menit"
                  value="${
                    change.backup_duration_minutes != null
                      ? esc(change.backup_duration_minutes)
                      : ""
                  }"
                  aria-label="Durasi backup dalam menit"
                >
              </label>

              <button type="submit" class="primary small">
                Simpan Durasi
              </button>
            </form>

            ${
              change.backup_duration_minutes != null
                ? `<small class="history-duration-converted">
                    Setara ${Math.floor(Number(change.backup_duration_minutes) / 60)} jam
                    ${Number(change.backup_duration_minutes) % 60} menit
                  </small>`
                : `<small class="history-duration-help">
                    Isi setelah proses backup selesai.
                  </small>`
            }
          </div>

        </article>

        </article>
      `;
    }).join("");

    if (!rows.length) {
      historyList.innerHTML = `
        <div class="empty history-empty">
          Tidak ada riwayat yang cocok dengan filter.
          <small>Coba pilih bulan lain atau ubah kata pencarian.</small>
        </div>
      `;
    }
  }

  async function saveHistoryDuration(event) {
    const form = event.target.closest(".history-duration-form");
    if (!form) return;

    event.preventDefault();

    const input = form.querySelector(
      '[name="backup_duration_minutes"]'
    );
    const button = form.querySelector('button[type="submit"]');
    const id = form.dataset.changeId;
    const rawValue = input.value.trim();

    // Durasi wajib diisi dan harus berupa bilangan bulat positif.
    if (
      rawValue === "" ||
      !Number.isInteger(Number(rawValue)) ||
      Number(rawValue) <= 0
    ) {
      toast("Durasi backup harus berupa bilangan bulat lebih dari 0 menit.");
      input.focus();
      return;
    }

    const duration = Number(rawValue);
    const change = s.changes.find(
      item => String(item.id) === String(id)
    );

    if (!change) {
      toast("Data riwayat tidak ditemukan. Muat ulang halaman.");
      return;
    }

    if (button) {
      button.disabled = true;
      button.textContent = "Menyimpan...";
    }

    try {
      if (SupabaseClient.configured()) {
        // Simpan hanya kolom durasi pada riwayat yang dipilih.
        const updated = await DB.update(
          "manpower_changes",
          id,
          { backup_duration_minutes: duration }
        );

        Object.assign(change, updated);
      } else {
        // Demo mode: perubahan hanya berada di memori browser.
        change.backup_duration_minutes = duration;
      }

      renderHistory();
      toast("Durasi backup berhasil disimpan.");
    } catch (error) {
      console.error("Gagal menyimpan durasi backup:", error);

      toast(
        error?.message ||
        "Durasi gagal disimpan. Periksa koneksi dan izin akses."
      );

      if (button) {
        button.disabled = false;
        button.textContent = "Simpan Durasi";
      }
    }
  }


  /* =====================================================
     DASHBOARD
     ===================================================== */

  function renderDashboard() {

   $("kpiMembers").textContent =
  s.members.filter(member => member.active !== false).length;


    $("kpiLines")
      .textContent =
      s.lines.filter(
        line =>
          line.active !== false
      ).length;


    $("kpiChanges")
      .textContent =
      s.changes.length;


    const today =
      new Date()
        .toISOString()
        .slice(0, 10);


    $("kpiToday")
      .textContent =
      s.changes.filter(
        change =>
          change.work_date ===
          today
      ).length;

  }


  /* =====================================================
     CLOSE MODAL
     ===================================================== */

  function closeModals() {

    document
      .querySelectorAll(".modal")
      .forEach(modal => {

        modal.classList.remove(
          "open"
        );

      });

  }


  /* =====================================================
     BIND
     ===================================================== */

  function bind() {

    document
      .querySelectorAll(
        "[data-page]"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            page(
              button.dataset.page
            );

          }
        );

      });


    $("mobileMenu")
      .addEventListener(
        "click",
        () => {

          document.body
            .classList
            .toggle(
              "menu-open"
            );

        }
      );


       $("memberSearch")
      .addEventListener(
        "input",
        renderMembers
      );

const dashboardLineSearch = $("dashboardLineSearch");

if (dashboardLineSearch) {
  dashboardLineSearch.addEventListener("input", renderLines);
}


    // Filter riwayat: bulan, pencarian, dan reset.
    if ($("historyMonth")) {
      $("historyMonth").addEventListener("change", renderHistory);
    }

    if ($("historySearch")) {
      $("historySearch").addEventListener("input", renderHistory);
    }

    if ($("historyReset")) {
      $("historyReset").addEventListener("click", () => {
        const now = new Date();
        if ($("historyMonth")) {
          $("historyMonth").value =
            `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        }
        if ($("historySearch")) {
          $("historySearch").value = "";
        }
        renderHistory();
      });
    }


    $("replaceStation")
      .addEventListener(
        "change",
        renderCandidates
      );

    $("changeShift")
  .addEventListener(
    "change",
    renderCandidates
  );

$("changeDate")
  .addEventListener(
    "change",
    renderCandidates
  );

    $("changeDate")
      .value =
      new Date()
        .toISOString()
        .slice(0, 10);


    $("confirmCancel")
      .addEventListener(
        "click",
        closeModals
      );


    $("confirmCancel2")
      .addEventListener(
        "click",
        closeModals
      );


    $("confirmSave")
      .addEventListener(
        "click",
        saveChange
      );


    $("skillCancel")
      .addEventListener(
        "click",
        closeModals
      );


    $("skillCancel2")
      .addEventListener(
        "click",
        closeModals
      );


    $("skillSave")
      .addEventListener(
        "click",
        saveSkills
      );
    if ($("absentMember")) {
  $("absentMember").addEventListener(
    "change",
    renderCandidates
  );
}

    // Simpan durasi backup dari setiap kartu Riwayat.
    if ($("historyList")) {
      $("historyList").addEventListener(
        "submit",
        saveHistoryDuration
      );
    }


  /* =====================================================
   MODULE CONFIGURATION
   ===================================================== */

MemberManager.configure({

  getState: () => s,

  refresh: async () => {

    await load();

    render();

  }

});


MasterManager.configure({

  getState: () => s,

  refresh: async () => {

    await load();

    render();

    MasterManager.render();

  }

});


MemberManager.bind();

MasterManager.bind();
    
    /* ===================================================
       LOGIN
       =================================================== */

  
    $("loginForm").addEventListener(
      "submit",
      async event => {
        event.preventDefault();

        const form = $("loginForm");
        const submitButton = form.querySelector(
          'button[type="submit"]'
        );

        if (submitButton) {
          submitButton.disabled = true;
        }

        try {
          await DB.signIn(
            $("loginEmail").value,
            $("loginPassword").value
          );

          // Pastikan sesi sudah tersimpan dan dapat dibaca.
          const session = await DB.getSession();

          if (!session) {
            throw new Error(
              "Login berhasil, tetapi sesi belum tersedia. Coba login kembali."
            );
          }

          $("loginModal").classList.remove("open");

          toast("Login berhasil.");

          await load();
          render();

          form.reset();
        } catch (error) {
          console.error("Login atau pemuatan data gagal:", error);

          toast(
            error?.message ||
            "Login gagal. Periksa email, password, dan koneksi."
          );
        } finally {
          if (submitButton) {
            submitButton.disabled = false;
          }
        }
      }
    );
} 


  /* =====================================================
     AUTH
     ===================================================== */

 
  async function auth() {
    // Tanpa konfigurasi Supabase, aplikasi tetap menggunakan mode demo.
    if (!SupabaseClient.configured()) {
      $("loginModal").classList.remove("open");
      return true;
    }

    // Pada mode Supabase, sesi harus valid sebelum data dimuat.
    const session = await DB.getSession();

    if (!session) {
      $("loginModal").classList.add("open");
      return false;
    }

    $("loginModal").classList.remove("open");
    return true;
  }



  /* =====================================================
     START
     ===================================================== */

 
  window.addEventListener(
    "DOMContentLoaded",
    async () => {
      bind();

      try {
        const authenticated = await auth();

        // Jangan memanggil load() sebelum sesi tersedia.
        if (!authenticated) {
          return;
        }

        await load();
        render();
      } catch (error) {
        console.error(
          "Gagal memulai aplikasi:",
          error
        );

        toast(
          error?.message ||
          "Gagal memuat aplikasi. Periksa koneksi dan sesi login."
        );
      }
    }
  );

})();
