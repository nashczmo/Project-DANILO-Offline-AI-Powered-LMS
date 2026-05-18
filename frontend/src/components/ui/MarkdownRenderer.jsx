import { memo, useMemo, useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "../../lib/utils";

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function parseInline(text) {
  let html = escapeHtml(text);

  html = html.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    '<img src="$2" alt="$1" class="rounded-lg max-w-full h-auto my-2 border border-danilo-border" loading="lazy" />'
  );

  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noreferrer" class="text-danilo-primary hover:underline font-medium">$1</a>'
  );

  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__(.+?)__/g, "<strong>$1</strong>");

  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/_(.+?)_/g, "<em>$1</em>");

  html = html.replace(
    /`([^`]+)`/g,
    '<code class="px-1.5 py-0.5 bg-danilo-bg-tertiary rounded-md text-xs font-mono text-danilo-text border border-danilo-border/60">$1</code>'
  );

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
    } else if (/^(#{1,6})\s/.test(line)) {
      const match = line.match(/^(#{1,6})\s(.*)$/);
      const level = match[1].length;
      blocks.push({ type: `h${level}`, content: match[2] });
      i++;
    } else if (/^(---|\*\*\*|___)\s*$/.test(line)) {
      blocks.push({ type: "hr" });
      i++;
    } else if (line.startsWith("> ")) {
      const quote = [];
      while (i < lines.length && lines[i].startsWith("> ")) {
        quote.push(lines[i].slice(2));
        i++;
      }
      blocks.push({ type: "blockquote", content: quote.join("\n") });
    } else if (
      /^\|.*\|$/.test(line) &&
      i + 1 < lines.length &&
      /^\|[\s|:-]+\|$/.test(lines[i + 1])
    ) {
      const headerCells = line
        .split("|")
        .slice(1, -1)
        .map((c) => c.trim());
      i += 2;
      const rows = [];
      while (i < lines.length && /^\|.*\|$/.test(lines[i])) {
        rows.push(
          lines[i]
            .split("|")
            .slice(1, -1)
            .map((c) => c.trim())
        );
        i++;
      }
      blocks.push({ type: "table", headers: headerCells, rows });
    } else if (/^-\s|^[*]\s/.test(line)) {
      const items = [];
      while (
        i < lines.length &&
        (/^-\s/.test(lines[i]) || /^[*]\s/.test(lines[i]))
      ) {
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
      while (
        i < lines.length &&
        lines[i].trim() !== "" &&
        !lines[i].startsWith("#") &&
        !lines[i].startsWith("- ") &&
        !lines[i].startsWith("* ") &&
        !/^\d+\.\s/.test(lines[i]) &&
        !lines[i].startsWith("```") &&
        !lines[i].startsWith("> ") &&
        !/^(---|\*\*\*|___)\s*$/.test(lines[i]) &&
        !/^\|.*\|$/.test(lines[i])
      ) {
        para.push(lines[i]);
        i++;
      }
      blocks.push({ type: "p", content: para.join(" ") });
    }
  }
  return blocks;
}

