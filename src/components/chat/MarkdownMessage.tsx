import { memo, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface MarkdownMessageProps {
  content: string;
}

/**
 * Render assistant messages as Markdown with GFM tables/strikethrough and
 * hljs-based syntax highlighting. The <code> renderer switches between an
 * inline chip and a block with a copy button.
 */
export const MarkdownMessage = memo(function MarkdownMessage({
  content,
}: MarkdownMessageProps) {
  const components: Components = {
    code({ className, children, ...props }) {
      const isInline = !/language-/.test(className ?? "");
      if (isInline) {
        return (
          <code className={className} {...props}>
            {children}
          </code>
        );
      }
      const text = String(children).replace(/\n$/, "");
      const language = (className ?? "").replace(/language-/, "") || "text";
      return (
        <CodeBlock code={text} language={language} className={className}>
          {children}
        </CodeBlock>
      );
    },
    a({ href, children, ...props }) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          {...props}
        >
          {children}
        </a>
      );
    },
  };

  return (
    <div className="prose prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeHighlight, { detect: true, ignoreMissing: true }]]}
        components={components}
      >
        {content || "\u00A0"}
      </ReactMarkdown>
    </div>
  );
});

interface CodeBlockProps {
  code: string;
  language: string;
  className?: string;
  children?: React.ReactNode;
}

function CodeBlock({ code, language, className, children }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore clipboard failures */
    }
  };
  return (
    <div className="group relative my-2">
      <div className="flex items-center justify-between rounded-t-[var(--radius-md)] border border-b-0 border-[var(--color-border)] bg-[var(--color-bg)]/60 px-3 py-1.5 text-[11px] text-[var(--color-muted)]">
        <span className="font-mono uppercase tracking-wider">{language}</span>
        <button
          type="button"
          onClick={onCopy}
          className={cn(
            "inline-flex items-center gap-1 rounded px-1.5 py-0.5 transition-colors hover:bg-[var(--color-surface)]",
            copied && "text-emerald-400",
          )}
        >
          {copied ? (
            <>
              <Check className="size-3" /> Copied
            </>
          ) : (
            <>
              <Copy className="size-3" /> Copy
            </>
          )}
        </button>
      </div>
      <pre className="!mt-0 !rounded-t-none">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}
