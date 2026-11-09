import { getMyLogComments } from "@/lib/gym-data";

// 내 기록 아래 "관장님 코멘트" 카드 (D-127, FLOW 8-3 관원 쪽). 없으면 아무것도 안 그린다. 기록 화면과 같은 5분 캐시(코멘트가 달리면 알림을 눌러 들어오고, 그때 새로 읽힌다).
export async function LogComments({ logId }: { logId: string }) {
  const comments = await getMyLogComments(logId).catch(() => []);
  if (!comments.length) return null;
  return (
    <section className="flex flex-col gap-3 rounded-2xl bg-card p-4 ring-1 ring-border">
      <h2 className="text-[15px] font-semibold">
        관장님 코멘트 <span className="text-[13px] font-medium text-muted-foreground tabular-nums">{comments.length}</span>
      </h2>
      <ul className="flex flex-col gap-3">
        {comments.map((c) => (
          <li key={c.id} className="flex flex-col gap-1 border-l-2 border-accent pl-3">
            <span className="flex items-baseline gap-2">
              <span className="text-[13px] font-semibold">
                {c.author} {c.role === "owner" ? "관장님" : "코치"}
              </span>
              <span className="text-[12px] text-muted-foreground">
                {c.gym} · {new Date(c.createdAt).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Seoul" })}
              </span>
            </span>
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{c.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
