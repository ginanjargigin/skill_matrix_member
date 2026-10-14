window.MasterManager = (() => {

  let getState = null;
  let refresh = null;
  let lineProcessDraft = [];
  let lineProcessOriginal = [];

  /* =====================================================
     CONFIG
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
     HELPERS
     ===================================================== */

  const $ = id =>
    document.getElementById(id);


  function toast(message) {

    if (
      window.App &&
      typeof window.App.toast === "function"
    ) {

      window.App.toast(message);

    }

  }


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
     RENDER ALL
     ===================================================== */

  function render() {
    renderLines();


  }


  /* =====================================================
     RENDER LINE
     ===================================================== */

 function renderLines() {
  const s = state();
  const container = $("masterLineList");
  const search = $("masterLineSearch");

  if (!s || !container) return;

  const keyword = String(search?.value || "")
    .trim()
    .toLowerCase();

  const lines = [...(s.lines || [])]
    .sort((a, b) =>
      String(a.name || "").localeCompare(
        String(b.name || ""),
        undefined,
        { numeric: true }
      )
    )
    .filter(line =>
      String(line.name || "")
        .toLowerCase()
        .includes(keyword)
    );

  if (!lines.length) {
    container.innerHTML = `
      <div class="empty">
        ${keyword
          ? "Line tidak ditemukan."
          : "Belum ada Line."}
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="master-line-list">
      ${lines.map(line => {
        const stations = (s.stations || [])
          .filter(station =>
            String(station.line_id) === String(line.id)
          )
          .sort((a, b) =>
            String(a.name || "").localeCompare(
              String(b.name || ""),
              undefined,
              { numeric: true }
            )
          );

        return `
          <article class="master-line-group">

            <div class="master-line-summary">

              <div class="master-line-toggle">
                <div>
                  <span class="master-line-name">
                    ${esc(line.name)}
                  </span>

                  <span class="master-line-meta">
                    Standard Manpower:
                    ${Number(line.standard_members || 0)}
                    &nbsp;·&nbsp;
                    ${stations.length} proses
                  </span>
                </div>
              </div>

              <div class="master-line-actions">
                <button
                  class="secondary small"
                  type="button"
                  data-edit-line="${esc(line.id)}"
                >
                  Edit Line
                </button>

                <button
                  class="danger small"
                  type="button"
                  data-delete-line="${esc(line.id)}"
                >
                  Hapus
                </button>
              </div>

            </div>

            <div class="master-process-list">
              ${stations.length
                ? stations.map(station => `
                    <div class="master-process-row">

                      <div>
                        <div class="master-process-name">
                          ${esc(station.name)}
                        </div>

                        <small class="master-process-meta">
                          ${esc(station.position_name || "Tanpa keterangan")}
                        </small>
                      </div>

                      <div class="master-process-actions">
                        <button
                          class="secondary small"
                          type="button"
                          data-edit-station="${esc(station.id)}"
                        >
                          Edit
                        </button>

                        <button
                          class="danger small"
                          type="button"
                          data-delete-station="${esc(station.id)}"
                        >
                          Hapus
                        </button>
                      </div>

                    </div>
                  `).join("")
                : `
                    <div class="empty">
                      Belum ada proses pada Line ini.
                    </div>
                  `
              }
            </div>

          </article>
        `;
      }).join("")}
    </div>
  `;

  container.querySelectorAll("[data-edit-line]")
    .forEach(button => {
      button.addEventListener("click", () => {
        openLineEdit(button.dataset.editLine);
      });
    });

  container.querySelectorAll("[data-delete-line]")
    .forEach(button => {
      button.addEventListener("click", () => {
        deleteLine(button.dataset.deleteLine);
      });
    });

  container.querySelectorAll("[data-edit-station]")
    .forEach(button => {
      button.addEventListener("click", () => {
        openStationEdit(button.dataset.editStation);
      });
    });

  container.querySelectorAll("[data-delete-station]")
    .forEach(button => {
      button.addEventListener("click", () => {
        deleteStation(button.dataset.deleteStation);
      });
    });
}

  /* =====================================================
     RENDER STATION
     ===================================================== */

  function renderStations() {

    const s = state();

    const container =
      $("masterStationList");

    if (!s || !container) {
      return;
    }


    const stations =
      [...s.stations].sort(
        (a, b) => {

          const lineA =
            s.lines.find(
              line =>
                String(line.id) ===
                String(a.line_id)
            );


          const lineB =
            s.lines.find(
              line =>
                String(line.id) ===
                String(b.line_id)
            );


          return (

            String(lineA?.name || "")
              .localeCompare(
                String(lineB?.name || "")
              ) ||

            String(a.name || "")
              .localeCompare(
                String(b.name || "")
              )

          );

        }
      );


    container.innerHTML =

      stations
        .map(station => {

          const line =
            s.lines.find(
              item =>
                String(item.id) ===
                String(station.line_id)
            );


          return `

            <article class="master-item">

              <div class="master-item-info">

                <div class="master-item-title">

                  <strong>
                    ${esc(station.name)}
                  </strong>

                  <span
                    class="status-badge ${
                      station.active !== false
                        ? "active"
                        : "inactive"
                    }"
                  >
                    ${
                      station.active !== false
                        ? "AKTIF"
                        : "NONAKTIF"
                    }
                  </span>

                </div>


                <small>
                  Line:
                  ${esc(line?.name || "-")}
                </small>


                <small>
                  Position:
                  ${esc(
                    station.position_name || "-"
                  )}
                </small>

              </div>


              <div class="master-actions">

                <button
                  class="secondary small"
                  type="button"
                  data-edit-station="${esc(station.id)}"
                >
                  Edit
                </button>


                <button
                  class="danger small"
                  type="button"
                  data-delete-station="${esc(station.id)}"
                >
                  Hapus
                </button>

              </div>

            </article>

          `;

        })
        .join("")


      ||

      `
        <div class="empty">
          Belum ada Station.
        </div>
      `;


    container
      .querySelectorAll(
        "[data-edit-station]"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            openStationEdit(
              button.dataset.editStation
            );

          }
        );

      });


    container
      .querySelectorAll(
        "[data-delete-station]"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            deleteStation(
              button.dataset.deleteStation
            );

          }
        );

      });

  }


  /* =====================================================
     LINE SELECT FOR STATION
     ===================================================== */

  function populateLineSelect(
    selected = ""
  ) {

    const s = state();

    const select =
      $("stationLineId");

    if (!s || !select) {
      return;
    }


    const lines =
      s.lines
        .filter(
          line =>
            line.active !== false
        )
        .sort(
          (a, b) =>
            String(a.name || "")
              .localeCompare(
                String(b.name || "")
              )
        );


    select.innerHTML =

      `
        <option value="">
          Pilih Line
        </option>
      ` +

      lines
        .map(line => `

          <option value="${esc(line.id)}">
            ${esc(line.name)}
          </option>

        `)
        .join("");


    select.value =
      selected || "";

  }

   
