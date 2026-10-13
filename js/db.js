window.DB = (() => {
  const demo = () => window.DEMO_DATA;
  const client = () => SupabaseClient.init();

  /* =========================
     LIST
     ========================= */
  async function list(table, order = "created_at") {
    if (!SupabaseClient.configured()) {
      return demo()?.[table] || [];
    }

    const { data, error } = await client()
      .from(table)
      .select("*")
      .order(order, { ascending: true });

    if (error) {
      console.error("DB.list error:", table, error);
      throw error;
    }

    return data || [];
  }

  /* =========================
     INSERT
     ========================= */
  async function insert(table, payload) {
    if (!SupabaseClient.configured()) {
      return payload;
    }

    const { data, error } = await client()
      .from(table)
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /* =========================
     UPDATE
     ========================= */
  async function update(table, id, payload) {
    if (!SupabaseClient.configured()) {
      return { ...payload, id };
    }

    const { data, error } = await client()
      .from(table)
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /* =========================
     SAVE / UPSERT SINGLE
     Tetap tersedia untuk kode lama.
     ========================= */
  async function save(table, payload) {
    if (!SupabaseClient.configured()) {
      return payload;
    }

    const options = table === "member_skills"
      ? { onConflict: "member_id,station_id" }
      : {};

    const { data, error } = await client()
      .from(table)
      .upsert(payload, options)
      .select()
      .single();

    if (error) {
      console.error("DB.save error:", table, error);
      throw error;
    }

    return data;
  }

  /* =========================
     SAVE MANY / BATCH UPSERT
     Untuk menyimpan banyak skill
     dalam satu permintaan.
     ========================= */
  async function saveMany(table, payloads) {
    if (!Array.isArray(payloads)) {
      throw new TypeError("saveMany membutuhkan array data.");
    }

    if (payloads.length === 0) {
      return [];
    }

    if (!SupabaseClient.configured()) {
      return payloads;
    }

    const options = table === "member_skills"
      ? { onConflict: "member_id,station_id" }
      : {};

    const { data, error } = await client()
      .from(table)
      .upsert(payloads, options)
      .select();

    if (error) {
      console.error("DB.saveMany error:", table, error);
      throw error;
    }

    return data || [];
  }

  /* =========================
     DELETE
     ========================= */
  async function remove(table, id) {
    if (!SupabaseClient.configured()) {
      return true;
    }

    const { error } = await client()
      .from(table)
      .delete()
      .eq("id", id);

    if (error) throw error;
    return true;
  }

  /* =========================
     LOGIN
     ========================= */
  async function signIn(email, password) {
    const { error } = await client()
      .auth
      .signInWithPassword({ email, password });

    if (error) throw error;
  }

  /* =========================
     LOGOUT
     ========================= */
  async function signOut() {
    if (!SupabaseClient.configured()) {
      return;
    }

    const { error } = await client()
      .auth
      .signOut();

    if (error) throw error;
  }

  /* =========================
     PUBLIC API
     ========================= */
  return {
    list,
    insert,
    update,
    save,
    saveMany,
    remove,
    signIn,
    signOut
  };
})();
