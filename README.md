<div align="center">

![LoanTruth Banner](assets/banner-new.png)

# LoanTruth · See Through the Interest-Rate Illusion

**Upload a loan screenshot. AI rips off the financial product's mask and shows you the real cost.**

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald?style=flat-square)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Zhipu GLM-4V-Flash](https://img.shields.io/badge/GLM--4V--Flash-free-8B5CF6?style=flat-square)](https://bigmodel.cn)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen?style=flat-square)](CONTRIBUTING.md)

**🌍 Helping young people worldwide see through predatory lending — one person at a time.**

</div>

---

## Why this exists

> **Billions of young people are having their lives destroyed by high-interest loans.**
>
> They're not stupid — the interest rates are deliberately obfuscated.
>
> "Only 0.05% daily" sounds cheap. "0.6% monthly fee" looks low. **But math doesn't lie.**

**LoanTruth's mission, in one line:**

> **Use math and AI to expose predatory financial products. Help whoever we can.**

---

## 🚀 Live Demo

**👉 [Try it now](https://loantruth.pages.dev/)** — fast, global CDN

*(Mirror: [GitHub Pages](https://focus688.github.io/LoanTruth/))*

---

## What it does

| Feature | Description |
|---------|-------------|
| 📸 **Screenshot upload** | Multi-image stitching (homepage ad + repayment schedule) |
| 🤖 **AI recognition** | Zhipu GLM-4V-Flash extracts principal, term, hidden fees |
| 🧮 **Algorithmic verification** | Halley-method IRR computed locally (3rd-order convergence) |
| 🚨 **Trap detection** | Upfront interest, forced insurance, early-repayment penalties |
| 💰 **Debt-to-income ratio** | Enter monthly income, see how close to collapse you are |
| ⛔ **Debt-cycle warning** | Borrowing to repay debt = slow suicide |
| 🎲 **Investment warning** | Don't gamble your way out of debt — 90% lose more |
| 🛟 **Survival roadmap** | Concrete, actionable steps out of debt |

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/Focus688/LoanTruth.git
cd LoanTruth

# 2. Install dependencies
npm install

# 3. Configure the Zhipu GLM-4V-Flash API key
#    Get a free key at https://bigmodel.cn
echo "VITE_ZHIPU_API_KEY=your_key" > .env.local

# 4. Run
npm run dev
```

> 🆓 GLM-4V-Flash has a free tier — enough for personal use. The core IRR math works **without any API key**.

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React 19 + TypeScript |
| Build | Vite 6 |
| Styling | Tailwind CSS |
| AI | Zhipu GLM-4V-Flash (free tier) |
| Algorithm | Halley IRR (3rd-order convergence, client-side) |
| Charts | Recharts |
| Icons | Lucide React |

---

## Architecture

```
Upload screenshot
        ↓
Zhipu GLM-4V-Flash extracts (principal / term / payment / fees)
        ↓
Local Halley IRR → precise real APR
        ↓
Double verification → AI estimate vs. algorithm
        ↓
Report → risk level + traps + burden analysis + survival roadmap
```

**Why client-side?** User data never hits our servers. Images go directly to the AI API; computation happens in the browser. Income data lives only in memory and disappears on refresh.

---

## Risk Tiers

| Tier | Real APR | Meaning |
|------|----------|---------|
| 🟢 Low | < 10% | Normal bank loans, mortgages |
| 🟡 Medium | 10–24% | Credit cards, consumer loans |
| 🟠 High | 24–36% | High-interest cash loans — pay off ASAP |
| 🔴 Predatory | > 36% | Usury — legally unprotected in most jurisdictions |

---

## Why contribute

This isn't a "fun project."

- You may know someone trapped in a debt cycle right now
- You may have seen young people ruined by predatory loans
- You may have been burned by "0.05% daily" yourself

**Every person this project helps is one fewer person harvested by the financial machine.**

How you can help:
- 🎨 **Design** — make the UI more impactful and approachable
- 🧮 **Algorithm** — better IRR, more financial products
- 🌍 **Translation** — reach young people in more countries
- 📢 **Spread the word** — help whoever we can

[Contribution guide →](CONTRIBUTING.md)

---

## Roadmap

- [x] MVP — single upload + AI analysis + IRR verification
- [x] Debt-to-income ratio
- [x] Debt-cycle warning
- [x] Investment/gambling warning
- [x] Survival roadmap
- [ ] Multi-language (EN/ES/JP/ID)
- [ ] More product templates (auto / mortgage / credit card)
- [ ] Local OCR fallback (works without any API)
- [ ] PWA / Telegram Bot

---

<div align="center">

**Math doesn't lie. See it, and you win.**

[Try it](https://loantruth.pages.dev/) · [Report issue](https://github.com/Focus688/LoanTruth/issues) · [Contribute](CONTRIBUTING.md)

<sub>Made with ❤️ for every young person trapped in debt.</sub>

</div>
