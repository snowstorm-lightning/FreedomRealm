# 参考资料索引

以下资料是当前文档体系的主要外部依据，统一集中在此，避免未来实现阶段只依赖聊天记录或零散书签。

## OpenAI 与 Agent 能力

- Harness engineering: <https://openai.com/index/harness-engineering/>
- AGENTS.md: <https://agents.md/>
- OpenAI Models: <https://developers.openai.com/api/docs/models>
- Responses API: <https://platform.openai.com/docs/guides/responses-vs-chat-completions>
- Agent evals: <https://platform.openai.com/docs/guides/agent-evals>
- OpenAI Agents SDK: <https://openai.github.io/openai-agents-python/>

## Agent 协作与项目规则

- GitHub Copilot cloud agent project improvement workflow: <https://docs.github.com/en/copilot/tutorials/cloud-agent/improve-a-project>
- GitHub Copilot repository instructions: <https://docs.github.com/en/copilot/how-tos/configure-custom-instructions/add-repository-instructions>
- Claude Code subagents: <https://docs.anthropic.com/en/docs/claude-code/sub-agents>
- Claude Code hooks and Stop control: <https://docs.anthropic.com/en/docs/claude-code/hooks>
- Cursor project rules: <https://docs.cursor.com/en/context/rules>
- Google developer documentation style guide: <https://developers.google.com/style/>

## Web 与前端

- Next.js 16: <https://nextjs.org/blog/next-16>
- Next.js 16.2: <https://nextjs.org/blog/next-16-2>
- React 19: <https://react.dev/blog/2024/12/05/react-19>
- Tailwind CSS v4: <https://tailwindcss.com/blog/tailwindcss-v4>
- TypeScript 6.0: <https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/>
- Playwright: <https://playwright.dev/docs/intro>

## 后端与运行面

- Go: <https://go.dev/doc/>
- Rust: <https://www.rust-lang.org/learn>
- Cargo: <https://doc.rust-lang.org/cargo/>
- FastAPI: <https://fastapi.tiangolo.com/tutorial/first-steps/>
- pnpm installation: <https://pnpm.io/installation>
- uv: <https://docs.astral.sh/uv/>
- LangGraph: <https://docs.langchain.com/oss/python/langgraph/overview>
- Temporal: <https://docs.temporal.io/>
- Python 3.14 release schedule: <https://peps.python.org/pep-0745/>
- Python 3.14 whatsnew: <https://docs.python.org/3/whatsnew/3.14.html>
- Node.js release schedule: <https://github.com/nodejs/Release>

## 数据、身份与治理

- PostgreSQL current: <https://www.postgresql.org/docs/>
- pgvector: <https://github.com/pgvector/pgvector>
- Keycloak: <https://www.keycloak.org/getting-started/getting-started-zip>
- OpenTelemetry: <https://opentelemetry.io/docs/>
- AWS Well-Architected data classification and lifecycle management: <https://docs.aws.amazon.com/wellarchitected/latest/framework/sec_data_classification_lifecycle_management.html>
- NIST AI Risk Management Framework: <https://www.nist.gov/itl/ai-risk-management-framework>
- ISO/IEC 42001 AI management system: <https://www.iso.org/standard/42001>
- Workday Responsible AI: <https://www.workday.com/en-us/why-workday/our-technology/artificial-intelligence/responsible-ai.html>
- Salesforce Trusted AI principles: <https://www.salesforce.com/artificial-intelligence/architecture/>

## 模型网关与可观测性

- LiteLLM: <https://docs.litellm.ai/>
- Langfuse self-hosting: <https://langfuse.com/self-hosting>

## 使用约定

- 当官方资料与仓库文档冲突时，优先核验当前官方资料，再回写仓库文档。
- 当某项技术基线需要升级时，应先更新对应 ADR、架构文档和执行计划。
- 引用外部资料时优先使用官方文档、标准文档或项目源仓库，避免以博客或聊天记录作为唯一依据。
- 技术版本发生变化时，必须记录核验日期和影响范围。
- 若外部能力只作为适配层存在，不能把供应商特性上升为系统核心契约，除非新增 ADR 明确接受该绑定。
