/* =========================================================
   MEMBER MANAGER
   ========================================================= */

window.MemberManager = {

  editingId: null,

  /* ---------------------------------------------------------
     GET MEMBER
     --------------------------------------------------------- */

  getMember(id) {
    return (AppData.data.members || []).find(
      member => String(member.id) === String(id)
    ) || null;
  },


  /* ---------------------------------------------------------
     DOM HELPER
     --------------------------------------------------------- */

  getElement(id) {
    return document.getElementById(id);
  },


  /* ---------------------------------------------------------
     OPEN ADD MODAL
     --------------------------------------------------------- */

  openAddModal() {

    this.editingId = null;

    const title = this.getElement("memberModalTitle");
    const form = this.getElement("memberForm");
    const editId = this.getElement("memberEditId");
    const preview = this.getElement("photoPreview");
    const modal = this.getElement("memberModal");

    if (!form || !modal) {
      console.error("Member modal tidak ditemukan.");
      return;
    }

    if (title) {
      title.textContent = "Tambah Member";
    }

    form.reset();

    if (editId) {
      editId.value = "";
    }

    if (preview) {
      preview.innerHTML = "👤";
    }

    this.renderSkillFields({});

    modal.classList.remove("hidden");

    setTimeout(() => {
      const input = this.getElement("newId");

      if (input) {
        input.focus();
      }
    }, 50);
  },


  /* ---------------------------------------------------------
     OPEN EDIT MODAL
     --------------------------------------------------------- */

  openEditModal(id) {

    const member = this.getMember(id);

    if (!member) {
      console.warn("Member tidak ditemukan:", id);
      UI.toast("Data member tidak ditemukan.");
      return;
    }

    this.editingId = member.id;

    const title = this.getElement("memberModalTitle");
    const editId = this.getElement("memberEditId");
    const newId = this.getElement("newId");
    const newName = this.getElement("newName");
    const newStatus = this.getElement("newStatus");
    const preview = this.getElement("photoPreview");
    const modal = this.getElement("memberModal");

    if (!modal) {
      console.error("Element #memberModal tidak ditemukan.");
      return;
    }

    if (title) {
      title.textContent = "Edit Member";
    }

    if (editId) {
      editId.value = member.id;
    }

    if (newId) {
      newId.value = member.id;
    }

    if (newName) {
      newName.value = member.name || "";
    }

    if (newStatus) {
      newStatus.value = member.status || "PERMANENT";
    }

    if (preview) {

      if (member.photoUrl) {

        preview.innerHTML = `
          <img
            src="${UI.esc(member.photoUrl)}"
            alt="${UI.esc(member.name || "Member")}"
          >
        `;

      } else {

        preview.textContent = UI.initials(member.name);

      }
    }

    this.renderSkillFields(member.skills || {});

    modal.classList.remove("hidden");

    setTimeout(() => {

      const input = this.getElement("newName");

      if (input) {
        input.focus();
        input.select();
      }

    }, 50);
  },


  /* ---------------------------------------------------------
     CLOSE MODAL
     --------------------------------------------------------- */

  closeModal() {

    const modal = this.getElement("memberModal");

    if (modal) {
      modal.classList.add("hidden");
    }

    this.editingId = null;
  },


  /* ---------------------------------------------------------
     RENDER SKILL FIELDS
     --------------------------------------------------------- */

  renderSkillFields(skills) {

    const container = this.getElement("memberSkillFields");

    if (!container) {
      console.error("Element #memberSkillFields tidak ditemukan.");
      return;
    }

    const groups = [];

    Object.entries(AppData.data.operations || {}).forEach(
      ([lineId, operations]) => {

        if (!Array.isArray(operations) || !operations.length) {
          return;
        }

        const line = LineManager.getLine(lineId);

        if (!line) {
          return;
        }

        groups.push(`
          <div class="skill-group">

            <div class="skill-group-title">

              <strong>
                ${UI.esc(line.name)}
              </strong>

              <span>
                Update level skill terbaru
              </span>

            </div>

            <div class="skill-edit-grid">

              ${operations.map(operation => {

                const operationName =
                  typeof operation === "string"
                    ? operation
                    : operation.name;

                const value =
                  Number(skills[operationName] || 0);

                return `
                  <label>

                    ${UI.esc(operationName)}

                    <select
                      class="skill-input"
                      data-operation="${UI.esc(operationName)}"
                    >

                      <option
                        value="0"
                        ${value === 0 ? "selected" : ""}
                      >
                        0 — Belum
                      </option>

                      <option
                        value="0.1"
                        ${value === 0.1 ? "selected" : ""}
                      >
                        0.1 — Training
                      </option>

                      <option
                        value="0.2"
                        ${value === 0.2 ? "selected" : ""}
                      >
                        0.2 — Training
                      </option>

                      <option
                        value="1"
                        ${value === 1 ? "selected" : ""}
                      >
                        1 — Qualified
                      </option>

                    </select>

                  </label>
                `;

              }).join("")}

            </div>

          </div>
        `);
      }
    );

    if (groups.length) {

      container.innerHTML = groups.join("");

    } else {

      container.innerHTML = `
        <div class="ranking-empty">

          <strong>
            Belum ada operation
          </strong>

          <span>
            Skill dapat diedit setelah line memiliki operation.
          </span>

        </div>
      `;

    }
  },


  /* ---------------------------------------------------------
     COLLECT SKILLS
     --------------------------------------------------------- */

  collectSkills() {

    const skills = {};

    document
      .querySelectorAll(".skill-input")
      .forEach(input => {

        const operation = input.dataset.operation;

        if (!operation) {
          return;
        }

        skills[operation] = Number(input.value);

      });

    return skills;
  },


  /* ---------------------------------------------------------
     SAVE MEMBER
     --------------------------------------------------------- */

  save(event) {

    if (event) {
      event.preventDefault();
    }

    const idInput = this.getElement("newId");
    const nameInput = this.getElement("newName");
    const statusInput = this.getElement("newStatus");
    const photoInput = this.getElement("photoInput");

    if (!idInput || !nameInput || !statusInput) {
      console.error("Form member tidak lengkap.");
      UI.toast("Form member tidak lengkap.");
      return;
    }

    const id =
      idInput.value
        .trim()
        .toUpperCase();

    const name =
      nameInput.value
        .trim();

    const status =
      statusInput.value;

    const file =
      photoInput?.files?.[0] || null;


    /* -------------------------------------------------------
       VALIDATION
       ------------------------------------------------------- */

    if (!id || !name) {

      UI.toast(
        "No Reg dan nama wajib diisi."
      );

      return;
    }


    /* -------------------------------------------------------
       DUPLICATE CHECK
       ------------------------------------------------------- */

    const duplicate =
      AppData.data.members.some(member => {

        return (
          String(member.id).toUpperCase() === id &&
          String(member.id) !== String(this.editingId)
        );

      });

    if (duplicate) {

      UI.toast(
        "No Reg sudah digunakan."
      );

      return;
    }


    /* -------------------------------------------------------
       FINISH SAVE
       ------------------------------------------------------- */

    const finish = photo => {

      /* =====================================================
         EDIT MEMBER
         ===================================================== */

      if (this.editingId !== null) {

        const member =
          this.getMember(this.editingId);

        if (!member) {

          console.error(
            "Member yang sedang diedit tidak ditemukan:",
            this.editingId
          );

          UI.toast(
            "Member tidak ditemukan."
          );

          return;
        }

        member.id = id;

        member.name = name;

        member.status = status;

        member.skills =
          this.collectSkills();


        /*
         * Foto hanya diganti jika user
         * memilih foto baru.
         */

        if (photo !== null) {

          member.photoUrl = photo;

        }

        UI.toast(
          "Data member dan skill berhasil diperbarui."
        );


      /* =====================================================
         ADD MEMBER
         ===================================================== */

      } else {

        AppData.data.members.push({

          id,

          name,

          status,

          availability: "available",

          photoUrl: photo || "",

          skills:
            this.collectSkills()

        });

        UI.toast(
          "Member berhasil ditambahkan."
        );

      }


      /* -----------------------------------------------------
         SAVE
         ----------------------------------------------------- */

      Storage.save();


      /* -----------------------------------------------------
         CLOSE MODAL
         ----------------------------------------------------- */

      this.closeModal();


      /* -----------------------------------------------------
         RESET FORM
         ----------------------------------------------------- */

      const form =
        this.getElement("memberForm");

      if (form) {
        form.reset();
      }

      const preview =
        this.getElement("photoPreview");

      if (preview) {
        preview.innerHTML = "👤";
      }


      /* -----------------------------------------------------
         REFRESH UI
         ----------------------------------------------------- */

      App.renderAll();
    };


    /* -------------------------------------------------------
       PHOTO PROCESSING
       ------------------------------------------------------- */

    if (file) {

      if (file.size > 1024 * 1024) {

        UI.toast(
          "Foto maksimal 1 MB sebelum diproses."
        );

        return;
      }

      const reader =
        new FileReader();

      reader.onload = () => {

        finish(
          reader.result
        );

      };

      reader.onerror = () => {

        UI.toast(
          "Gagal membaca file foto."
        );

      };

      reader.readAsDataURL(file);

    } else {

      /*
       * Saat edit:
       * null berarti foto lama dipertahankan.
       *
       * Saat tambah:
       * "" berarti belum ada foto.
       */

      finish(
        this.editingId !== null
          ? null
          : ""
      );
    }
  }

};
