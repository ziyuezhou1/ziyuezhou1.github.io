/* CONTACT:静态 payoff — 标题与按钮直出 */
(function () {
  function Contact() {
    var cfg = window.SITE_CONFIG;

    return (
      <section className="scene contact" id="contact">
        <div className="container">
          <p className="scene-no">
            <span className="num">04</span> CONTACT — 联系
          </p>
          <h2 className="contact-title">来聊聊</h2>
          <p className="contact-sub">
            有数据想聊、有项目想合作,或只是想打个招呼 — 来封邮件,或在 GitHub 上找我。
          </p>
          <a className="mail-btn" href={"mailto:" + cfg.EMAIL}>
            {cfg.EMAIL}
          </a>
          <div className="contact-socials">
            {cfg.SOCIALS.map(function (s) {
              return (
                <a
                  key={s.label}
                  className="cs-link"
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {s.label} ↗
                </a>
              );
            })}
          </div>
          <p className="scene-end">© 2026 {cfg.NAME} · {cfg.NAME_EN} · END OF SCENE</p>
        </div>
      </section>
    );
  }

  Object.assign(window, { Contact: Contact });
})();
