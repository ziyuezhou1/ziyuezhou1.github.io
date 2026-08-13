/* HERO:静态开场 — 名字直出,无散落收敛、无视差 */
(function () {
  function Hero() {
    var cfg = window.SITE_CONFIG;

    return (
      <section className="scene hero" id="hero">
        <div className="container">
          <p className="scene-no">
            <span className="num">00</span> OPENING — 开场
          </p>
          <h1 className="hero-name">{cfg.NAME}</h1>
          <p className="hero-tagline">
            <span className="tag-chip">{cfg.TAGLINE_CN}</span>
            <span className="hero-tagline-en">{cfg.TAGLINE_EN}</span>
          </p>
          <div className="hero-socials">
            {cfg.SOCIALS.map(function (s) {
              return (
                <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer">
                  {s.label}
                </a>
              );
            })}
            <a href={"mailto:" + cfg.EMAIL}>Email</a>
          </div>
          <p className="scroll-hint">SCROLL ↓</p>
        </div>
      </section>
    );
  }

  Object.assign(window, { Hero: Hero });
})();
