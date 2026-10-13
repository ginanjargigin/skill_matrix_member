
window.SupabaseClient = (() => {
  let client = null;

  function configured() {
    return Boolean(
      window.APP_CONFIG?.SUPABASE_URL &&
      window.APP_CONFIG?.SUPABASE_ANON_KEY
    );
  }

  function init() {
    if (!configured()) {
      return null;
    }

    if (!window.supabase?.createClient) {
      throw new Error(
        "Library Supabase belum berhasil dimuat."
      );
    }

    if (!client) {
      client = window.supabase.createClient(
        window.APP_CONFIG.SUPABASE_URL,
        window.APP_CONFIG.SUPABASE_ANON_KEY,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            flowType: "pkce"
          }
        }
      );
    }

    return client;
  }

  return {
    configured,
    init
  };
})();

