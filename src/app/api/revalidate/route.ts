import { revalidateTag } from "next/cache";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function POST(req: Request): Promise<Response> {
  const auth = req.headers.get("authorization") ?? "";
  const provided = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : "";

  const env = (await getCloudflareContext({ async: true })).env as { REVALIDATE_TOKEN?: string };
  const expected = env.REVALIDATE_TOKEN;

  if (!expected || provided !== expected) {
    return new Response("Unauthorized", { status: 401 });
  }

  revalidateTag("reccs", { expire: 0 });
  return new Response("OK", { status: 200 });
}