function CodeBlock({ lang, content }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <div className="my-3 relative group">
      <div className="flex items-center justify-between px-3 py-2 bg-danilo-bg-tertiary border border-danilo-border border-b-0 rounded-t-xl">
        {lang ? (
          <span className="text-2xs text-danilo-text-muted font-mono uppercase tracking-wider">
            {lang}
          </span>
        ) : (
          <span />
        )}
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-2xs text-danilo-text-muted hover:text-danilo-text transition-colors"
          title="Copy code"
          type="button"
        >
          {copied ? (
            <Check className="w-3 h-3" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="bg-danilo-bg-secondary border border-danilo-border rounded-b-xl p-4 overflow-x-auto text-sm">
        <code className="font-mono text-danilo-text-secondary leading-relaxed">
          {content}
        </code>
      </pre>
    </div>
  );
}

export default memo(function MarkdownRenderer({ content, className }) {
  const blocks = useMemo(() => parseMarkdown(String(content || "")), [content]);

  return (
    <div className={cn("text-sm leading-relaxed text-danilo-text-secondary", className)}>
      {blocks.map((block, idx) => {
        switch (block.type) {
          case "h1":
            return (
              <h1
                key={idx}
                className="text-xl font-bold text-danilo-text mt-6 mb-3 pb-2 border-b border-danilo-border tracking-tight"
              >
                <span dangerouslySetInnerHTML={{ __html: parseInline(block.content) }} />
              </h1>
            );
          case "h2":
            return (
              <h2
                key={idx}
                className="text-lg font-semibold text-danilo-text mt-5 mb-2 tracking-tight"
              >
                <span dangerouslySetInnerHTML={{ __html: parseInline(block.content) }} />
              </h2>
            );
          case "h3":
            return (
              <h3
                key={idx}
                className="text-base font-semibold text-danilo-text mt-4 mb-2 tracking-tight"
              >
                <span dangerouslySetInnerHTML={{ __html: parseInline(block.content) }} />
              </h3>
            );
          case "h4":
            return (
              <h4
                key={idx}
                className="text-sm font-semibold text-danilo-text mt-3 mb-1.5 tracking-tight"
              >
                <span dangerouslySetInnerHTML={{ __html: parseInline(block.content) }} />
              </h4>
            );
          case "h5":
          case "h6":
            return (
              <h5
                key={idx}
                className="text-sm font-medium text-danilo-text-secondary mt-3 mb-1.5 tracking-tight"
              >
                <span dangerouslySetInnerHTML={{ __html: parseInline(block.content) }} />
              </h5>
            );
          case "hr":
            return <hr key={idx} className="my-6 border-danilo-border" />;
          case "blockquote":
            return (
              <blockquote
                key={idx}
                className="my-3 pl-4 border-l-4 border-danilo-primary/30 bg-danilo-bg-secondary rounded-r-xl py-3 pr-4 text-danilo-text-secondary italic"
              >
                <div
                  dangerouslySetInnerHTML={{
                    __html: parseInline(block.content).replace(/\n/g, "<br/>"),
                  }}
                />
              </blockquote>
            );
          case "table":
            return (
              <div key={idx} className="my-4 overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-danilo-bg-tertiary">
                      {block.headers.map((h, j) => (
                        <th
                          key={j}
                          className={cn(
                            "text-left px-3 py-2 font-semibold text-danilo-text border border-danilo-border",
                            j === 0 && "rounded-tl-xl",
                            j === block.headers.length - 1 && "rounded-tr-xl"
                          )}
                        >
                          <span dangerouslySetInnerHTML={{ __html: parseInline(h) }} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, r) => (
                      <tr
                        key={r}
                        className={r % 2 === 1 ? "bg-danilo-bg-secondary" : "bg-white"}
                      >
                        {row.map((cell, c) => (
                          <td
                            key={c}
                            className={cn(
                              "px-3 py-2 border border-danilo-border text-danilo-text-secondary",
                              r === block.rows.length - 1 &&
                                c === 0 &&
                                "rounded-bl-xl",
                              r === block.rows.length - 1 &&
                                c === row.length - 1 &&
                                "rounded-br-xl"
                            )}
                          >
                            <span dangerouslySetInnerHTML={{ __html: parseInline(cell) }} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case "ul":
            return (
              <ul
                key={idx}
                className="my-2 pl-5 space-y-1 list-disc marker:text-danilo-primary"
              >
                {block.items.map((item, j) => (
                  <li
                    key={j}
                    className="text-danilo-text-secondary pl-1"
                    dangerouslySetInnerHTML={{ __html: parseInline(item) }}
                  />
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol
                key={idx}
                className="my-2 pl-5 space-y-1 list-decimal marker:text-danilo-text-muted"
              >
                {block.items.map((item, j) => (
                  <li
                    key={j}
                    className="text-danilo-text-secondary pl-1"
                    dangerouslySetInnerHTML={{ __html: parseInline(item) }}
                  />
                ))}
              </ol>
            );
          case "code":
            return <CodeBlock key={idx} lang={block.lang} content={block.content} />;
          default:
            return (
              <p
                key={idx}
                className="my-2"
                dangerouslySetInnerHTML={{ __html: parseInline(block.content) }}
              />
            );
        }
      })}
    </div>
  );
});
