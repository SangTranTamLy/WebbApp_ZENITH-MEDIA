import { useEffect, useRef, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

type CodeBlockProps = {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  className?: string;
};

type CopyStatus = "idle" | "copied" | "error";

const languageAliases: Record<string, string> = {
  typescript: "typescript",
  javascript: "javascript",
  react: "tsx",
  jsx: "jsx",
  tsx: "tsx",
  express: "typescript",
  node: "javascript",
  css: "css",
  html: "html",
  json: "json",
  sql: "sql",
};

function normalizeLanguage(language: string) {
  return languageAliases[language.toLowerCase()] ?? "text";
}

export function CodeBlock({
  code,
  language = "text",
  showLineNumbers = true,
  className = "",
}: CodeBlockProps) {
  const [copyStatus, setCopyStatus] =
    useState<CopyStatus>("idle");

  const resetTimer = useRef<number | null>(null);
  const normalizedLanguage = normalizeLanguage(language);

  useEffect(() => {
    return () => {
      if (resetTimer.current !== null) {
        window.clearTimeout(resetTimer.current);
      }
    };
  }, []);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopyStatus("copied");

      if (resetTimer.current !== null) {
        window.clearTimeout(resetTimer.current);
      }

      resetTimer.current = window.setTimeout(() => {
        setCopyStatus("idle");
      }, 1800);
    } catch {
      setCopyStatus("error");
    }
  }

  const copyLabel = {
    idle: "COPY CODE",
    copied: "COPIED ✓",
    error: "COPY FAILED",
  }[copyStatus];

  return (
    <div className={`code-block ${className}`.trim()}>
      <div className="code-block-toolbar">
        <span>{language.toUpperCase()}</span>

        <button
          type="button"
          onClick={copyCode}
          aria-label={`Copy ${language} code`}
        >
          {copyLabel}
        </button>
      </div>

      <SyntaxHighlighter
        language={normalizedLanguage}
        style={vscDarkPlus}
        showLineNumbers={showLineNumbers}
        wrapLongLines={false}
        customStyle={{
          margin: 0,
          padding: "24px",
          background: "#080b10",
          fontSize: "12px",
          lineHeight: "1.75",
        }}
        codeTagProps={{
          style: {
            fontFamily: "monospace",
          },
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}