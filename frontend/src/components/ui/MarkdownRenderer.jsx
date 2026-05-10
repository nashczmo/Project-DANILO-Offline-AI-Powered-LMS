import React, { memo, useMemo } from "react";
import { cn } from "../../lib/utils";

function parseInline(text) {
  let html = text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noreferrer" class="text-danilo-primary hover:underline">$1</a>');
  return html;
}

function parseMarkdown(text) {
  const lines = text.split("\n");
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      let code = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        code.push(lines[i]);
        i++;
      }
      blocks.push({ type: "code", lang, content: code.join("\n") });
      i++;
    } else if (line.startsWith("# ")) {
      blocks.push({ type: "h1", content: line.slice(2) });
      i++;
    } else if (line.startsWith("## ")) {
      blocks.push({ type: "h2", content: line.slice(3) });
      i++;
    } else if (line.startsWith("### ")) {
      blocks.push({ type: "h3", content: line.slice(4) });
      i++;
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      const items = [];
      while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("* "))) {
        items.push(lines[i].slice(2));
        i++;
      }
      blocks.push({ type: "ul", items });
    } else if (/^\d+\.\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ""));
        i++;
      }
      blocks.push({ type: "ol", items });
    } else if (line.trim() === "") {
      i++;
    } else {
      let para = [];
      while (i < lines.length && lines[i].trim() !== "" && !lines[i].startsWith("#") && !lines[i].startsWith("- ") && !lines[i].startsWith("* ") && !/^\d+\.\s/.test(lines[i]) && !lines[i].startsWith("```")) {
        para.push(lines[i]);
        i++;
      }
      blocks.push({ type: "p", content: para.join(" ") });
    }
  }
  return blocks;
}

export default memo(function MarkdownRenderer({ content, className }) {
  const blocks = useMemo(() => parseMarkdown(String(content || "")), [content]);

  return (
    <div className={cn("text-sm leading-relaxed text-danilo-text-secondary", className)}>
      {blocks.map((block, idx) => {
        switch (block.type) {
          case "h1":
            return <h1 key={idx} className="text-lg font-bold text-danilo-text mt-4 mb-2" dangerouslySetInnerHTML={{ __html: parseInline(block.content) }} />;
          case "h2":
            return <h2 key={idx} className="text-base font-semibold text-danilo-text mt-4 mb-2" dangerouslySetInnerHTML={{ __html: parseInline(block.content) }} />;
          case "h3":
            return <h3 key={idx} className="text-sm font-semibold text-danilo-text mt-3 mb-1.5" dangerouslySetInnerHTML={{ __html: parseInline(block.content) }} />;
          case "ul":
            return (
              <ul key={idx} className="list-disc pl-5 my-2 space-y-1">
                {block.items.map((item, j) => (
                  <li key={j} dangerouslySetInnerHTML={{ __html: parseInline(item) }} />
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={idx} className="list-decimal pl-5 my-2 space-y-1">
                {block.items.map((item, j) => (
                  <li key={j} dangerouslySetInnerHTML={{ __html: parseInline(item) }} />
                ))}
              </ol>
            );
          case "code":
            return (
              <div key={idx} className="my-3 relative group">
                {block.lang && <span className="absolute top-2 right-3 text-[10px] text-danilo-text-muted font-mono uppercase">{block.lang}</span>}
                <pre className="bg-danilo-bg border border-danilo-border rounded-xl p-4 overflow-x-auto text-sm"><code className="text-danilo-text-secondary">{block.content}</code></pre>
              </div>
            );
          default:
            return <p key={idx} className="my-1.5" dangerouslySetInnerHTML={{ __html: parseInline(block.content) }} />;
        }
      })}
    </div>
  );
});
