/* 导航:静态链接,点击用 window.scrollTo 定位(即时,无平滑) */
(function () {
  var NAV_SECTIONS = [
    { id: "about", label: "01 关于" },
    { id: "projects", label: "02 项目" },
    { id: "skills", label: "03 技能" },
    { id: "contact", label: "04 联系" }
  ];

  function Nav() {
    var cfg = window.SITE_CONFIG;

    function go(id) {
      var el = document.getElementById(id);
      if (el) {
        window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY);
      }
    }

    return (
      <nav className="nav" aria-label="页面导航">
        <button type="button" className="nav-name" onClick={function () { window.scrollTo(0, 0); }}>
          {cfg.NAME}
        </button>
        <div className="nav-links">
          {NAV_SECTIONS.map(function (s) {
            return (
              <button
                type="button"
                key={s.id}
                className="nav-link"
                onClick={function () { go(s.id); }}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </nav>
    );
  }

  Object.assign(window, { Nav: Nav });
})();
