/* =========================================================
   APPLICATION
   ========================================================= */

window.App = {

  /* ---------------------------------------------------------
     INIT
     --------------------------------------------------------- */

  async init() {

    await AppData.load();

    this.bindNav();

    this.bindForms();

    this.populateSelectors();

    this.renderAll();
  },


  /* ---------------------------------------------------------
     NAVIGATION
     --------------------------------------------------------- */

  bindNav() {

    document
      .querySelectorAll("[data-page]")
      .forEach(button => {

        button.addEventListener(
          "click",
          () => this.go(button.dataset.page)
        );

      });


    const mobileMenu =
      document.getElementById("mobileMenu");

    if (mobileMenu) {

      mobileMenu.addEventListener(
        "click",
        () => {

          document
            .getElementById("sidebar")
            ?.classList.toggle("open");

        }
      );

    }
  },


  /* ---------------------------------------------------------
     PAGE NAVIGATION
     --------------------------------------------------------- */

  go(page) {

    document
      .querySelectorAll(".page")
      .forEach(p =>
        p.classList.remove("active")
      );


    const targetPage =
      document.getElementById(
        `page-${page}`
      );

    if (targetPage) {

      targetPage.classList.add("active");

    }


    document
      .querySelectorAll(".nav-item")
      .forEach(nav => {

        nav.classList.toggle(
          "active",
          nav.dataset.page === page
        );

      });


    const titles = {

      dashboard: "Dashboard",

      replacement: "Replacement",

      members: "Member",

      lines: "Line",

      history: "Riwayat Replacement"

    };


    const pageTitle =
      document.getElementById("pageTitle");

    if (pageTitle) {

      pageTitle.textContent =
        titles[page] || page;

    }


    document
      .getElementById("sidebar")
      ?.classList.remove("open");
  },


  /* =========================================================
     FORM & EVENT HANDLERS
     ========================================================= */

  bindForms() {

    /* -------------------------------------------------------
       REPLACEMENT
       ------------------------------------------------------- */

    const replaceLine =
      document.getElementById("replaceLine");

    if (replaceLine) {

      replaceLine.addEventListener(
        "change",
        () => this.populateOperations()
      );

    }


    const searchCandidate =
      document.getElementById("searchCandidate");

    if (searchCandidate) {

      searchCandidate.addEventListener(
        "click",
        () => Replacement.render()
      );

    }


    const candidateSearch =
      document.getElementById("candidateSearch");

    if (candidateSearch) {

      candidateSearch.addEventListener(
        "input",
        () => Replacement.render()
      );

    }


    /* -------------------------------------------------------
       MEMBER FILTER
       ------------------------------------------------------- */

    const memberSearch =
      document.getElementById("memberSearch");

    if (memberSearch) {

      memberSearch.addEventListener(
        "input",
        () => this.renderMembers()
      );

    }


    const memberStatus =
      document.getElementById("memberStatus");

    if (memberStatus) {

      memberStatus.addEventListener(
        "change",
        () => this.renderMembers()
      );

    }


    /* =======================================================
       MEMBER
       ======================================================= */

    const addMemberBtn =
      document.getElementById("addMemberBtn");

    if (addMemberBtn) {

      addMemberBtn.addEventListener(
        "click",
        event => {

          event.preventDefault();

          MemberManager.openAddModal();

        }
      );

    }


    /* -------------------------------------------------------
       MEMBER TABLE EVENT DELEGATION
       ------------------------------------------------------- */

    const memberTable =
      document.getElementById("memberTable");

    if (memberTable) {

      memberTable.addEventListener(
        "click",
        event => {

          /*
           * Cari tombol Edit dari elemen yang
           * sebenarnya diklik.
           *
           * closest() membuat handler tetap
           * bekerja walaupun isi tombol berubah.
           */

          const editButton =
            event.target.closest(
              "[data-edit-member]"
            );


          if (!editButton) {
            return;
          }


          event.preventDefault();

          const memberId =
            editButton.dataset.editMember;


          if (!memberId) {

            console.warn(
              "data-edit-member tidak ditemukan."
            );

            return;
          }


          MemberManager.openEditModal(
            memberId
          );

        }
      );

    }


    /* -------------------------------------------------------
       MEMBER MODAL
       ------------------------------------------------------- */

    const closeModal =
      document.getElementById("closeModal");

    if (closeModal) {

      closeModal.addEventListener(
        "click",
        event => {

          event.preventDefault();

          MemberManager.closeModal();

        }
      );

    }


    const cancelModal =
      document.getElementById("cancelModal");

    if (cancelModal) {

      cancelModal.addEventListener(
        "click",
        event => {

          event.preventDefault();

          MemberManager.closeModal();

        }
      );

    }


    /* -------------------------------------------------------
       PHOTO
       ------------------------------------------------------- */

    const photoInput =
      document.getElementById("photoInput");

    if (photoInput) {

      photoInput.addEventListener(
        "change",
        event => this.previewPhoto(event)
      );

    }


    /* -------------------------------------------------------
       MEMBER FORM SUBMIT
       ------------------------------------------------------- */

    const memberForm =
      document.getElementById("memberForm");

    if (memberForm) {

      memberForm.addEventListener(
        "submit",
        event => {

          event.preventDefault();

          MemberManager.save(event);

        }
      );

    }


    /* -------------------------------------------------------
       ESCAPE TO CLOSE MEMBER MODAL
       ------------------------------------------------------- */

    document.addEventListener(
      "keydown",
      event => {

        if (event.key !== "Escape") {
          return;
        }

        const modal =
          document.getElementById("memberModal");

        if (
          modal &&
          !modal.classList.contains("hidden")
        ) {

          MemberManager.closeModal();

        }

      }
    );


    /* =======================================================
       LINE
       ======================================================= */

    const addLineBtn =
      document.getElementById("addLineBtn");

    if (addLineBtn) {

      addLineBtn.addEventListener(
        "click",
        () => LineManager.openAddModal()
      );

    }


    const addLineBtnPage =
      document.getElementById("addLineBtnPage");

    if (addLineBtnPage) {

      addLineBtnPage.addEventListener(
        "click",
        () => LineManager.openAddModal()
      );

    }


    const closeLineModal =
      document.getElementById("closeLineModal");

    if (closeLineModal) {

      closeLineModal.addEventListener(
        "click",
        () => LineManager.closeModal()
      );

    }


    const cancelLineModal =
      document.getElementById("cancelLineModal");

    if (cancelLineModal) {

      cancelLineModal.addEventListener(
        "click",
        () => LineManager.closeModal()
      );

    }


    const lineForm =
      document.getElementById("lineForm");

    if (lineForm) {

      lineForm.addEventListener(
        "submit",
        event => LineManager.save(event)
      );

    }
  },


  /* =========================================================
     SELECTORS
     ========================================================= */

  populateSelectors() {

    const select =
      document.getElementById("replaceLine");

    if (!select) {
      return;
    }


    select.innerHTML =
      (AppData.data.lines || [])
        .map(line =>
          `
            <option value="${UI.esc(line.id)}">
              ${UI.esc(line.name)}
            </option>
          `
        )
        .join("");


    this.populateOperations();
  },


  /* ---------------------------------------------------------
     POPULATE OPERATIONS
     --------------------------------------------------------- */

  populateOperations() {

    const lineSelect =
      document.getElementById("replaceLine");

    const operationSelect =
      document.getElementById("replaceOperation");

    if (!lineSelect || !operationSelect) {
      return;
    }


    const lineId =
      lineSelect.value;

    const operations =
      (AppData.data.operations || {})[lineId] || [];


    operationSelect.innerHTML =
      operations.length

        ? operations
            .map(operation => {

              const operationName =
                typeof operation === "string"
                  ? operation
                  : operation.name;

              return `
                <option
                  value="${UI.esc(operationName)}"
                >
                  ${UI.esc(operationName)}
                </option>
              `;

            })
            .join("")

        : `
            <option value="">
              Belum ada operation
            </option>
          `;


    Replacement.render();
  },


  /* =========================================================
     RENDER ALL
     ========================================================= */

  renderAll() {

    this.renderKpi();

    this.renderLines();

    this.renderMembers();

    this.renderLineTable();

    this.renderHistory();

    Replacement.render();


    if (!LineManager.selectedLineId) {

      LineManager.selectedLineId =
        AppData.data.lines?.[0]?.id || null;

    }


    LineManager.renderLineList();

    LineManager.renderDashboardRanking();
  },


  /* =========================================================
     KPI
     ========================================================= */

  renderKpi() {

    const data =
      AppData.data;

    const memberCount =
      (data.members || []).length;

    const available =
      (data.members || [])
        .filter(
          member =>
            member.availability === "available"
        )
        .length;

    const assigned =
      (data.assignments || []).length;

    const lineCount =
      (data.lines || []).length;


    const kpiGrid =
      document.getElementById("kpiGrid");

    if (!kpiGrid) {
      return;
    }


    kpiGrid.innerHTML = [

      ["Total Member", memberCount, "👥"],

      ["Siap Replace", available, "✓"],

      ["Sedang Ditugaskan", assigned, "↗"],

      ["Total Line", lineCount, "▦"]

    ]
      .map(item =>

        `
          <div class="kpi">

            <div class="label">
              ${item[2]} ${item[0]}
            </div>

            <div class="value">
              ${item[1]}
            </div>

          </div>
        `

      )
      .join("");
  },


  /* =========================================================
     RENDER LINES
     ========================================================= */

  renderLines() {

    LineManager.renderLineList();

  },


  /* =========================================================
     RENDER MEMBERS
     ========================================================= */

  renderMembers() {

    const searchInput =
      document.getElementById("memberSearch");

    const statusInput =
      document.getElementById("memberStatus");

    const memberTable =
      document.getElementById("memberTable");


    if (!memberTable) {
      return;
    }


    const query =
      (searchInput?.value || "")
        .toLowerCase()
        .trim();

    const status =
      statusInput?.value || "";


    const rows =
      (AppData.data.members || [])
        .filter(member => {

          const memberName =
            String(member.name || "")
              .toLowerCase();

          const memberId =
            String(member.id || "")
              .toLowerCase();


          return (

            (
              !query ||
              memberName.includes(query) ||
              memberId.includes(query)
            )

            &&

            (
              !status ||
              member.status === status
            )

          );

        });


    /* -------------------------------------------------------
       EMPTY
       ------------------------------------------------------- */

    if (!rows.length) {

      memberTable.innerHTML = `
        <div class="empty">
          Member tidak ditemukan.
        </div>
      `;

      return;
    }


    /* -------------------------------------------------------
       TABLE
       ------------------------------------------------------- */

    memberTable.innerHTML = `

      <div class="table-wrap">

        <table class="table">

          <thead>

            <tr>

              <th>Member</th>

              <th>Status</th>

              <th>Ketersediaan</th>

              <th>Skill</th>

              <th>Aksi</th>

            </tr>

          </thead>


          <tbody>

            ${rows.map(member => `

              <tr>

                <td>

                  <div class="member-cell">

                    ${UI.photo(member)}

                    <div>

                      <strong>
                        ${UI.esc(member.name)}
                      </strong>

                      <div class="muted">
                        ${UI.esc(member.id)}
                      </div>

                    </div>

                  </div>

                </td>


                <td>
                  ${UI.esc(member.status)}
                </td>


                <td>

                  <span
                    class="pill ${
                      member.availability === "available"
                        ? "green"
                        : "red"
                    }"
                  >

                    ${
                      member.availability === "available"
                        ? "Tersedia"
                        : "Tidak tersedia"
                    }

                  </span>

                </td>


                <td>

                  <div class="skill-mini">

                    ${
                      Object.entries(
                        member.skills || {}
                      )
                      .map(
                        ([key, value]) => `
                          <span class="skill-dot">
                            ${UI.esc(key)}: ${value}
                          </span>
                        `
                      )
                      .join("")
                      || "-"
                    }

                  </div>

                </td>


                <td>

                  <!--
                    Tidak lagi menggunakan onclick inline.
                    Event akan ditangkap oleh #memberTable.
                  -->

                  <button
                    type="button"
                    class="primary edit-member-btn"
                    data-edit-member="${UI.esc(member.id)}"
                  >
                    Edit
                  </button>

                </td>

              </tr>

            `).join("")}

          </tbody>

        </table>

      </div>

    `;
  },


  /* =========================================================
     RENDER LINE TABLE
     ========================================================= */

  renderLineTable() {

    const rows =
      AppData.data.lines || [];

    const linesTable =
      document.getElementById("linesTable");

    if (!linesTable) {
      return;
    }


    linesTable.innerHTML =
      rows.length

        ? `

          <div class="table-wrap">

            <table class="table">

              <thead>

                <tr>
                  <th>Line</th>
                  <th>Member Standar</th>
                  <th>Operation</th>
                  <th>Aksi</th>
                </tr>

              </thead>

              <tbody>

                ${rows.map(line => {

                  const operationCount =
                    (
                      AppData.data.operations?.[line.id]
                      || []
                    ).length;


                  return `

                    <tr>

                      <td>
                        <strong>
                          ${UI.esc(line.name)}
                        </strong>
                      </td>

                      <td>
                        ${line.standardMembers}
                      </td>

                      <td>
                        ${operationCount}
                      </td>

                      <td>

                        <button
                          class="secondary"
                          onclick="LineManager.openEditModal('${UI.esc(line.id)}')"
                        >
                          Edit
                        </button>

                        <button
                          class="secondary danger-text"
                          onclick="LineManager.remove('${UI.esc(line.id)}')"
                        >
                          Hapus
                        </button>

                      </td>

                    </tr>

                  `;

                }).join("")}

              </tbody>

            </table>

          </div>

        `

        : `

          <div class="empty">
            Belum ada line.
          </div>

        `;
  },


  /* =========================================================
     HISTORY
     ========================================================= */

  renderHistory() {

    const rows =
      AppData.data.assignments || [];

    const historyTable =
      document.getElementById("historyTable");

    if (!historyTable) {
      return;
    }


    historyTable.innerHTML =
      rows.length

        ? `

          <div class="table-wrap">

            <table class="table">

              <thead>

                <tr>

                  <th>Tanggal</th>

                  <th>Member</th>

                  <th>Line</th>

                  <th>Operation</th>

                  <th>Alasan</th>

                </tr>

              </thead>


              <tbody>

                ${
                  rows
                    .slice()
                    .reverse()
                    .map(item => {

                      const line =
                        (
                          AppData.data.lines.find(
                            line =>
                              line.id === item.lineId
                          )
                          || {}
                        ).name
                        || item.lineId;


                      return `

                        <tr>

                          <td>
                            ${
                              new Date(
                                item.date
                              ).toLocaleString(
                                "id-ID"
                              )
                            }
                          </td>

                          <td>
                            <strong>
                              ${UI.esc(item.memberName)}
                            </strong>
                          </td>

                          <td>
                            ${UI.esc(line)}
                          </td>

                          <td>
                            ${UI.esc(item.operation || "-")}
                          </td>

                          <td>
                            ${UI.esc(item.reason)}
                          </td>

                        </tr>

                      `;

                    })
                    .join("")
                }

              </tbody>

            </table>

          </div>

        `

        : `

          <div class="empty">
            Belum ada riwayat replacement.
          </div>

        `;
  },


  /* =========================================================
     PHOTO PREVIEW
     ========================================================= */

  previewPhoto(event) {

    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }


    if (file.size > 1024 * 1024) {

      UI.toast(
        "Foto maksimal 1 MB sebelum diproses."
      );

      event.target.value = "";

      return;
    }


    const reader =
      new FileReader();


    reader.onload = () => {

      const preview =
        document.getElementById(
          "photoPreview"
        );

      if (!preview) {
        return;
      }


      preview.innerHTML = `
        <img
          src="${reader.result}"
          alt="Preview foto"
        >
      `;

    };


    reader.onerror = () => {

      UI.toast(
        "Gagal membaca foto."
      );

    };


    reader.readAsDataURL(file);
  }

};


/* =========================================================
   START APPLICATION
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => App.init()
);
