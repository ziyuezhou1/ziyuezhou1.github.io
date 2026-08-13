/* PROJECTS:API 实时数据 + 手动精选,卡片静态直出 */
(function () {
  var STAR_PATH = "M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z";
  var FORK_PATH = "M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75v-.878a2.25 2.25 0 111.5 0v.878a2.25 2.25 0 01-2.25 2.25h-1.5v2.128a2.251 2.251 0 11-1.5 0V8.5h-1.5A2.25 2.25 0 013.5 6.25v-.878a2.25 2.25 0 111.5 0zM5 3.25a.75.75 0 10-1.5 0 .75.75 0 001.5 0zm6.75.75a.75.75 0 100-1.5.75.75 0 000 1.5zm-3 8.75a.75.75 0 10-1.5 0 .75.75 0 001.5 0z";

  function StatIcon(props) {
    return (
      <svg viewBox="0 0 16 16" aria-hidden="true" {...props}>
        <path d={props.path} />
      </svg>
    );
  }

  function ProjectCard(props) {
    var repo = props.repo;
    var note = props.note;
    var langColor = (window.LANG_COLORS || {})[repo.language] || (window.LANG_COLORS || {}).default;
    var desc = note || repo.description;

    return (
      <a
        className="p-card"
        href={repo.html_url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={repo.name}
      >
        <div className="p-card-head">
          <h3 className="p-name">{repo.name}</h3>
          <div className="p-stats">
            {repo.language ? (
              <span className="p-lang">
                <span className="lang-dot" style={{ background: langColor }} />
                {repo.language}
              </span>
            ) : null}
            <span className="p-stat" aria-label={repo.stargazers_count + " stars"}>
              <StatIcon path={STAR_PATH} />
              {repo.stargazers_count}
            </span>
            <span className="p-stat" aria-label={repo.forks_count + " forks"}>
              <StatIcon path={FORK_PATH} />
              {repo.forks_count}
            </span>
          </div>
        </div>
        {desc ? <p className="p-desc">{desc}</p> : null}
        {repo.topics && repo.topics.length > 0 ? (
          <div className="p-topics">
            {repo.topics.slice(0, 5).map(function (t) {
              return (
                <span className="topic-chip" key={t}>
                  {t}
                </span>
              );
            })}
          </div>
        ) : null}
      </a>
    );
  }

  function DegradedCard(props) {
    var name = props.name;
    var url = "https://github.com/" + window.SITE_CONFIG.GITHUB_USERNAME + "/" + name;
    return (
      <a className="p-card" href={url} target="_blank" rel="noopener noreferrer">
        <div className="p-card-head">
          <h3 className="p-name">{name}</h3>
          <div className="p-stats">
            <span className="p-stat">—</span>
          </div>
        </div>
      </a>
    );
  }

  function Projects() {
    var cfg = window.SITE_CONFIG;
    var state = React.useState({ loading: true, repos: null, error: false, stale: false });
    var st = state[0];
    var setState = state[1];

    React.useEffect(function () {
      var alive = true;
      window.GitHubAPI.fetchRepos(cfg.GITHUB_USERNAME).then(function (res) {
        if (!alive) return;
        setState({ loading: false, repos: res.repos, error: res.error, stale: !!res.stale });
      });
      return function () { alive = false; };
    }, []);

    var order = [];
    var byName = {};
    if (st.repos) {
      st.repos.forEach(function (r) { byName[r.name] = r; });
      cfg.FEATURED_REPOS.forEach(function (n) {
        if (byName[n] && order.indexOf(n) < 0) order.push(n);
      });
      if (order.length < 6) {
        st.repos
          .slice()
          .sort(function (a, b) { return b.stargazers_count - a.stargazers_count; })
          .forEach(function (r) {
            if (order.indexOf(r.name) < 0 && order.length < 6) order.push(r.name);
          });
      }
    }

    var noData = !st.loading && !st.repos;
    var showNote = !st.loading && st.error;

    return (
      <section className="scene projects" id="projects">
        <div className="container">
          <p className="scene-no">
            <span className="num">02</span> PROJECTS — 精选项目
          </p>
          <h2 className="scene-title">
            精选项目<span className="scene-title-en">Selected Work · GitHub API</span>
          </h2>
          {st.loading ? (
            <p className="p-degraded-note">载入中…</p>
          ) : noData ? (
            <div className="projects-grid">
              {cfg.FEATURED_REPOS.map(function (name) {
                return <DegradedCard key={name} name={name} />;
              })}
              <p className="p-degraded-note">GitHub 数据暂时不可用</p>
            </div>
          ) : (
            <React.Fragment>
              <div className="projects-grid">
                {order.map(function (name) {
                  return (
                    <ProjectCard
                      key={name}
                      repo={byName[name]}
                      note={cfg.PROJECT_NOTES[name] || ""}
                    />
                  );
                })}
              </div>
              {showNote ? (
                <p className="p-stale-note">{st.stale ? "数据来自本地缓存 · 网络暂不可用" : "GitHub 数据暂时不可用"}</p>
              ) : null}
            </React.Fragment>
          )}
        </div>
      </section>
    );
  }

  Object.assign(window, { Projects: Projects });
})();
