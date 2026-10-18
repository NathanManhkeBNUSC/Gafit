import { z } from "zod";
import { parseBody, requireUser, route } from "@/lib/http";
import { importFromText } from "@/lib/server/importer";

export const maxDuration = 60;

export const POST = route(async (req) => {
  await requireUser();
  const { text, useAi } = await parseBody(
    req,
    z.object({ text: z.string().trim().min(3, "Cole o texto da ficha.").max(20000), useAi: z.boolean().optional() }),
  );
  return Response.json({ draft: await importFromText(text, Boolean(useAi)) });
});
