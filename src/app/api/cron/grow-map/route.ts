import { runGrowMap } from "@/lib/agent/grow-map";

// 매일 지도 키우기 에이전트 (D-102) — Vercel Cron 이 매일 새벽 3시(서울)에 부른다(vercel.json).
// Vercel 이 보내는 CRON_SECRET 이 맞을 때만 돈다. 같은 날 두 번은 안 돈다(map_agent_runs.run_on 유일).
export const maxDuration = 300;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("unauthorized", { status: 401 });
  }
  const res = await runGrowMap();
  return Response.json(res);
}
