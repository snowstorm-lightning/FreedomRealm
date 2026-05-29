# 开源战略与反商业捕获

## 目标

FreedomRealm 优先服务个人、自由职业者、开源维护者、小团队、社区组织和多人协作体。商业公司可以使用、部署和贡献，但项目方向不能被商业公司重定向。

开源战略的目标不是绝对阻止复制，而是通过许可证、商标、开放协议、社区治理、Commons 资产、贡献者声誉和实例网络的组合，降低闭源 SaaS 吸血、封闭平台替代、品牌冒用和生态夺取风险。

## 个人和社区优先

- 优先降低个人和社区使用 FreedomRealm 的理解、部署和贡献门槛。
- 优先沉淀可复用的 `Workflow Template`、`Skill Recipe`、`ToolContract`、评测样本、失败案例和复盘报告。
- 企业需求不能覆盖个人、社区和开源协作的根目标。
- 企业私有化部署保留为 `Enterprise Mode`，但不是唯一叙事。

## 与封闭商业平台的关系

FreedomRealm 不追求成为另一个封闭商业 SaaS。它应减少个人和社区对中心化数据平台、闭源自动化系统和平台型外包服务的依赖。

核心价值应沉淀在：

- 开放协议和可替换实现。
- 公开模板库和可审计贡献历史。
- 脱敏评测摘要和失败样本。
- ToolContract、Workflow Template、Skill Recipe 等可复用资产。
- ProjectInstance 之间的授权协作、互信和治理结构。
- 贡献者声誉和社区维护能力。

## 许可证候选

许可证选择需要维护者和社区人工确认。本节不是法律意见。

| 候选 | 优点 | 风险与取舍 |
| --- | --- | --- |
| `AGPL-3.0` | 适合网络服务场景，可降低商业公司直接拿代码做闭源 SaaS 的风险 | 对企业采用更敏感，可能减少部分商业贡献 |
| `Apache-2.0` | 企业友好，含专利授权，生态接受度高 | 对闭源 SaaS 再封装约束较弱 |
| `MIT` | 极简、易理解、传播阻力低 | 对商业闭源吸血几乎没有结构性约束 |
| `MPL-2.0` | 文件级 copyleft，兼顾开放和集成 | 网络服务场景约束弱于 AGPL |
| 非标准 source-available | 可加入商业限制或反滥用条款 | 不是 OSI 开源，生态兼容性和社区信任成本更高 |

## 推荐初稿

优先评估 `AGPL-3.0 + 商标规则 + 开放协议 + 社区治理 + Commons 资产治理` 的组合。

理由：

- FreedomRealm 的核心形态包含网络服务和多人实例，AGPL-3.0 更贴近风险模型。
- 商标和官方兼容认证可以保护项目身份，避免 fork 冒充官方。
- 开放协议、模板生态、评测资产和贡献者声誉能形成商业 fork 难以复制的网络价值。
- 若最终采用非 OSI 开源许可证，必须明确标注其属于 source-available 范畴。

该推荐仍需人工确认，不构成法律意见。

## 当前开源入口资产

当前仓库已经提供最小开源贡献底座，但尚未完成最终许可证决策：

- [../../LICENSE-CANDIDATES.md](../../LICENSE-CANDIDATES.md)：许可证候选和人工确认路径，不是最终许可证授权。
- [../../CONTRIBUTING.md](../../CONTRIBUTING.md)：贡献范围、验证命令、治理边界和高风险变更要求。
- [../../CODE_OF_CONDUCT.md](../../CODE_OF_CONDUCT.md)：行为准则和社区冲突处理底线。
- [../../SECURITY.md](../../SECURITY.md)：安全披露和敏感信息处理路径。
- [../../.github/PULL_REQUEST_TEMPLATE.md](../../.github/PULL_REQUEST_TEMPLATE.md)：PR 治理检查清单。
- [../../.github/ISSUE_TEMPLATE/](../../.github/ISSUE_TEMPLATE/)：bug、feature、template 和 failure case 入口。

这些资产由 `pnpm validate:open-source` 校验，并由 `pnpm check` 自动执行。它们的目标是让外部贡献可以开始，同时继续阻止 secret、生产数据、敏感原文、真实 connector 配置和高风险自治绕过进入仓库。

## 商标与官方身份

- 代码可以开源。
- 项目名称、Logo、官方兼容认证和官方发行版标识可以由商标与治理规则保护。
- fork 可以存在，但不能冒充官方。
- 商业发行版必须清楚标识来源、差异和兼容性。
- 官方兼容认证需要定义测试范围、协议版本、撤销条件和公开名单。

## 协议与生态

FreedomRealm 的生态价值不只来自代码，还来自开放协议和协作资产：

- `ToolContract`
- `Workflow Template`
- `Skill Recipe`
- `Eval sample`
- `Failure case`
- `Review note`
- `SharedTemplate`
- `SharedEvalSummary`
- ProjectInstance 协作协议

商业 fork 可以复制代码，但难以复制长期社区网络、公开模板、贡献历史、实例互信和治理结构。

## Commons 资产治理

可以进入 `Community Commons` 的资产：

- 用户明确发布的模板。
- 用户明确发布的工具契约。
- 脱敏后的评测摘要。
- 公开案例、失败样本和复盘报告。
- 可复用 Review note 和使用报告。

不得默认进入公共资产的内容：

- 用户私有数据。
- 敏感数据。
- 内部任务。
- 非公开日志。
- 原始模型上下文。
- 未经授权的业务材料。

Commons 资产需要贡献规则、署名规则、复用规则、修正机制和撤回流程。

## 架构反锁定

- 本地优先。
- 实例自主。
- 协议开放。
- 供应商无关。
- 模型供应商只能作为 `ModelRoute` 或适配器。
- 核心契约不得绑定单一云平台、单一模型供应商、单一中心服务器或单一商业 API。
- `Tiny Mode`、`Demo Mode` 和 `Local Mode` 不能依赖完整企业基础设施才能理解核心抽象。

## 企业参与边界

- 企业可以贡献 code、docs、templates、eval samples、tool contracts、failure reports、translations、design discussions、review notes 和 usage reports。
- 企业利益冲突需要披露。
- 企业不能改变项目根目标，也不能用资源优势压倒个人和社区优先原则。
- 路线图方向、官方兼容认证和核心治理规则由维护者和社区治理流程控制。

## 风险与取舍

- AGPL-3.0 可能降低一部分企业采用意愿，但更符合反闭源 SaaS 吸血目标。
- 宽松许可证更利于传播，但需要更强商标、协议和社区治理来防止生态价值被夺取。
- 非标准 source-available 可以更强限制商业行为，但会牺牲 OSI 开源身份。
- 商标和官方认证不能阻止 fork，但可以降低品牌冒用风险。
- Commons 资产必须以用户明确授权为前提，不能为了增长牺牲隐私和信任。