/* =====================================================
   LINE PROCESS EDITOR
   ===================================================== */

function renderLineProcesses() {
  const container = $("lineStationList");
  if (!container) return;

  container.innerHTML = lineProcessDraft.length
    ? lineProcessDraft.map((process, index) => `
        <div class="line-process-item">
          <span class="line-process-number">
            ${index + 1}
          </span>

          <strong>Proses ${index + 1}</strong>

          <button
            type="button"
            class="danger small"
            data-remove-process="${index}"
          >
            Hapus
          </button>
        </div>
      `).join("")
    : `<div class="empty">Belum ada proses.</div>`;

  container.querySelectorAll("[data-remove-process]")
    .forEach(button => {
      button.addEventListener("click", () => {
        const index = Number(button.dataset.removeProcess);

        if (!Number.isInteger(index)) return;

        lineProcessDraft.splice(index, 1);
        renderLineProcesses();
      });
    });
}

function addLineProcess() {
  lineProcessDraft.push({
    id: null,
    active: true
  });

  renderLineProcesses();
}

/* =====================================================
   SAVE LINE PROCESSES
   ===================================================== */

async function saveLineProcesses(lineId) {
  const s = state();

  if (!s || !lineId) {
    throw new Error("Line belum tersimpan.");
  }

  const keptIds = new Set(
    lineProcessDraft
      .filter(process => process.id)
      .map(process => String(process.id))
  );

  const removed = lineProcessOriginal.filter(
    process => !keptIds.has(String(process.id))
  );

 
  // Proses yang dikeluarkan dari daftar akan diarsipkan,
  // bukan dihapus, agar skill dan riwayat tetap terhubung.
  for (const process of removed) {
    await DB.update("stations", process.id, {
      active: false
    });
  }

  // bentrok nama ketika urutan proses berubah.
  for (const process of lineProcessDraft) {
    if (process.id) {
      await DB.update("stations", process.id, {
        name: `__TEMP_PROCESS_${process.id}`,
        position_name: null
      });
    }
  }

  // Simpan nama berdasarkan urutan terbaru.
  for (let index = 0; index < lineProcessDraft.length; index++) {
    const process = lineProcessDraft[index];

    const payload = {
      line_id: lineId,
      name: `Proses ${index + 1}`,
      position_name: null,
      active: process.active !== false
    };

    if (process.id) {
      await DB.update("stations", process.id, payload);
    } else {
      await DB.insert("stations", payload);
    }
  }
}


  /* =====================================================
     ADD LINE
     ===================================================== */

 
