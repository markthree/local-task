import * as clippy from "https://deno.land/x/clippy@v1.0.0/mod.ts";
import { execa } from "https://deno.land/x/easy_std@v0.7.0/mod.ts";

export async function autoGitClone() {
  let lastText = "";
  while (true) {
    const text = await clippy.readText();
    if (lastText === text) {
      continue;
    }
    lastText = text;
    if (text.includes("github")) {
      await execa(["git", "clone", text], {
        cwd: getRefsDir(),
      });
    }
  }
}

function getRefsDir() {
  const DEMO_DIR = Deno.env.get("REFS_DIR");
  if (DEMO_DIR) {
    return DEMO_DIR;
  }
  throw new Deno.errors.NotFound("找不到 REFS_DIR 环境变量");
}
