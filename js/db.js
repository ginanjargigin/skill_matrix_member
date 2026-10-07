window.DB = (() => {

  const demo = () => window.DEMO_DATA;

  const client = () => SupabaseClient.init();


  /* =====================================================
     LIST
     ===================================================== */

  async function list(table, order = "created_at") {

    if (!SupabaseClient.configured()) {
      return demo()[table] || [];
    }

    const {
      data,
      error
    } = await client()
      .from(table)
      .select("*")
      .order(order, {
        ascending: true
      });

    if (error) {
      throw error;
    }

    return data || [];
  }


  /* =====================================================
     INSERT
     ===================================================== */

  async function insert(table, payload) {

    if (!SupabaseClient.configured()) {
      return payload;
    }

    const {
      data,
      error
    } = await client()
      .from(table)
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }


  /* =====================================================
     UPDATE
     ===================================================== */

  async function update(table, id, payload) {

    if (!SupabaseClient.configured()) {
      return {
        ...payload,
        id
      };
    }

    const {
      data,
      error
    } = await client()
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


  /* =====================================================
     UPSERT
     ===================================================== */

  async function save(table, payload) {

    if (!SupabaseClient.configured()) {
      return payload;
    }

    const {
      data,
      error
    } = await client()
      .from(table)
      .upsert(payload)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }


  /* =====================================================
     DELETE
     ===================================================== */

  async function remove(table, id) {

    if (!SupabaseClient.configured()) {
      return true;
    }

    const {
      error
    } = await client()
      .from(table)
      .delete()
      .eq("id", id);

    if (error) {
      throw error;
    }

    return true;
  }


  /* =====================================================
     LOGIN
     ===================================================== */

  async function signIn(email, password) {

    const {
      error
    } = await client()
      .auth
      .signInWithPassword({
        email,
        password
      });

    if (error) {
      throw error;
    }
  }


  /* =====================================================
     LOGOUT
     ===================================================== */

  async function signOut() {

    if (!SupabaseClient.configured()) {
      return;
    }

    const {
      error
    } = await client()
      .auth
      .signOut();

    if (error) {
      throw error;
    }
  }


  return {

    list,
    insert,
    update,
    save,
    remove,
    signIn,
    signOut

  };

})();
