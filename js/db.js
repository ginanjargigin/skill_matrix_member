
window.DB = (() => {
  const demo = () => window.DEMO_DATA;

  const client = () => {
    const instance = window.SupabaseClient.init();

    if (!instance) {
      throw new Error(
        "Supabase belum dikonfigurasi."
      );
    }

    return instance;
  };

  async function requireSession() {
    const supabase = client();

    const { data, error } =
      await supabase.auth.getSession();

    if (error) {
      throw error;
    }

    if (!data.session) {
      throw new Error(
        "Sesi login tidak ditemukan. Silakan login kembali."
      );
    }

    return supabase;
  }

  /* =========================
     LIST
     ========================= */
  async function list(table, order = "created_at") {
    if (!SupabaseClient.configured()) {
      return demo()?.[table] || [];
    }

    const supabase = await requireSession();

    const { data, error } = await supabase
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

    const supabase = await requireSession();

    const { data, error } = await supabase
      .from(table)
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /* =========================
     UPDATE
     ========================= */
  async function update(table, id, payload) {
    if (!SupabaseClient.configured()) {
      return { ...payload, id };
    }

    const supabase = await requireSession();

    const { data, error } = await supabase
      .from(table)
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /* =========================
     SAVE / UPSERT SINGLE
     ========================= */
  async function save(table, payload) {
    if (!SupabaseClient.configured()) {
      return payload;
    }

    const supabase = await requireSession();

    const options = table === "member_skills"
      ? { onConflict: "member_id,station_id" }
      : {};

    const { data, error } = await supabase
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
     ========================= */
  async function saveMany(table, payloads) {
    if (!Array.isArray(payloads)) {
      throw new TypeError(
        "saveMany membutuhkan array data."
      );
    }

    if (payloads.length === 0) {
      return [];
    }

    if (!SupabaseClient.configured()) {
      return payloads;
    }

    const supabase = await requireSession();

    const options = table === "member_skills"
      ? { onConflict: "member_id,station_id" }
      : {};

    const { data, error } = await supabase
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

    const supabase = await requireSession();

    const { error } = await supabase
      .from(table)
      .delete()
      .eq("id", id);

    if (error) {
      throw error;
    }

    return true;
  }

  /* =========================
     LOGIN
     ========================= */
  async function signIn(email, password) {
    const supabase = client();

    const { data, error } = await supabase.auth
      .signInWithPassword({
        email: email.trim(),
        password
      });

    if (error) {
      throw error;
    }

    if (!data.session) {
      throw new Error(
        "Login tidak menghasilkan sesi yang valid."
      );
    }

    return data.session;
  }

  /* =========================
     LOGOUT
     ========================= */
  async function signOut() {
    if (!SupabaseClient.configured()) {
      return;
    }

    const supabase = client();

    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }
  }

  /* =========================
     AUTH SESSION
     ========================= */
  async function getSession() {
    if (!SupabaseClient.configured()) {
      return null;
    }

    const { data, error } = await client()
      .auth
      .getSession();

    if (error) {
      throw error;
    }

    return data.session || null;
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
    signOut,
    getSession
  };
})();
