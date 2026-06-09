import fs from "node:fs";
import path from "node:path";

const root = path.resolve("..");
const sourceRoot = path.join(root, "src");
const projectRoot = process.cwd();
const razorOut = path.join(projectRoot, "Pages");

const includePattern =
  /<include\s+src=["'](.+?)["']\s*\/?>\s*(?:<\/include>)?/gis;

const pageRoutes = new Map([
  ["index", "/"],
  ["signin", "/signin"],
  ["signup", "/signup"],
  ["profile", "/profile"],
  ["calendar", "/calendar"],
  ["form-elements", "/form-elements"],
  ["basic-tables", "/basic-tables"],
  ["line-chart", "/line-chart"],
  ["bar-chart", "/bar-chart"],
  ["alerts", "/alerts"],
  ["buttons", "/buttons"],
  ["badge", "/badge"],
  ["avatars", "/avatars"],
  ["images", "/images"],
  ["videos", "/videos"],
  ["blank", "/blank"],
  ["404", "/404"],
  ["sidebar", "/sidebar"],
]);

const layoutPartials = ["preloader.html", "sidebar.html", "overlay.html", "header.html"];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function expandIncludes(content, currentDir) {
  return content.replace(includePattern, (_, includePath) => {
    const base = path.basename(includePath);
    if (layoutPartials.includes(base)) {
      return ""; // Skip layout partials
    }
    const filePath = path.resolve(currentDir, includePath);
    if (!fs.existsSync(filePath)) {
      console.warn(`Warning: file not found ${filePath}`);
      return "";
    }
    const nested = fs.readFileSync(filePath, "utf8");
    return expandIncludes(nested, path.dirname(filePath));
  });
}

function razorIdentifier(fileName) {
  if (fileName === "404") return "Page404";
  return fileName
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function cleanHtmlContent(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, "") // Remove inline scripts
    .replace(/\ssrc="\.\//g, ' src="')           // Normalize image src
    .replace(/\shref="\.\//g, ' href="')         // Normalize href
    .replace(/url\("\.\//g, 'url("')             // Normalize CSS background urls
    .replace(/href="([^"]+\.html)"/g, (_, href) => { // Replace html links with Blazor routes
      const clean = href.replace(/^\.\//, "").replace(/\.html$/, "");
      const route = pageRoutes.get(clean) ?? href;
      return `href="${route}"`;
    });
}

function splitBody(html) {
  const bodyStart = html.search(/<body\b/i);
  if (bodyStart === -1) {
    return null;
  }

  let quote = null;
  let tagEnd = -1;
  for (let index = bodyStart; index < html.length; index += 1) {
    const char = html[index];
    if ((char === '"' || char === "'") && html[index - 1] !== "\\") {
      quote = quote === char ? null : quote ?? char;
    }

    if (char === ">" && quote === null) {
      tagEnd = index;
      break;
    }
  }

  if (tagEnd === -1) {
    return null;
  }

  const closeMatch = html.slice(tagEnd + 1).match(/<\/body>/i);
  if (!closeMatch) {
    return null;
  }

  const inner = html.slice(tagEnd + 1, tagEnd + 1 + closeMatch.index);
  return inner;
}

function migratePage(fileName) {
  const sourceFile = path.join(sourceRoot, `${fileName}.html`);
  if (!fs.existsSync(sourceFile)) {
    console.warn(`Source file not found: ${sourceFile}`);
    return;
  }

  let html = fs.readFileSync(sourceFile, "utf8");

  // Extract page title
  const titleMatch = html.match(/<title>\s*([\s\S]*?)\s*<\/title>/i);
  const title = titleMatch
    ? titleMatch[1].replace(/\s+/g, " ").trim()
    : "TailAdmin";

  // Replace breadcrumb includes with the Blazor component
  const breadcrumbPattern = /<div\s+x-data=["']\{\s*pageName:\s*[`'"](.+?)[`'"]\s*\}\s*["']\s*>\s*<include\s+src=["'].*?breadcrumb\.html["']\s*\/?>\s*(?:<\/include>)?\s*<\/div>/gis;
  html = html.replace(breadcrumbPattern, (_, pageName) => {
    return `<Breadcrumb PageName="${pageName}" />`;
  });

  // Expand remaining non-layout includes
  let expanded = expandIncludes(html, sourceRoot);

  // Parse out the main body or layout content
  const mainMatch = expanded.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);

  const route = pageRoutes.get(fileName);
  const componentName = razorIdentifier(fileName);

  let finalContent = "";
  if (mainMatch) {
    // Normal layout page
    const mainContent = cleanHtmlContent(mainMatch[1]);
    finalContent = `@page "${route}"

<PageTitle>${title}</PageTitle>

${mainContent}
`;
  } else {
    // Standalone page (signin, signup, 404)
    // Extract everything inside <body> excluding layout includes
    const bodyInner = splitBody(expanded);
    const rawBody = bodyInner !== null ? bodyInner : expanded;
    const bodyContent = cleanHtmlContent(rawBody);

    finalContent = `@page "${route}"
@layout EmptyLayout

<PageTitle>${title}</PageTitle>

${bodyContent}
`;
  }

  const outPath = path.join(razorOut, `${componentName}.razor`);
  fs.writeFileSync(outPath, finalContent);
  console.log(`Migrated: ${fileName}.html -> ${componentName}.razor`);
}

ensureDir(razorOut);

for (const [fileName] of pageRoutes) {
  migratePage(fileName);
}
console.log("Migration complete!");
