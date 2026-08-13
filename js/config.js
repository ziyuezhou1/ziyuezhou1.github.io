/* 全站唯一内容源 —— 所有文案、精选仓库、技能、联系方式都从这里读取 */
window.SITE_CONFIG = {
  GITHUB_USERNAME: "ziyuezhou1",
  NAME: "周子悦",
  NAME_EN: "Ziyue Zhou",
  TAGLINE_CN: "正在快乐地玩 AI",
  TAGLINE_EN: "having fun with AI!",
  ABOUT_CN: [
    "具备生物学与计算分析交叉背景，接受过系统的生命科学与数据分析训练，专注单细胞转录组、常规转录组及多组学数据分析。",
    "能够独立完成从原始数据质控、统计建模、功能解释到可视化汇报的完整分析流程；熟练运用 R、Python、Shell 及 AI 辅助开发工具，保持问题导向的做事方式。"
  ],
  ABOUT_EN: "Cross-disciplinary training in biology and computational analysis, focused on single-cell transcriptomics, bulk RNA-seq and multi-omics — from raw-data QC and statistical modeling to functional interpretation and publication-ready visualization.",
  LOCATION: "上海, 中国",
  STACK: "R · Python · Shell",
  OPENSOURCE: "2021 至今",
  EMAIL: "ziyuezhou221022@gmail.com",
  SOCIALS: [
    { label: "GitHub", url: "https://github.com/ziyuezhou1" }
  ],
  /* 手动精选仓库顺序,最多 6 个;不足 6 个时按 stars 补齐 */
  FEATURED_REPOS: [
    "scRNAseq-analysis-pipeline",
    "bulk_RNA_seq_analysis_pipeline",
    "med-agent",
    "ai-agent-framework",
    "CAT-BODHI",
    "LLMPET"
  ],
  PROJECT_NOTES: {
    "scRNAseq-analysis-pipeline": "单细胞转录组分析流程：质控、降维、聚类、细胞注释与结果报告",
    "bulk_RNA_seq_analysis_pipeline": "常规转录组分析流程：比对定量、差异表达、模式聚类与通路富集",
    "med-agent": "医疗 AI 智能体框架：多模态医学模型、临床推理引擎与医学 RAG",
    "ai-agent-framework": "AI 智能体框架：多模型接口、Agent 编排、工具调用与 RAG 检索",
    "CAT-BODHI": "像素风猫猫盘串放置游戏：像素美术与前端实现",
    "LLMPET": "盯梢 Claude Code 的桌面宠物：状态表情、消息气泡与 token 统计"
  },
  SKILLS: [
    { group: "语言", items: ["R", "Python", "Shell", "JavaScript"] },
    { group: "生信分析", items: ["单细胞转录组", "常规转录组", "多组学联合", "通路富集"] },
    { group: "工具与流程", items: ["Git", "Linux", "科研可视化", "AI 辅助开发"] }
  ]
};

/* GitHub 语言色(固定 17 项,不扩展) */
window.LANG_COLORS = {
  "JavaScript": "#f1e05a",
  "TypeScript": "#3178c6",
  "Python": "#3572A5",
  "Go": "#00ADD8",
  "Rust": "#dea584",
  "C++": "#f34b7d",
  "C": "#555555",
  "Java": "#b07219",
  "Ruby": "#701516",
  "PHP": "#4F5D95",
  "Swift": "#F05138",
  "Kotlin": "#A97BFF",
  "HTML": "#e34c26",
  "CSS": "#563d7c",
  "Vue": "#41b883",
  "Shell": "#89e051",
  "default": "#8A93A8"
};
