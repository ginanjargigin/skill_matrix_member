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


  /* =====================================================
     OPEN ADD
     ===================================================== */

  function openAddModal() {

    const form =
      $("memberForm");

    if (!form) {
      return;
    }


    $("memberModalTitle").textContent =
      "Tambah Member";


    $("memberModalSubtitle").textContent =
      "Isi data member baru.";


    $("memberEditId").value = "";


    form.reset();


    populateLines();


    $("memberModal")
      .classList
      .add("open");


    setTimeout(() => {

      $("memberRegCode")?.focus();

    }, 80);

  }


  /* =====================================================
     OPEN EDIT
     ===================================================== */

  function openEditModal(id) {

    const s = state();

    const member =
      s?.members.find(
        item =>
          String(item.id) === String(id)
      );


    if (!member) {

      toast(
        "Data member tidak ditemukan."
      );

      return;

    }


    $("memberModalTitle").textContent =
      "Edit Member";


    $("memberModalSubtitle").textContent =
      "Perbarui data identitas member.";


    $("memberEditId").value =
      member.id;


    $("memberRegCode").value =
      member.reg_code || "";


    $("memberName").value =
      member.name || "";


    $("memberStatus").value =
      member.status || "PERMANENT";


    $("memberShift").value =
      member.shift || "";


    populateLines(
      member.home_line_id || ""
    );


    $("memberModal")
      .classList
      .add("open");


    setTimeout(() => {

      $("memberName")?.focus();

      $("memberName")?.select();

    }, 80);

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
     NORMALIZE REG
     ===================================================== */

  function normalizeCode(value) {

    return String(value || "")
      .trim()
      .toUpperCase();

  }


  /* =====================================================
     SAVE
     ===================================================== */

  async function save(event) {

    event?.preventDefault();


    const s = state();

    if (!s) {

      toast(
        "State aplikasi belum siap."
      );

      return;

    }


    const editId =
      $("memberEditId").value || null;


    const regCode =
      normalizeCode(
        $("memberRegCode").value
      );


    const name =
      $("memberName")
        .value
        .trim();


    const status =
      $("memberStatus").value;


    const shift =
      $("memberShift").value || null;


    const homeLineId =
      $("memberHomeLine").value || null;


    /* ===================================================
       VALIDATION
       =================================================== */

    if (!regCode || !name) {

      toast(
        "No Reg dan nama wajib diisi."
      );

      return;

    }


    /* ===================================================
       DUPLICATE CHECK
       =================================================== */

    const duplicate =
      s.members.find(member => {

        const sameCode =
          normalizeCode(
            member.reg_code
          ) === regCode;


        const differentMember =
          String(member.id) !==
          String(editId);


        return (
          sameCode &&
          differentMember
        );

      });


    if (duplicate) {

      toast(
        "No Reg sudah digunakan."
      );

      return;

    }


    /* ===================================================
       PAYLOAD
       =================================================== */

    const payload = {

      reg_code: regCode,

      name,

      status,

      shift,

      home_line_id: homeLineId,

      active: true

    };


    const button =
      $("memberSave");


    if (button) {
      button.disabled = true;
    }


    try {

      /* =================================================
         DEMO
         ================================================= */

      if (!SupabaseClient.configured()) {

        if (editId) {

          const member =
            s.members.find(
              item =>
                String(item.id) ===
                String(editId)
            );


          if (member) {

            Object.assign(
              member,
              payload
            );

          }


          toast(
            "Demo: member diperbarui."
          );

        } else {

          s.members.push({

            id:
              "demo-member-" +
              Date.now(),

            ...payload

          });


          toast(
            "Demo: member ditambahkan."
          );

        }

      }


      /* =================================================
         SUPABASE
         ================================================= */

      else {

        if (editId) {

          await DB.update(
            "members",
            editId,
            payload
          );


          toast(
            "Member berhasil diperbarui."
          );

        } else {

          await DB.insert(
            "members",
            payload
          );


          toast(
            "Member berhasil ditambahkan."
          );

        }

      }


      closeModal();


      if (
        typeof refresh === "function"
      ) {

        await refresh();

      }


    } catch (error) {

      console.error(
        "Member save error:",
        error
      );


      toast(
        error?.message ||
        "Gagal menyimpan member."
      );

    } finally {

      if (button) {
        button.disabled = false;
      }

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

    closeModal,

    populateLines

  };

})();