function openAddLine() {
  const form = $("lineForm");
  if (!form) return;

  form.reset();

  $("lineEditId").value = "";
  $("lineModalTitle").textContent = "Tambah Line";
  $("lineModalSubtitle").textContent =
    "Isi nama line dan tambahkan proses kerja.";

  $("lineStandardMembers").value = 0;
  $("lineActive").checked = true;

  lineProcessDraft = [];
  lineProcessOriginal = [];

  renderLineProcesses();

  $("lineModal").classList.add("open");

  setTimeout(() => $("lineName")?.focus(), 80);
}



  /* =====================================================
     EDIT LINE
     ===================================================== */

  
function openLineEdit(id) {
  const s = state();

  const line = s?.lines.find(
    item => String(item.id) === String(id)
  );

  if (!line) {
    toast("Line tidak ditemukan.");
    return;
  }

  $("lineEditId").value = line.id;
  $("lineName").value = line.name || "";

  $("lineStandardMembers").value =
    Number(line.standard_members || 0);

  $("lineActive").checked = line.active !== false;

  $("lineModalTitle").textContent = "Edit Line";
  $("lineModalSubtitle").textContent =
    "Kelola nama line, proses, dan standard member.";

 lineProcessOriginal = s.stations
  .filter(
    station =>
      String(station.line_id) === String(line.id) &&
      station.active !== false
  )
    .sort((a, b) =>
      String(a.name || "").localeCompare(
        String(b.name || ""),
        undefined,
        { numeric: true }
      )
    )
    .map(station => ({ ...station }));

  lineProcessDraft = lineProcessOriginal.map(
    station => ({ ...station })
  );

  renderLineProcesses();

  $("lineModal").classList.add("open");

  setTimeout(() => $("lineName")?.focus(), 80);
}

  /* =====================================================
     SAVE LINE
     ===================================================== */

 
async function saveLine(event) {
  event?.preventDefault();

  const s = state();
  if (!s) return;

  const id = $("lineEditId").value || null;
  const name = $("lineName").value.trim();

  const standardMembers = Number(
    $("lineStandardMembers").value || 0
  );

  const active = $("lineActive").checked;

if (!name) {
  toast("Nama Line wajib diisi.");
  $("lineName").focus();
  return;
}

if (
  !Number.isInteger(standardMembers) ||
  standardMembers < 1
) {
  toast("Standard Manpower wajib diisi minimal 1.");
  $("lineStandardMembers").focus();
  return;
}

if (!lineProcessDraft.length) {
  toast("Tambahkan minimal satu proses sebelum menyimpan Line.");
  $("lineAddStationBtn").focus();
  return;
}

  const duplicate = s.lines.find(line =>
    String(line.name || "").trim().toLowerCase() ===
      name.toLowerCase() &&
    String(line.id) !== String(id)
  );

  if (duplicate) {
    toast("Nama Line sudah digunakan.");
    return;
  }

  const payload = {
    name,
    standard_members: standardMembers,
    active
  };

  const button = $("lineSave");
  if (button) button.disabled = true;

  try {
    let lineId = id;

    if (id) {
      await DB.update("lines", id, payload);
    } else {
      const created = await DB.insert("lines", payload);
      lineId = created?.id;

      if (!lineId) {
        throw new Error(
          "ID Line tidak ditemukan setelah penyimpanan."
        );
      }
    }

    await saveLineProcesses(lineId);

    toast(
      id
        ? "Line dan proses berhasil diperbarui."
        : "Line dan proses berhasil ditambahkan."
    );

    closeLineModal();

    if (refresh) {
      await refresh();
    }
  } catch (error) {
    console.error("Line save error:", error);

    toast(
      error?.message || "Gagal menyimpan Line."
    );
  } finally {
    if (button) button.disabled = false;
  }
}


  /* =====================================================
     DELETE LINE
     ===================================================== */

 
