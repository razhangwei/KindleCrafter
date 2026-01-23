import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";

export async function parseMarkdown(markdown: string): Promise<string> {
  marked.setOptions({
    gfm: true,
    breaks: true,
  });

  const rawHtml = await marked.parse(markdown);

  const cleanHtml = DOMPurify.sanitize(rawHtml, {
    USE_PROFILES: { html: true },
  });

  return cleanHtml;
}

export function extractTitleFromFilename(filename: string): string {
  return filename
    .replace(/\.md$/i, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
