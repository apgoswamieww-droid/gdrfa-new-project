export function editorJsToHtml(data: string | null | undefined): string {
  if (!data) return "";

  let parsed: { blocks?: { type: string; data: Record<string, any> }[] } | null = null;
  try {
    parsed = JSON.parse(data);
  } catch {
    return data;
  }

  if (!parsed || !Array.isArray(parsed.blocks) || parsed.blocks.length === 0) {
    return "";
  }

  return parsed.blocks
    .map((block) => {
      switch (block.type) {
        case "header": {
          const level = block.data.level || 2;
          return `<h${level}>${block.data.text}</h${level}>`;
        }
        case "paragraph":
          return `<p>${block.data.text}</p>`;
        case "list": {
          const tag = block.data.style === "ordered" ? "ol" : "ul";
          const items = (block.data.items || [])
            .map((item: any) => {
              const text = typeof item === "string" ? item : item.content || item.text || "";
              return `<li>${text}</li>`;
            })
            .join("");
          return `<${tag}>${items}</${tag}>`;
        }
        case "quote":
          return `<blockquote><p>${block.data.text}</p>${
            block.data.caption ? `<cite>— ${block.data.caption}</cite>` : ""
          }</blockquote>`;
        case "checklist":
          return `<ul>${
            (block.data.items || [])
              .map(
                (item: { text: string; checked: boolean }) =>
                  `<li>${item.checked ? "&#10003;" : ""} ${item.text}</li>`
              )
              .join("")
          }</ul>`;
        case "delimiter":
          return "<hr />";
        case "inline-code":
        case "code":
          return `<pre><code>${escapeHtml(block.data.code || block.data.text || "")}</code></pre>`;
        case "table": {
          const rows = (block.data.content || [])
            .map(
              (row: string[]) =>
                `<tr>${row
                  .map((cell: string) => `<td>${cell}</td>`)
                  .join("")}</tr>`
            )
            .join("");
          return `<table><tbody>${rows}</tbody></table>`;
        }
        case "embed":
          return `<div class="embed-wrapper"><iframe src="${block.data.embed}" frameborder="0" allowfullscreen></iframe>${
            block.data.caption ? `<p>${block.data.caption}</p>` : ""
          }</div>`;
        default:
          return "";
      }
    })
    .join("");
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (c) => map[c]);
}
