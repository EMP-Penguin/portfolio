const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(process.argv[2] || process.cwd());
const port = Number(process.argv[3] || 8000);
const host = "127.0.0.1";

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp"
};

http.createServer((request, response) => {
  const pathname = decodeURIComponent((request.url || "/").split("?")[0]);
  const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const filePath = path.resolve(root, relativePath);

  if (!filePath.startsWith(root)) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    response.writeHead(200, {
      "Content-Type": mime[extension] || "application/octet-stream",
      "Cache-Control": "no-cache"
    });
    response.end(data);
  });
}).listen(port, host, () => {
  console.log(`Portfolio server: http://${host}:${port}`);
});
