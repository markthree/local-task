import { autoUnzip } from "./auto-unzip.ts";
// import { execa } from "https://deno.land/x/easy_std@v0.8.0/mod.ts";
import { _dirname } from "https://deno.land/x/easy_std@v0.7.1/mod.ts";

autoUnzip();

// execa(["deno", "run", "-A", "--unstable", "auto-git-clone.ts"], {
//   cwd: _dirname(import.meta.url),
// });
