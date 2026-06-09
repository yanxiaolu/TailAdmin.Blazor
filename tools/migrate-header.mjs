import fs from "node:fs";
import path from "node:path";

const root = path.resolve("..");
const headerSource = path.join(root, "src", "partials", "header.html");
const headerDest = path.join(process.cwd(), "Components", "Header.razor");

if (!fs.existsSync(headerSource)) {
  console.error(`Error: source header not found at ${headerSource}`);
  process.exit(1);
}

let html = fs.readFileSync(headerSource, "utf8");

// Normalize image paths and links
html = html
  .replace(/\ssrc="\.\//g, ' src="')
  .replace(/\shref="\.\//g, ' href="')
  .replace(/url\("\.\//g, 'url("')
  // Replace .html hrefs
  .replace(/href="([^"]+\.html)"/g, (_, href) => {
    const clean = href.replace(/^\.\//, "").replace(/\.html$/, "");
    if (clean === "index") return 'href="/"';
    return `href="/${clean}"`;
  });

// Write to destination
fs.writeFileSync(headerDest, html);
console.log("Header migrated successfully!");
