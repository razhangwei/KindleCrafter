import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

export async function parseMarkdown(markdown: string): Promise<string> {
  marked.setOptions({
    gfm: true,
    breaks: true,
  });

  const rawHtml = await marked.parse(markdown);

  const cleanHtml = sanitizeHtml(rawHtml, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      "h1", "h2", "h3", "h4", "h5", "h6", "img", "pre", "code"
    ]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ["src", "alt", "title"],
      a: ["href", "title", "target"],
      code: ["class"],
      pre: ["class"],
    },
  });

  return cleanHtml;
}

export function extractTitleFromFilename(filename: string): string {
  return filename
    .replace(/\.md$/i, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function extractTitleFromMarkdown(markdown: string): string | null {
  // Match first H1 heading: # Title
  const h1Match = markdown.match(/^#\s+(.+)$/m);
  if (h1Match && h1Match[1]) {
    return h1Match[1].trim();
  }
  return null;
}
