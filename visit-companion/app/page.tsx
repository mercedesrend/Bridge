import { readFileSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";

function visitMarkup() {
  const html = readFileSync(join(process.cwd(), "frontend/index.html"), "utf8");
  return html
    .replace(/^[\s\S]*?<body[^>]*>/i, "")
    .replace(/<\/body>[\s\S]*$/i, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "");
}

export default function Page() {
  return <div dangerouslySetInnerHTML={{ __html: visitMarkup() }} />;
}
