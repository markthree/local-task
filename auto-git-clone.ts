import { watchClipboard } from "./clipboard-event/index.ts";
import { exists } from "https://deno.land/std@0.212.0/fs/exists.ts";
import { basename } from "https://deno.land/std@0.212.0/path/basename.ts";
import { join } from "https://deno.land/std@0.212.0/path/join.ts";
import { execa, noop } from "https://deno.land/x/easy_std@v0.7.1/mod.ts";

export async function autoGitClone() {
  const refs = getRefsDir();
  watchClipboard(async (text) => {
    const dir = join(refs, basename(text, ".git"));
    if (text.includes("git@github.com") && !await exists(dir)) {
      await execa(["git", "clone", text], { cwd: refs }).catch((error) => {
        // append error
        Deno.writeTextFile(
          "logs/error.txt",
          JSON.stringify({ text, error }, null, 2),
          {
            append: true,
          },
        );
      });
    }
  });
}

function getRefsDir() {
  const DEMO_DIR = Deno.env.get("REFS_DIR");
  if (DEMO_DIR) {
    return DEMO_DIR;
  }
  throw new Deno.errors.NotFound("找不到 REFS_DIR 环境变量");
}
