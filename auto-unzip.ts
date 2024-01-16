// 一个服务，用来自动解压 zip 到 code demo 目录
// @ts-ignore 未提供类型支持
import { unrar } from "npm:unrar-promise";
import { ensureRemove } from "./kv.ts";
import "https://deno.land/std@0.212.0/dotenv/load.ts";
import { resolve } from "https://deno.land/std@0.212.0/path/mod.ts";
import { exists } from "https://deno.land/std@0.212.0/fs/exists.ts";
import { format } from "https://deno.land/std@0.212.0/datetime/format.ts";
import { unzip } from "https://deno.land/x/nzip@v0.6.7/src/decompress.ts";
import { ensureDir } from "https://deno.land/std@0.212.0/fs/ensure_dir.ts";
import { delay } from "https://deno.land/std@0.212.0/async/delay.ts";
import { HOUR } from "https://deno.land/std@0.212.0/datetime/constants.ts";
import { ensureFile } from "https://deno.land/std@0.212.0/fs/ensure_file.ts";
import { basename } from "https://deno.land/std@0.212.0/path/basename.ts";

export async function autoUnzip() {
  const demo = getDemoDir();
  const watcher = Deno.watchFs(getDownloadDir(), { recursive: false });

  // 可能会触发多次解压
  const unPending = new Set<string>();

  for await (const event of watcher) {
    if (event.kind === "modify") {
      const files = event.paths.filter((path) =>
        path.endsWith(".zip") || path.endsWith(".rar")
      );

      if (files.length === 0) {
        continue;
      }
      files.forEach(async (file) => {
        if (unPending.has(file)) {
          return;
        }
        
        unPending.add(file);
        const date = new Date();

        try {
          const output = formatOutput(demo, date, file);
          const pendingFlagFile = resolve(output, "un-pending");
          if (await exists(output, { isDirectory: true })) {
            return;
          }
          await ensureDir(output);
          await ensureFile(pendingFlagFile);
          await un(file, output);
          await Deno.remove(pendingFlagFile);
          await ensureRemove(file, HOUR);
          await ensureRemove(output, HOUR);
        } catch (error) {
          await ensureDir("logs");
          await writeTextLog({
            date,
            file,
            error,
          });
        } finally {
          await delay(2000);
          unPending.delete(file);
        }
      });
    }
  }
}

function formatOutput(output: string, date: Date, file: string) {
  return resolve(
    output,
    format(date, "dd-HH-mm-"),
    basename(file)
  );
}

interface LogPayload {
  date: Date;
  // deno-lint-ignore no-explicit-any
  error: any;
  file: string;
}

async function writeTextLog(
  payload: LogPayload,
) {
  const { date, file, error } = payload;
  await Deno.writeTextFile(
    `logs/${format(date, "yyyy-MM-dd")}`,
    `${file} ${error.message ?? error} ${format(date, "HH:mm:ss")}\n`,
    {
      append: true,
    },
  );
}

function un(file: string, output: string) {
  if (file.endsWith(".zip")) {
    return unzip(file, output);
  }

  if (file.endsWith(".rar")) {
    return unrar(file, output);
  }
  throw new Deno.errors.NotSupported("不支持非 .zip 和 .rar 的压缩");
}

function getDownloadDir() {
  const DOWNLOAD_DIR = Deno.env.get("DOWNLOAD_DIR");
  if (DOWNLOAD_DIR) {
    return DOWNLOAD_DIR;
  }

  const USERPROFILE = Deno.env.get("USERPROFILE");

  if (USERPROFILE) {
    return resolve(USERPROFILE, "Downloads");
  }
  throw new Deno.errors.NotFound(
    "找不到 USERPROFILE 或 DOWNLOAD_DIR 环境变量",
  );
}

function getDemoDir() {
  const DEMO_DIR = Deno.env.get("DEMO_DIR");
  if (DEMO_DIR) {
    return DEMO_DIR;
  }
  throw new Deno.errors.NotFound(
    "找不到 DEMO_DIR 环境变量",
  );
}
