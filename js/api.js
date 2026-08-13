/* GitHub REST API 数据层 —— 数据契约与降级矩阵的唯一实现点 */
window.GitHubAPI = (function () {
  var KEY = "site.repos.v1";
  var TTL = 10 * 60 * 1000; /* 10 分钟 */

  function readCache() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return null;
      var c = JSON.parse(raw);
      if (!c || !c.ts || !Array.isArray(c.data)) return null;
      return c;
    } catch (e) {
      return null;
    }
  }

  function writeCache(repos) {
    try {
      localStorage.setItem(KEY, JSON.stringify({ ts: Date.now(), data: repos }));
    } catch (e) { /* 存储不可用时不阻塞 */ }
  }

  function mapRepo(r) {
    return {
      name: r.name,
      description: r.description || "",
      html_url: r.html_url,
      homepage: r.homepage || "",
      stargazers_count: r.stargazers_count || 0,
      forks_count: r.forks_count || 0,
      language: r.language || null,
      topics: Array.isArray(r.topics) ? r.topics : [],
      pushed_at: r.pushed_at || ""
    };
  }

  return {
    /* 返回 { repos, error, stale }
       - 成功:repos 数组,error:false
       - 缓存新鲜(TTL 内):直接用缓存,不发请求
       - 失败(403/网络):陈旧缓存兜底,stale:true
       - 失败且无缓存:{ repos:null, error:true }
    */
    fetchRepos: function (username) {
      var cached = readCache();
      if (cached && Date.now() - cached.ts < TTL) {
        return Promise.resolve({ repos: cached.data, error: false, stale: false });
      }
      var url = "https://api.github.com/users/" + encodeURIComponent(username) + "/repos?sort=pushed&per_page=100";
      return fetch(url)
        .then(function (res) {
          if (res.status === 403 || res.status === 429) {
            return cached
              ? { repos: cached.data, error: true, stale: true }
              : { repos: null, error: true, stale: false };
          }
          if (!res.ok) {
            throw new Error("GitHub API status " + res.status);
          }
          return res.json().then(function (list) {
            var repos = (Array.isArray(list) ? list : []).map(mapRepo);
            writeCache(repos);
            return { repos: repos, error: false, stale: false };
          });
        })
        .catch(function () {
          return cached
            ? { repos: cached.data, error: true, stale: true }
            : { repos: null, error: true, stale: false };
        });
    }
  };
})();
