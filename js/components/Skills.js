/* SKILLS:静态冷数据段 — mono 数据条直出 */
(function () {
  function Skills() {
    var cfg = window.SITE_CONFIG;

    return (
      <section className="scene skills" id="skills">
        <div className="container">
          <p className="scene-no">
            <span className="num">03</span> SKILLS — 技能栈
          </p>
          <h2 className="scene-title">
            技能栈<span className="scene-title-en">Stack</span>
          </h2>
          <div className="skills-list">
            {cfg.SKILLS.map(function (g) {
              return (
                <div key={g.group} className="skills-row">
                  <span className="skills-group">{g.group}</span>
                  <span className="skills-items">{g.items.join(" · ")}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  Object.assign(window, { Skills: Skills });
})();
