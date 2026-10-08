window.ReplacementManager = (() => {

  let getState = null;
  let refresh = null;


  function configure(options = {}) {

    getState =
      options.getState || null;

    refresh =
      options.refresh || null;

  }


  function state() {

    return getState
      ? getState()
      : null;

  }


  function render() {
    // render replacement
  }


  function renderCandidates() {
    // ranking candidate
  }


  async function save() {
    // save manpower_changes
  }


  function bind() {
    // event replacement
  }


  return {

    configure,
    render,
    bind

  };

})();
