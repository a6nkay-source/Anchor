// Tiny markdown renderer — enough for headings, bold, italic, code, quote,
// bullets, and paragraphs. Not a substitute for a real MD lib, but zero deps.

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function inline(s: string) {
  return esc(s)
    .replace(/`([^`]+)`/g, '<code class="rounded bg-neutral-900 px-1 py-0.5 text-[0.85em]">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

export function renderMarkdown(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  let inList = false;
  let inQuote = false;

  const closeList = () => {
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
  };
  const closeQuote = () => {
    if (inQuote) {
      out.push("</blockquote>");
      inQuote = false;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^#\s+(.*)/.test(line)) {
      closeList();
      closeQuote();
      out.push(`<h1 class="mt-4 mb-2 text-xl font-semibold text-neutral-100">${inline(line.replace(/^#\s+/, ""))}</h1>`);
      continue;
    }
    if (/^##\s+(.*)/.test(line)) {
      closeList();
      closeQuote();
      out.push(`<h2 class="mt-3 mb-1 text-base font-medium text-neutral-100">${inline(line.replace(/^##\s+/, ""))}</h2>`);
      continue;
    }
    if (/^-\s+/.test(line)) {
      closeQuote();
      if (!inList) {
        out.push('<ul class="my-2 space-y-1 text-sm text-neutral-300">');
        inList = true;
      }
      out.push(`<li class="pl-4 relative"><span class="absolute left-0 top-2 h-1 w-1 rounded-full bg-cyan-400/60"></span>${inline(line.replace(/^-\s+/, ""))}</li>`);
      continue;
    }
    if (/^>\s+/.test(line)) {
      closeList();
      if (!inQuote) {
        out.push('<blockquote class="my-2 border-l-2 border-cyan-400/50 pl-3 text-sm italic text-neutral-400">');
        inQuote = true;
      }
      out.push(inline(line.replace(/^>\s+/, "")));
      continue;
    }
    if (line.length === 0) {
      closeList();
      closeQuote();
      out.push("<div class='h-2'></div>");
      continue;
    }
    closeList();
    closeQuote();
    out.push(`<p class="my-1 text-sm leading-relaxed text-neutral-300">${inline(line)}</p>`);
  }
  closeList();
  closeQuote();
  return out.join("\n");
}
