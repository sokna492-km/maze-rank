import katex from "katex";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";

type MathLatexProps = {
  latex: string;
  block?: boolean;
  className?: string;
};

export function MathLatex({ latex, block = false, className }: MathLatexProps) {
  const html = katex.renderToString(latex, {
    throwOnError: false,
    displayMode: block,
  });
  const Tag = block ? "div" : "span";

  return (
    <Tag
      className={cn(block && "overflow-x-auto", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
