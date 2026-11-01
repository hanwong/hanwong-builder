import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { mcpTools, type MCPCallToolResultLike, type MCPClientLike } from "@anthropic-ai/sdk/helpers/beta/mcp";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer, INSTRUCTIONS } from "@/lib/mcp/server";
import { loadLibrary } from "@/lib/mcp/library";

// 질문하기 (D-100) — 리리롤 MCP(/mcp 와 같은 서버)를 이 서버 안에서 바로 붙여, Claude 가 기술 지도 도구로 찾아보고 답한다.
// Claude 에는 질문 글만 보낸다(누가 물었는지 · 다른 기록은 보내지 않음).

const MODEL = "claude-sonnet-5-5"; // 정리하기 · 기술 카드와 같은 모델
const client = new Anthropic({ timeout: 55_000, maxRetries: 1 });

const SYSTEM = `너는 한국 주짓수 수련자(주로 화이트~블루 벨트)의 질문에 답하는 코치다. 답하기 전에 반드시 rereroll 도구로 리리롤 기술 지도를 찾아보고, 찾은 내용에 근거해서만 답한다.
- 질문에 포지션 이름이 없고 상황만 있으면(누가 위 · 아래인지, 다리 · 팔 · 그립이 어디인지) 그 설명으로 포지션을 짐작하고 도구로 확인한다. 답 첫 문장에 "○○ 상황으로 보고 답할게요."처럼 짐작한 포지션을 밝힌다. 두 가지로 읽히면 더 흔한 쪽으로 답하고 다른 경우를 한 줄로 덧붙인다.
- 도구에서 찾지 못한 동작 · 세부는 지어내지 않는다. 지도에 없으면 그렇다고 말하고 코치에게 물어보라고 한다.
- 한국어, 쉬운 말, "~해요" 말투. 600~1300자. 아래 형식을 그대로 지킨다 — 리리롤 MCP 로 답할 때와 같은 구조이고 앱이 이 형식으로 그린다(D-113). 기술 카드의 세팅 과정 → 순서, 흔한 실수 → 흔한 실수, 막히면 → 막히면으로 옮긴다:
  1) 첫 문단 1~3문장 — 짐작한 상황 · 포지션. 질문과 딱 맞는 항목이 없으면 그렇다고 말하고, 참고한 가장 가까운 기술 · 포지션 이름 2~3개를 밝힌다. "오른손잡이 기준이에요."를 붙인다.
  2) "## 핵심: (한 줄 요약)" 줄, 다음 줄에 왜 그게 핵심인지 1~2문장(찾은 항목들이 공통으로 말하는 것).
  3) "## 순서" 줄, 그 아래 해 볼 순서대로 "1. **짧은 동작 문장.** 설명 1~2문장" 3~6개 — 한 줄에 동작 하나, 제목과 설명은 같은 줄.
  4) "## 흔한 실수" 줄, 그 아래 "- ~하면 ~돼요. ~해요." 2~3줄(실수 → 결과 → 고치는 법).
  5) "## 막히면" 줄, 그 아래 "- 상대가 ~하면 → 기술 이름 [slug]: 한 줄 요령" 2~4줄. 기술로 안 이어지면 "→" 없이 신호와 대처만.
  6) 여러 항목을 합쳐 만들었거나 짐작이 섞였으면 마지막에 "> " 로 시작하는 한 줄 — 무엇을 합쳤는지, 지도에 따로 칸이 없으면 그 상황 항목을 더하면 좋겠다는 제안.
  굵게는 순서 제목에만. 표 · "###" · 위에 없는 제목은 쓰지 않는다. 지도에 없는 칸(예: 막히면 내용이 없음)은 그 제목째 뺀다.
- 기술을 말할 때마다 한국어 이름 바로 뒤에 도구 결과에 나온 slug 를 [slug] 로 붙인다(예: "힙 범프 스윕 [hip-bump-sweep]"). 도구 결과에 없는 slug 는 만들지 않는다.
- 좌우는 오른손잡이 기준.
- 도구 결과에 "규정 · 안전" 이 있는 기술(힐훅 같은 하체 관절기 등)을 말하면 도복 · 노기, 대회 허용 띠, 안전 요령을 한 줄로 꼭 덧붙인다.
- "AI 추천이라 틀릴 수 있다 · 코치에게 확인" 안내는 앱이 답 아래에 따로 붙이므로 답에 쓰지 않는다(아래 도구 안내의 마지막 줄보다 이 규칙이 우선).

도구 안내:
${INSTRUCTIONS}`;

export type Answer = { answer: string; slugs: string[] };

export async function answerQuestion(question: string): Promise<Answer> {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = createServer();
  const mcp = new Client({ name: "rereroll-ask", version: "1.0.0" });
  await server.connect(serverTransport);
  await mcp.connect(clientTransport);
  try {
    const { tools } = await mcp.listTools();
    // MCP SDK 의 callTool 결과 타입에는 옛 형식(toolResult)도 섞여 있어 content 형식만 넘긴다
    const caller: MCPClientLike = {
      callTool: async (params) => {
        const r = await mcp.callTool(params);
        return (
          "content" in r ? r : { content: [{ type: "text", text: JSON.stringify(r.toolResult) }] }
        ) as MCPCallToolResultLike;
      },
    };
    const runner = client.beta.messages.toolRunner({
      model: MODEL,
      max_tokens: 4000,
      thinking: { type: "adaptive" },
      system: SYSTEM,
      messages: [{ role: "user", content: question }],
      tools: mcpTools(tools, caller),
      max_iterations: 8,
    });
    // 1회 비용 실측(D-100) — 토큰 수만 남기고 글은 남기지 않는다
    let input = 0;
    let output = 0;
    let last;
    for await (const message of runner) {
      input += message.usage.input_tokens + (message.usage.cache_read_input_tokens ?? 0);
      output += message.usage.output_tokens;
      last = message;
    }
    console.info(`ask tokens: in ${input} · out ${output} · turns ${runner.params.messages.length}`);
    const text = (last?.content ?? [])
      .flatMap((b) => (b.type === "text" ? [b.text] : []))
      .join("\n")
      .trim();
    if (!text || last?.stop_reason === "tool_use") throw new Error("no final answer");
    return await tidy(text);
  } finally {
    await mcp.close().catch(() => {});
    await server.close().catch(() => {});
  }
}

// [slug] → 공용 기술에 있는 것만 모아 카드 줄로, 글에서는 뺀다. 굵게 · "## 순서" 같은 형식은 남긴다(답 화면이 그린다, D-113).
async function tidy(text: string): Promise<Answer> {
  const lib = await loadLibrary();
  const slugs: string[] = [];
  const answer = text
    .replace(/\s*\[([a-z0-9][a-z0-9-]*)\]/g, (_, slug: string) => {
      if (lib.bySlug.has(slug) && !slugs.includes(slug)) slugs.push(slug);
      return "";
    })
    .replace(/^#{3,}\s*/gm, "## ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 6000);
  return { answer, slugs: slugs.slice(0, 12) };
}
