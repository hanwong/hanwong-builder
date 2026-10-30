import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createServer } from "@/lib/mcp/server";

// 리리롤 MCP 주소(D-81): https://rereroll.xyz/mcp — Claude 등에 이 주소를 추가하면 공용 기술 목록을 찾아볼 수 있다.
// 상태 없이(요청마다 새 서버) JSON 으로 답한다. 로그인 · 사용자 데이터 없음.

async function handle(request: Request): Promise<Response> {
  const server = createServer();
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  await server.connect(transport);
  try {
    return await transport.handleRequest(request);
  } finally {
    void server.close();
  }
}

export const POST = handle;
export const GET = handle;
export const DELETE = handle;
