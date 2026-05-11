# ADR-0009: 单一现代稳定技术栈基线

## 状态

Accepted

## 背景

AI-HRMS 希望尽可能使用新的技术栈，以获得更好的语言能力、性能、安全修复、开发体验和 agent 友好能力。但项目也要求 Windows/Linux 友好、可长期维护、可审计、可回滚，并且 Enterprise Mode 不能依赖不稳定运行时。

如果同时维护 stable 与 preview 两条技术栈，会增加 CI、文档、依赖锁定、排障和社区二次开发成本。当前阶段更适合维护一条清晰的单一基线，并用严格规则定义什么版本可以进入基线。

## 决策

AI-HRMS 只维护一条技术栈基线，原则是：在保证生产稳定、依赖兼容、跨平台可用和可回滚的前提下，使用尽可能新的稳定版本。

当前基线为：

- Web UI：Next.js 16.2、React 19、TypeScript 6.0、Tailwind CSS v4、shadcn/ui。
- 控制面：Node.js 24 LTS、NestJS 11、Prisma ORM 6.x、PostgreSQL 18。
- Agent Runtime：Python 3.14 stable、FastAPI、LangGraph、Pydantic v2。
- Node package manager：pnpm 10。

基线进入规则：

- Node.js 必须处于 Active LTS 或 Maintenance LTS，不能把 Current 作为生产强制基线。
- Python 可以使用官方稳定 feature release，但不能使用 rc、beta、alpha 作为生产基线。
- 框架和工具必须使用官方稳定版本；canary、preview-only、experimental-only 能力不得成为 Enterprise Mode 必需能力。
- 升级必须同步更新架构文档、开发体验文档、质量门禁、执行计划、CI 和 `package.json` engines。
- 升级必须通过 Windows/Linux CI、仓库级检查和相关评测。

因此，Node.js 26 在 2026-05-10 不进入基线；它已经发布为 Current，但尚未进入 LTS。等 Node.js 26 进入 LTS，并且 NestJS、Prisma、Next.js、Playwright 与项目 CI 都通过后，直接替换单一 Node 基线，不保留双线。

## 后果

- 技术栈足够新，但不会把社区贡献者和企业部署暴露在 Current/RC 风险下。
- 文档和 CI 只有一套目标版本，降低二次开发和跨实例协作成本。
- Python Agent Runtime 可以提前享受 Python 3.14 的稳定语言与标准库能力。
- Node 侧短期保持 24 LTS，减少控制面和前端构建链路的生产风险。
- 每次技术栈升级都必须有明确核验日期、影响范围和回滚路径。

## 替代方案

- 维护 stable 与 preview 双线：可以更早试用 Node.js 26 等版本，但会增加 CI、文档和依赖矩阵复杂度，不符合当前阶段的简洁目标。
- 直接切到所有最新主版本：表面上更激进，但会把 Current、RC 或未验证依赖带入基线，削弱稳定性。
- 长期停留在旧 LTS：稳定但不符合项目希望尽可能利用新能力的方向。

## 参考资料

- Python 3.14 Release Schedule: <https://peps.python.org/pep-0745/>
- Python 3.14 What's New: <https://docs.python.org/3/whatsnew/3.14.html>
- Node.js Release Working Group: <https://github.com/nodejs/Release>
- Next.js 16: <https://nextjs.org/blog/next-16>
- Next.js 16.2: <https://nextjs.org/blog/next-16-2>
- TypeScript 6.0: <https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/>
- NestJS Migration Guide: <https://docs.nestjs.com/migration-guide>
- Prisma System Requirements: <https://docs.prisma.io/docs/orm/reference/system-requirements>
