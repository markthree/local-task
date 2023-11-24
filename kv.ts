import { ensureDir } from "https://deno.land/std@0.202.0/fs/ensure_dir.ts";

await ensureDir("kv");
export const kv = await Deno.openKv("./kv/data");

interface Remove {
  type: "remove";
  path: string;
}

function isRemove(msg: unknown): msg is Remove {
  if (typeof msg !== "object" || msg === null) {
    return false;
  }
  return Boolean((msg as Remove).type === "remove" && (msg as Remove).path);
}

function tryRemove(path: string) {
  return Deno.remove(path).catch(() => {});
}

kv.listenQueue(async (msg: unknown) => {
  if (isRemove(msg)) {
    await tryRemove(msg.path);
  }
});
