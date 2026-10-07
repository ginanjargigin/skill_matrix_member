window.MasterManager = (() => {

  let getState = null;
  let refresh = null;


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
    renderStations();

  }


  /* =====================================================
     RENDER LINE
     ===================================================== */

  function renderLines() {

    const s = state();

    const container =
      $("masterLineList");

    if (!s || !container) {
      return;
    }


    const lines =
      [...s.lines].sort(
        (a, b) =>
          String(a.name || "")
            .localeCompare(
              String(b.name || "")
            )
      );


    container.innerHTML =

      lines
        .map(line => {

          const stationCount =
            s.stations.filter(
              station =>
                String(station.line_id) ===
                String(line.id)
            ).length;


          return `

            <article class="master-item">

              <div class="master-item-info">

                <div class="master-item-title">

                  <strong>
                    ${esc(line.name)}
                  </strong>

                  <span
                    class="status-badge ${
                      line.active !== false
                        ? "active"
                        : "inactive"
                    }"
                  >
                    ${
                      line.active !== false
                        ? "AKTIF"
                        : "NONAKTIF"
                    }
                  </span>

                </div>


                <small>
                  Area:
                  ${esc(line.area || "-")}
                </small>


                <small>
                  Standard Member:
                  ${Number(
                    line.standard_members || 0
                  )}
                </small>


                <small>
                  Station:
                  ${stationCount}
                </small>

              </div>


              <div class="master-actions">

                <button
                  class="secondary small"
                  type="button"
                  data-edit-line="${esc(line.id)}"
                >
                  Edit
                </button>


                <button
                  class="danger small"
                  type="button"
                  data-delete-line="${esc(line.id)}"
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
          Belum ada Line.
        </div>
      `;


    container
      .querySelectorAll(
        "[data-edit-line]"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            openLineEdit(
              button.dataset.editLine
            );

          }
        );

      });


    container
      .querySelectorAll(
        "[data-delete-line]"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            deleteLine(
              button.dataset.deleteLine
            );

          }
        );

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
     ADD LINE
     ===================================================== */

  function openAddLine() {

    const form =
      $("lineForm");

    if (!form) {
      return;
    }


    form.reset();


    $("lineEditId").value =
      "";


    $("lineModalTitle").textContent =
      "Tambah Line";


    $("lineModalSubtitle").textContent =
      "Tambahkan line produksi baru.";


    $("lineStandardMembers").value =
      0;


    $("lineActive").checked =
      true;


    $("lineModal")
      .classList
      .add("open");


    setTimeout(() => {

      $("lineName")?.focus();

    }, 80);

  }


  /* =====================================================
     EDIT LINE
     ===================================================== */

  function openLineEdit(id) {

    const s = state();

    const line =
      s?.lines.find(
        item =>
          String(item.id) ===
          String(id)
      );


    if (!line) {

      toast(
        "Line tidak ditemukan."
      );

      return;

    }


    $("lineEditId").value =
      line.id;


    $("lineName").value =
      line.name || "";


    $("lineArea").value =
      line.area || "";


    $("lineStandardMembers").value =
      Number(
        line.standard_members || 0
      );


    $("lineActive").checked =
      line.active !== false;


    $("lineModalTitle").textContent =
      "Edit Line";


    $("lineModalSubtitle").textContent =
      "Perbarui data line.";


    $("lineModal")
      .classList
      .add("open");


    setTimeout(() => {

      $("lineName")?.focus();

    }, 80);

  }


  /* =====================================================
     SAVE LINE
     ===================================================== */

  async function saveLine(event) {

    event?.preventDefault();


    const s = state();

    if (!s) {
      return;
    }


    const id =
      $("lineEditId").value || null;


    const name =
      $("lineName")
        .value
        .trim();


    const area =
      $("lineArea")
        .value
        .trim();


    const standardMembers =
      Number(
        $("lineStandardMembers").value || 0
      );


    const active =
      $("lineActive").checked;


    if (!name) {

      toast(
        "Nama Line wajib diisi."
      );

      return;

    }


    if (
      !Number.isInteger(
        standardMembers
      ) ||
      standardMembers < 0
    ) {

      toast(
        "Standard Member harus 0 atau lebih."
      );

      return;

    }


    const duplicate =
      s.lines.find(line => (

        String(line.name || "")
          .trim()
          .toLowerCase() ===
        name.toLowerCase()

        &&

        String(line.id) !==
        String(id)

      ));


    if (duplicate) {

      toast(
        "Nama Line sudah digunakan."
      );

      return;

    }


    const payload = {

      name,

      area:
        area || null,

      standard_members:
        standardMembers,

      active

    };


    const button =
      $("lineSave");


    if (button) {
      button.disabled = true;
    }


    try {

      if (id) {

        await DB.update(
          "lines",
          id,
          payload
        );


        toast(
          "Line berhasil diperbarui."
        );

      } else {

        await DB.insert(
          "lines",
          payload
        );


        toast(
          "Line berhasil ditambahkan."
        );

      }


      closeLineModal();


      if (refresh) {
        await refresh();
      }

    } catch (error) {

      console.error(
        "Line save error:",
        error
      );


      toast(
        error?.message ||
        "Gagal menyimpan Line."
      );

    } finally {

      if (button) {
        button.disabled = false;
      }

    }

  }


  /* =====================================================
     DELETE LINE
     ===================================================== */

  async function deleteLine(id) {

    const s = state();

    const line =
      s?.lines.find(
        item =>
          String(item.id) ===
          String(id)
      );


    if (!line) {
      return;
    }


    const stationCount =
      s.stations.filter(
        station =>
          String(station.line_id) ===
          String(id)
      ).length;


    if (stationCount > 0) {

      toast(
        `Line "${line.name}" masih memiliki ${stationCount} station. Hapus station terlebih dahulu.`
      );

      return;

    }


    if (
      !window.confirm(
        `Hapus Line "${line.name}"?`
      )
    ) {

      return;

    }


    try {

      await DB.remove(
        "lines",
        id
      );


      toast(
        "Line berhasil dihapus."
      );


      if (refresh) {
        await refresh();
      }

    } catch (error) {

      console.error(
        "Line delete error:",
        error
      );


      toast(
        error?.message ||
        "Gagal menghapus Line."
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

    const station =
      s?.stations.find(
        item =>
          String(item.id) ===
          String(id)
      );


    if (!station) {
      return;
    }


    if (
      !window.confirm(
        `Hapus Station "${station.name}"?\n\nPastikan station ini tidak lagi dibutuhkan oleh member skill.`
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


    $("addStationBtn")
      ?.addEventListener(
        "click",
        openAddStation
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
