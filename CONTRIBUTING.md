# 贡献指南

欢迎加入 LoanTruth！这个项目不是为了炫技，而是为了 **帮一个是一个**。

## 价值观

- **数学不骗人** — 所有数据结论优先信任算法，其次才是 AI
- **先帮人，再完美** — MVP 思维，能帮到一个人就值得 deploy
- **隐私第一** — 用户数据不需要经过我们的服务器
- **开源不是口号** — 任何语言、任何国家的年轻人都应该能用

## 我能做什么？

### 🧮 算法与计算
- 更好的 IRR 计算（支持更多还款方式：等额本息、等额本金、先息后本）
- 本地 OCR 降级方案（不用 API 也能提取数字）
- 多币种支持

### 🤖 AI 与提示词
- 更精准的参数提取提示词
- 更多语言的系统提示（除中文外，增加 EN/ES/JP/ID 等）
- 更多金融产品的识别模板

### 🎨 设计与体验
- 更好的移动端适配
- 更冲击的可视化（让用户一眼看出自己有多危险）
- 多语言界面

### 📢 传播
- 写一篇文章，分享这个工具
- 翻译 README 到你的语言
- 在 Reddit/Twitter/小红书 告诉需要的人

### 🌍 国际化
- 不同国家的利率法规
- 不同语言的风险提示
- 不同金融产品的本地化适配

## 开发指南

```bash
# 克隆
git clone https://github.com/Focus688/LoanTruth.git
cd LoanTruth

# 安装
npm install

# 环境变量
echo "GEMINI_API_KEY=你的密钥" > .env.local

# 启动
npm run dev
```

### 项目结构

```
LoanTruth/
├── App.tsx                  # 主应用
├── components/
│   ├── FileUpload.tsx       # 图片上传
│   ├── IncomeInput.tsx      # 收入输入
│   ├── AnalysisView.tsx     # 分析结果
│   ├── AnalysisChart.tsx    # 利率对比图
│   └── EducationGrid.tsx    # 金融陷阱科普
├── services/
│   └── geminiService.ts     # Gemini API + IRR 算法
├── types.ts                 # 类型定义
├── index.html               # 入口 HTML
└── index.tsx                # React 挂载
```

## 提 PR 前

1. 确保 `npm run dev` 能跑起来
2. 如果是算法改动，提供至少一个测试用例
3. 如果是 UI 改动，附截图对比
4. 保持中文注释，变量名用英文

## 问题反馈

- [Issues](https://github.com/Focus688/LoanTruth/issues) — Bug 反馈、功能建议
- [Discussions](https://github.com/Focus688/LoanTruth/discussions) — 想法交流、使用心得

---

**记住：你每行代码，可能都在帮一个人看清他/她的债务有多危险。**

这不是一个普通的开源项目。