async function deleteLine(id) {
  const s = state();

  const line = s?.lines.find(
    item => String(item.id) === String(id)
  );

  if (!line) {
    toast("Line tidak ditemukan.");
    return;
  }

  if (line.active === false) {
    toast("Line ini sudah diarsipkan.");
    return;
  }

  const lineStations = (s.stations || []).filter(
    station => String(station.line_id) === String(id)
  );

  if (!window.confirm(
    `Arsipkan line "${line.name}"?\n\n` +
    "Line dan seluruh prosesnya akan dinonaktifkan. " +
    "Data skill dan riwayat tetap dipertahankan."
  )) {
    return;
  }

  try {
    // Nonaktifkan line terlebih dahulu.
    await DB.update("lines", id, {
      active: false
    });

    // Nonaktifkan semua proses pada line.
    for (const station of lineStations) {
      if (station.active !== false) {
        await DB.update("stations", station.id, {
          active: false
        });
      }
    }

    toast("Line dan prosesnya berhasil diarsipkan.");

    if (refresh) await refresh();
  } catch (error) {
    console.error("Line archive error:", error);
    toast(
      error?.message ||
      "Pengarsipan gagal. Periksa status line dan prosesnya."
    );
  }
}


  /* =====================================================
     ADD STATION
     ===================================================== */

  function openAddStation() {

    const form =
      $("stationForm");

    if (!form) {
      return;
    }


    form.reset();


    $("stationEditId").value =
      "";


    $("stationModalTitle").textContent =
      "Tambah Station";


    $("stationModalSubtitle").textContent =
      "Tambahkan station ke Line.";


    populateLineSelect();


    $("stationActive").checked =
      true;


    $("stationModal")
      .classList
      .add("open");


    setTimeout(() => {

      $("stationLineId")?.focus();

    }, 80);

  }


  /* =====================================================
     EDIT STATION
     ===================================================== */

  function openStationEdit(id) {

    const s = state();

    const station =
      s?.stations.find(
        item =>
          String(item.id) ===
          String(id)
      );


    if (!station) {

      toast(
        "Station tidak ditemukan."
      );

      return;

    }


    $("stationEditId").value =
      station.id;


    populateLineSelect(
      station.line_id
    );


    $("stationName").value =
      station.name || "";


    $("stationPosition").value =
      station.position_name || "";


    $("stationActive").checked =
      station.active !== false;


    $("stationModalTitle").textContent =
      "Edit Station";


    $("stationModalSubtitle").textContent =
      "Perbarui data station.";


    $("stationModal")
      .classList
      .add("open");


    setTimeout(() => {

      $("stationName")?.focus();

    }, 80);

  }


  /* =====================================================
     SAVE STATION
     ===================================================== */

  async function saveStation(event) {

    event?.preventDefault();


    const s = state();

    if (!s) {
      return;
    }


    const id =
      $("stationEditId").value || null;


    const lineId =
      $("stationLineId").value;


    const name =
      $("stationName")
        .value
        .trim();


    const position =
      $("stationPosition")
        .value
        .trim();


    const active =
      $("stationActive").checked;


    if (!lineId) {

      toast(
        "Line wajib dipilih."
      );

      return;

    }


    if (!name) {

      toast(
        "Nama Station wajib diisi."
      );

      return;

    }


    const duplicate =
      s.stations.find(station => (

        String(station.line_id) ===
        String(lineId)

        &&

        String(station.name || "")
          .trim()
          .toLowerCase() ===
        name.toLowerCase()

        &&

        String(station.id) !==
        String(id)

      ));


    if (duplicate) {

      toast(
        "Station dengan nama tersebut sudah ada di Line ini."
      );

      return;

    }


    const payload = {

      line_id:
        lineId,

      name,

      position_name:
        position || null,

      active

    };


    const button =
      $("stationSave");


    if (button) {
      button.disabled = true;
    }


    try {

      if (id) {

        await DB.update(
          "stations",
          id,
          payload
        );


        toast(
          "Station berhasil diperbarui."
        );

      } else {

        await DB.insert(
          "stations",
          payload
        );


        toast(
          "Station berhasil ditambahkan."
        );

      }


      closeStationModal();


      if (refresh) {
        await refresh();
      }

    } catch (error) {

      console.error(
        "Station save error:",
        error
      );


      toast(
        error?.message ||
        "Gagal menyimpan Station."
      );

    } finally {

      if (button) {
        button.disabled = false;
      }

    }

  }


  /* =====================================================
     DELETE STATION
     ===================================================== */


