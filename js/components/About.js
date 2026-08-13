/* ABOUT:静态呼吸段 — 头像 + 中英双语文案 + mono 事实行 */
(function () {
  function About() {
    var cfg = window.SITE_CONFIG;
    var imgOkState = React.useState(true);
    var imgOk = imgOkState[0];
    var setImgOk = imgOkState[1];
    var avatarUrl = "https://github.com/" + cfg.GITHUB_USERNAME + ".png";

    return (
      <section className="scene about" id="about">
        <div className="container">
          <p className="scene-no">
            <span className="num">01</span> ABOUT — 关于我
          </p>
          <h2 className="scene-title">
            关于我<span className="scene-title-en">About</span>
          </h2>
          <div className="about-grid">
            <div>
              {imgOk ? (
                <img
                  className="about-avatar"
                  src={avatarUrl}
                  alt={cfg.NAME + " 的头像"}
                  draggable="false"
                  onError={function () { setImgOk(false); }}
                />
              ) : (
                <div className="about-avatar-fallback" aria-label={cfg.NAME + " 的头像"}>
                  {cfg.NAME.charAt(0)}
                </div>
              )}
            </div>
            <div className="about-text">
              {cfg.ABOUT_CN.map(function (p, i) {
                return <p key={i}>{p}</p>;
              })}
              <p className="about-en">{cfg.ABOUT_EN}</p>
            </div>
          </div>
          <div className="about-facts">
            <div className="fact">
              <span className="fact-label">位置</span>
              <span>{cfg.LOCATION}</span>
            </div>
            <div className="fact">
              <span className="fact-label">常用栈</span>
              <span>{cfg.STACK}</span>
            </div>
            <div className="fact">
              <span className="fact-label">开源</span>
              <span>{cfg.OPENSOURCE}</span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  Object.assign(window, { About: About });
})();
