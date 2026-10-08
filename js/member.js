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

    $("memberDelete").style.display =
  "none";

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

    $("memberDelete").style.display =
  "inline-flex";


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


  const confirmed =
    window.confirm(

      `Hapus member "${member.name}" (${member.reg_code})?\n\n` +

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
