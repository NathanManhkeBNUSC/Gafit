import { HttpError, requireUser, route } from "@/lib/http";
import { aiEnabled } from "@/lib/server/ai";
import { importFromFiles } from "@/lib/server/importer";

export const maxDuration = 60;

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
type ImageType = (typeof IMAGE_TYPES)[number];
const MAX_BYTES = 4 * 1024 * 1024; // keeps the request under Vercel's body limit

export const POST = route(async (req) => {
  await requireUser();
  if (!aiEnabled())
    throw new HttpError(501, "A leitura de foto/PDF precisa da chave da IA (ANTHROPIC_API_KEY) configurada no servidor.");
  const form = await req.formData();
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (!files.length) throw new HttpError(400, "Envie pelo menos uma foto ou PDF.");
  if (files.length > 5) throw new HttpError(400, "Envie no máximo 5 arquivos por vez.");
  const total = files.reduce((a, f) => a + f.size, 0);
  if (total > MAX_BYTES) throw new HttpError(413, "Arquivos grandes demais (máx. 4 MB no total). Tire a foto em resolução menor.");
  const parts = await Promise.all(
    files.map(async (f) => {
      const data = Buffer.from(await f.arrayBuffer()).toString("base64");
      if (f.type === "application/pdf") return { kind: "pdf" as const, data };
      if ((IMAGE_TYPES as readonly string[]).includes(f.type)) return { kind: "image" as const, mediaType: f.type as ImageType, data };
      throw new HttpError(415, `Formato não suportado: ${f.name}. Use JPG, PNG, WEBP ou PDF.`);
    }),
  );
  try {
    return Response.json({ draft: await importFromFiles(parts) });
  } catch (e) {
    if (e instanceof HttpError) throw e;
    console.error(e);
    throw new HttpError(502, "Não consegui ler a ficha. Tente uma foto mais nítida, bem iluminada e reta.");
  }
});