async function deleteStation(id) {
  const s = state();

  const station = s?.stations.find(
    item => String(item.id) === String(id)
  );

  if (!station) {
    toast("Station tidak ditemukan.");
    return;
  }

  if (station.active === false) {
    toast("Station ini sudah diarsipkan.");
    return;
  }

  if (!window.confirm(
    `Arsipkan "${station.name}"?\n\n` +
    "Data skill dan riwayat akan tetap disimpan. " +
    "Station tidak lagi digunakan untuk pekerjaan baru."
  )) {
    return;
  }

  try {
    await DB.update("stations", id, {
      active: false
    });

    toast("Station berhasil diarsipkan.");

    if (refresh) await refresh();
  } catch (error) {
    console.error("Station archive error:", error);
    toast(error?.message || "Gagal mengarsipkan station.");
  }
}

  /* ===================================================
     CEK DATA SKILL
     =================================================== */

  const skillCount =
    (s.skills || [])
      .filter(
        skill =>
          String(skill.station_id) ===
          String(id)
      )
      .length;


  if (skillCount > 0) {

    toast(
      `Station "${station.name}" tidak dapat dihapus karena masih memiliki ${skillCount} data skill.`
    );

    return;

  }


  /* ===================================================
     KONFIRMASI
     =================================================== */

  if (
    !window.confirm(
      `Hapus Station "${station.name}"?`
    )
  ) {

    return;

  }


  try {

    await DB.remove(
      "stations",
      id
    );


    toast(
      "Station berhasil dihapus."
    );


    if (refresh) {

      await refresh();

    }


  } catch (error) {

    console.error(
      "Station delete error:",
      error
    );


    toast(
      error?.message ||
      "Gagal menghapus Station."
    );

  }

}

  /* =====================================================
     CLOSE MODALS
     ===================================================== */

  function closeLineModal() {

    $("lineModal")
      ?.classList
      .remove("open");

  }


  function closeStationModal() {

    $("stationModal")
      ?.classList
      .remove("open");

  }


  /* =====================================================
     BIND EVENTS
     ===================================================== */

  function bind() {

  const searchInput = $("masterLineSearch");

if (searchInput && !searchInput.dataset.bound) {
  searchInput.dataset.bound = "true";

  searchInput.addEventListener("input", () => {
    renderLines();
  });
}

    $("addLineBtn")
      ?.addEventListener(
        "click",
        openAddLine
      );


    $("lineCancel")
      ?.addEventListener(
        "click",
        closeLineModal
      );


    $("lineCancel2")
      ?.addEventListener(
        "click",
        closeLineModal
      );


    $("lineForm")
      ?.addEventListener(
        "submit",
        saveLine
      );


 $("lineAddStationBtn")
  ?.addEventListener(
    "click",
    addLineProcess
  );


    $("stationCancel")
      ?.addEventListener(
        "click",
        closeStationModal
      );


    $("stationCancel2")
      ?.addEventListener(
        "click",
        closeStationModal
      );


    $("stationForm")
      ?.addEventListener(
        "submit",
        saveStation
      );


    $("lineModal")
      ?.addEventListener(
        "click",
        event => {

          if (
            event.target ===
            $("lineModal")
          ) {

            closeLineModal();

          }

        }
      );


    $("stationModal")
      ?.addEventListener(
        "click",
        event => {

          if (
            event.target ===
            $("stationModal")
          ) {

            closeStationModal();

          }

        }
      );

  }


  return {

    configure,

    bind,

    render,

    openAddLine,

    openAddStation,

    closeLineModal,

    closeStationModal

  };

})();
