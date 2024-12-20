import { ensureDir } from "https://deno.land/std@0.224.0/fs/ensure_dir.ts";
import { exists } from "https://deno.land/std@0.224.0/fs/exists.ts";
import { resolve } from "https://deno.land/std@0.224.0/path/resolve.ts";

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

const todo = ["todo", "TODO", "skip", "skip"];

async function tryRemove(path: string, willThrow = false) {
  // 标识文件则跳过删除
  for (const t of todo) {
    const p = resolve(path, t);

    if (await exists(p, { isFile: true })) {
      return;
    }
  }

  return Deno.remove(path, { recursive: true }).catch(async (error) => {
    await ensureDir("logs");

    if (error instanceof Deno.errors.NotFound) {
      return;
    }

    // append error
    Deno.writeTextFile(
      "logs/error.txt",
      JSON.stringify({ path, error }, null, 2),
      {
        append: true,
      },
    );

    if (willThrow) {
      throw error;
    }
  });
}

kv.listenQueue(async (msg: unknown) => {
  if (isRemove(msg)) {
    await tryRemove(msg.path, true);
  }
});

export async function ensureRemove(path: string, delay: number) {
  await kv.enqueue({
    path,
    type: "remove",
  }, { delay });
}
