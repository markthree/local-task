// 魔改自 https://github.com/sudhakar3697/node-clipboard-event
import { platform } from "npm:std-env@3.7.0";
import { join } from "https://deno.land/std@0.212.0/path/join.ts";
import {
  _dirname,
  gracefulShutdown,
} from "https://deno.land/x/easy_std@v0.7.1/mod.ts";
import * as clippy from "https://deno.land/x/clippy@v1.0.0/mod.ts";

function execFile(file: string) {
  const cmd = new Deno.Command(file, {
    stdout: "piped",
  });

  const child = cmd.spawn();
  gracefulShutdown(() => {
    try {
      child.kill();
    } catch (_) {
    }
  });

  return child.stdout;
}

const __dirname = _dirname(import.meta.url);

type WatchClipboardFn = (text: string) => Promise<void>;

export function watchClipboard(fn: WatchClipboardFn) {
  let stdout;
  if (platform === "win32") {
    stdout = execFile(
      join(__dirname, "platform/clipboard-event-handler-win32.exe"),
    );
  } else if (platform === "linux") {
    stdout = execFile(
      join(__dirname, "platform/clipboard-event-handler-linux"),
    );
  } else if (platform === "darwin") {
    stdout = execFile(
      join(__dirname, "platform/clipboard-event-handler-mac"),
    );
  } else {
    throw "Not yet supported";
  }
  const textDecoder = new TextDecoder();
  let lastText = "";
  stdout.pipeTo(
    new WritableStream({
      async write(chunk) {
        const text = await clippy.readText();
        const event =  textDecoder.decode(chunk).trim() 
        if (
          event === "CLIPBOARD_CHANGE" &&
          lastText !== text
        ) {
          lastText = text;
          await fn(text);
        }
      },
    }),
  );
}
