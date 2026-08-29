import { useEffect } from "react";
import type { Quiz } from "@/lib/math-quiz";
import { cn } from "@/lib/utils";
import { MathLatex } from "@/components/MathLatex";

type QuizModalProps = {
  quiz: Quiz;
  color: string;
  onAnswer: (choiceIndex: number) => void;
};

export function QuizModal({ quiz, color, onAnswer }: QuizModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (n >= 1 && n <= 4) {
        e.preventDefault();
        onAnswer(n - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onAnswer, quiz.id]);

  return (
    <div
      className="win-overlay-in absolute inset-0 z-30 grid place-items-center px-4"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 50% 40%, color-mix(in oklab, var(--primary) 14%, transparent), var(--overlay-scrim))",
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="quiz-prompt"
    >
      <div
        className="win-card-in w-full max-w-sm max-h-[min(90dvh,36rem)] overflow-y-auto rounded-3xl border border-border bg-background/95 p-5 shadow-2xl backdrop-blur-xl sm:p-6"
        style={{
          boxShadow: `0 0 48px color-mix(in oklab, ${color} 22%, transparent), 0 20px 40px color-mix(in oklab, var(--foreground) 12%, transparent)`,
        }}
      >
        <p
          lang="km"
          className="font-khmer mb-1 text-center text-base font-semibold text-foreground"
        >
          ដោះស្រាយសិន ចាំទៅបន្ត 😊
        </p>
        <div
          id="quiz-prompt"
          className="mb-5 overflow-x-auto text-center text-xl leading-snug font-semibold text-foreground sm:text-2xl"
        >
          <MathLatex latex={quiz.prompt} block />
        </div>
        <ul className="flex flex-col gap-2.5">
          {quiz.choices.map((choice, i) => (
            <li key={`${quiz.id}-${i}`}>
              <button
                type="button"
                onClick={() => onAnswer(i)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl border border-border bg-muted/40 px-4 py-3.5 text-left text-base transition-colors",
                  "hover:bg-muted/70 active:scale-[0.98]",
                )}
              >
                <span
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-semibold"
                  style={{
                    color,
                    background: `color-mix(in oklab, ${color} 18%, transparent)`,
                    border: `1px solid color-mix(in oklab, ${color} 35%, transparent)`,
                  }}
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 text-foreground">
                  <MathLatex latex={choice} />
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
