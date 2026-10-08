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
      "SUPABASE";

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

  function getSkill(
    memberId,
    stationId
  ) {

    return (
      s.skills.find(
        item =>
          String(item.member_id) ===
          String(memberId) &&

          String(item.station_id) ===
          String(stationId)
      )?.skill_level || 0
    );

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

    $("lineList").innerHTML =

      s.lines
        .filter(
          line =>
            line.active !== false
        )
        .map(line => `

          <button
            class="line-card"
            data-line="${esc(line.id)}"
            type="button"
          >

            <span class="line-icon">
              ▦
            </span>

            <span>

              <b>
                ${esc(line.name)}
              </b>

              <small>
                ${esc(
                  line.area ||
                  "Area belum diisi"
                )}

                ·

                ${
                  s.stations.filter(
                    station =>
                      station.line_id ===
                      line.id
                  ).length
                }

                station
              </small>

            </span>

            <strong>
              ›
            </strong>

          </button>

        `)
        .join("")

      ||

      `<div class="empty">
        Belum ada line.
      </div>`;


    document
      .querySelectorAll(
        "[data-line]"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            s.selectedLine =
              button.dataset.line;


            page(
              "replacement"
            );


            renderReplacement();

          }
        );

      });

  }


  /* =====================================================
     REPLACEMENT
     ===================================================== */

  function renderReplacement() {

    const line =
      s.lines.find(
        item =>
          String(item.id) ===
          String(s.selectedLine)
      );


    $("selectedLine").textContent =
      line?.name ||
      "Pilih line dari dashboard.";


    const stations =
      s.stations.filter(
        station =>
          String(station.line_id) ===
          String(s.selectedLine)
      );


    /* ===================================================
       STATION LIST
       =================================================== */

    $("stationList").innerHTML =

      stations
        .map(station => `

          <button
            class="station-card"
            data-station="${esc(station.id)}"
            type="button"
          >

            <span>

              <b>
                ${esc(station.name)}
              </b>

              <small>
                ${esc(
                  station.position_name ||
                  ""
                )}
              </small>

            </span>

            <strong>
              ›
            </strong>

          </button>

        `)
        .join("")

      ||

      `<div class="empty">
        Belum ada station.
      </div>`;


    /* ===================================================
       STATION SELECT
       =================================================== */

    $("replaceStation").innerHTML =

      stations
        .map(station => `

          <option
            value="${esc(station.id)}"
          >
            ${esc(station.name)}

            ${
              station.position_name
                ? " — " +
                  esc(
                    station.position_name
                  )
                : ""
            }

          </option>

        `)
        .join("");


    /* ===================================================
       STATION BUTTON
       =================================================== */

    document
      .querySelectorAll(
        "[data-station]"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            $("replaceStation").value =
              button.dataset.station;


            renderCandidates();

          }
        );

      });


    renderCandidates();

  }


  /* =====================================================
     CANDIDATE
     ===================================================== */

  function renderCandidates() {

    const stationId =
      $("replaceStation").value;


    const query =
      $("candidateSearch")
        .value
        .trim()
        .toLowerCase();


    if (!stationId) {

      $("candidateList").innerHTML = `

        <div class="empty">

          Pilih station terlebih dahulu.

        </div>

      `;

      return;

    }


    const candidates =

      s.members

        .filter(member => {

          if (!member.active) {
            return false;
          }


          const name =
            String(
              member.name || ""
            ).toLowerCase();


          const reg =
            String(
              member.reg_code || ""
            ).toLowerCase();


          return (
            !query ||
            name.includes(query) ||
            reg.includes(query)
          );

        })


        .map(member => ({

          ...member,

          level:
            getSkill(
              member.id,
              stationId
            )

        }))


        .filter(
          member =>
            member.level > 0
        )


        .sort(
          (a, b) =>

            b.level -
            a.level ||

            String(
              a.name
            ).localeCompare(
              String(b.name)
            )
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
                REG:
                ${esc(member.reg_code)}
              </small>

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
                L${member.level}
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

    const payload = {

      work_date:
        $("changeDate").value,

      shift:
        $("changeShift").value,

      line_id:
        s.selectedLine,

      station_id:
        $("replaceStation").value,

      replacement_member_id:
        $("confirmModal")
          .dataset
          .member,

      reason:
        $("changeReason").value,

      notes:
        $("changeNotes")
          .value
          .trim()

    };


    if (
      !payload.line_id ||
      !payload.station_id ||
      !payload.replacement_member_id
    ) {

      toast(
        "Line, station, dan kandidat wajib dipilih."
      );

      return;

    }


    /* ===================================================
       DEMO
       =================================================== */

    if (
      !SupabaseClient.configured()
    ) {

      s.changes.push({

        id:
          "demo-" +
          Date.now(),

        ...payload

      });


      toast(
        "Demo: replacement dicatat."
      );


      closeModals();

      render();

      return;

    }


    /* ===================================================
       SUPABASE
       =================================================== */

    try {

      await DB.insert(
        "manpower_changes",
        payload
      );


      toast(
        "Replacement berhasil disimpan."
      );


      closeModals();

      await load();

      render();

    } catch (error) {

      console.error(error);

      toast(
        error?.message ||
        "Gagal menyimpan replacement."
      );

    }

  }


  /* =====================================================
     MEMBER LIST
     ===================================================== */

  function renderMembers() {

    const query =
      $("memberSearch")
        .value
        .trim()
        .toLowerCase();


    const rows =
      s.members.filter(
        member => {

          const name =
            String(
              member.name || ""
            ).toLowerCase();


          const reg =
            String(
              member.reg_code || ""
            ).toLowerCase();


          return (
            !query ||
            name.includes(query) ||
            reg.includes(query)
          );

        }
      );


    $("memberList").innerHTML =

      rows
        .map(member => {

          const line =
            s.lines.find(
              item =>
                String(item.id) ===
                String(
                  member.home_line_id
                )
            );


          return `

            <article
              class="member-card"
            >

              <div class="member-info">

                <b>
                  ${esc(member.name)}
                </b>

                <small>
                  REG:
                  ${esc(member.reg_code)}
                </small>

                <small>
                  Status:
                  ${esc(member.status)}
                </small>

                <small>
                  Shift:
                  ${esc(
                    member.shift || "-"
                  )}
                </small>

                <small>
                  Line:
                  ${esc(
                    line?.name || "-"
                  )}
                </small>

              </div>


              <div class="member-actions">

                <button
                  class="secondary small"
                  data-edit-member="${esc(member.id)}"
                  type="button"
                >
                  Edit Member
                </button>


                <button
                  class="secondary small"
                  data-edit-skill="${esc(member.id)}"
                  type="button"
                >
                  Edit Skill
                </button>

              </div>

            </article>

          `;

        })
        .join("")

      ||

      `<div class="empty">
        Member tidak ditemukan.
      </div>`;


    /* ===================================================
       EDIT MEMBER
       =================================================== */

    document
      .querySelectorAll(
        "[data-edit-member]"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            MemberManager.openEditModal(
              button.dataset.editMember
            );

          }
        );

      });


    /* ===================================================
       EDIT SKILL
       =================================================== */

    document
      .querySelectorAll(
        "[data-edit-skill]"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            openSkills(
              button.dataset.editSkill
            );

          }
        );

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


    $("skillMemberName")
      .textContent =
      `${member.name} · ${member.reg_code}`;


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
     HISTORY
     ===================================================== */

  function renderHistory() {

    const rows =
      [...s.changes]
        .sort(
          (a, b) =>
            String(b.work_date)
              .localeCompare(
                String(a.work_date)
              )
        );


    $("historyList").innerHTML =

      rows
        .map(change => {

          const line =
            s.lines.find(
              item =>
                String(item.id) ===
                String(change.line_id)
            );


          const station =
            s.stations.find(
              item =>
                String(item.id) ===
                String(change.station_id)
            );


          const member =
            s.members.find(
              item =>
                String(item.id) ===
                String(
                  change.replacement_member_id
                )
            );


          return `

            <article class="history-card">

              <div>

                <b>
                  ${esc(
                    line?.name || "-"
                  )}

                  ·

                  ${esc(
                    station?.name || "-"
                  )}
                </b>

                <small>
                  ${esc(
                    change.work_date
                  )}

                  · Shift
                  ${esc(
                    change.shift || "-"
                  )}
                </small>

              </div>


              <span>

                ${esc(
                  member?.name || "-"
                )}

                <small>
                  ${esc(
                    change.reason || ""
                  )}
                </small>

              </span>

            </article>

          `;

        })
        .join("")

      ||

      `<div class="empty">
        Belum ada histori.
      </div>`;

  }


  /* =====================================================
     DASHBOARD
     ===================================================== */

  function renderDashboard() {

    $("kpiMembers")
      .textContent =
      s.members.filter(
        member =>
          member.active
      ).length;


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


    $("candidateSearch")
      .addEventListener(
        "input",
        renderCandidates
      );


    $("memberSearch")
      .addEventListener(
        "input",
        renderMembers
      );


    $("replaceStation")
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

    $("loginForm")
      .addEventListener(
        "submit",
        async event => {

          event.preventDefault();


          try {

            await DB.signIn(
              $("loginEmail").value,
              $("loginPassword").value
            );


            $("loginModal")
              .classList
              .remove("open");


            toast(
              "Login berhasil."
            );


            await load();

            render();

          } catch (error) {

            toast(
              error?.message ||
              "Login gagal."
            );

          }

        }
      );

  }


  /* =====================================================
     AUTH
     ===================================================== */

  async function auth() {

    if (
      !SupabaseClient.configured() ||
      !APP_CONFIG.REQUIRE_AUTH
    ) {

      return;

    }


    const {
      data
    } =
      await SupabaseClient
        .init()
        .auth
        .getSession();


    if (!data.session) {

      $("loginModal")
        .classList
        .add("open");

    }

  }


  /* =====================================================
     START
     ===================================================== */

  window.addEventListener(
    "DOMContentLoaded",
    async () => {

      bind();


      await auth();


      try {

        await load();

        render();

      } catch (error) {

        console.error(error);

        toast(
          error?.message ||
          "Gagal memuat data."
        );

      }

    }
  );

})();
