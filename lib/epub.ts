import epub from "epub-gen-memory";

interface EpubOptions {
  title: string;
  author: string;
  html: string;
}

export async function generateEpub({
  title,
  author,
  html,
}: EpubOptions): Promise<Buffer> {
  const options = {
    title,
    author,
    css: `
      body {
        font-family: serif;
        line-height: 1.6;
      }
      h1, h2, h3, h4, h5, h6 {
        margin-top: 1.5em;
        margin-bottom: 0.5em;
      }
      p {
        margin: 0.5em 0;
      }
      code {
        font-family: monospace;
        background: #f4f4f4;
        padding: 0.2em 0.4em;
        border-radius: 3px;
      }
      pre {
        background: #f4f4f4;
        padding: 1em;
        overflow-x: auto;
        border-radius: 5px;
      }
      pre code {
        background: none;
        padding: 0;
      }
      blockquote {
        border-left: 3px solid #ccc;
        padding-left: 1em;
        margin-left: 0;
        font-style: italic;
      }
      ul, ol {
        padding-left: 1.5em;
      }
      a {
        color: #0066cc;
      }
      img {
        max-width: 100%;
        height: auto;
      }
    `,
  };

  const content = [
    {
      title: title,
      content: html,
    },
  ];

  const epubBuffer = await epub(options, content);

  return Buffer.from(epubBuffer);
}
