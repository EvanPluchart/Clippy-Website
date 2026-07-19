import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || "127.0.0.1";

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

const resolvePath = (requestUrl) => {
  const pathname = decodeURIComponent(new URL(requestUrl, `http://${host}`).pathname);
  const clean = normalize(pathname).replace(/^(\.\.(\/|\\|$))+/, "");
  const candidates = [];

  if (clean === "/" || clean === ".") {
    candidates.push(join(root, "index.html"));
  } else {
    const direct = join(root, clean);
    candidates.push(direct);
    if (!extname(clean)) {
      candidates.push(`${direct}.html`, join(direct, "index.html"));
    }
  }

  return candidates.find((candidate) => {
    try {
      return candidate.startsWith(root) && existsSync(candidate) && statSync(candidate).isFile();
    } catch {
      return false;
    }
  }) || join(root, "404.html");
};

createServer((request, response) => {
  const path = resolvePath(request.url || "/");
  const is404 = path.endsWith("404.html") && !String(request.url).startsWith("/404");

  response.writeHead(is404 ? 404 : 200, {
    "Cache-Control": path.includes("/assets/") ? "public, max-age=3600" : "no-cache",
    "Content-Type": contentTypes[extname(path)] || "application/octet-stream",
    "X-Content-Type-Options": "nosniff",
  });
  createReadStream(path).pipe(response);
}).listen(port, host, () => {
  console.log(`Clippy website: http://${host}:${port}`);
});
