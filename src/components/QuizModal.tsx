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
          "radial-gradient(ellipse 80% 60% at 50% 40%, color-mix(in oklab, var(--primary) 14%, transparent), rgba(0,0,0,0.78))",
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="quiz-prompt"
    >
      <div
        className="win-card-in w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-background/95 p-5 shadow-2xl backdrop-blur-xl sm:p-6"
        style={{
          boxShadow: `0 0 48px color-mix(in oklab, ${color} 22%, transparent), 0 20px 40px rgba(0,0,0,0.45)`,
        }}
      >
        <p
          lang="km"
          className="font-khmer mb-1 text-center text-sm font-semibold text-muted-foreground"
        >
          ដោះស្រាយសិន ចាំទៅបន្ត 😊
        </p>
        <div
          id="quiz-prompt"
          className="mb-5 overflow-x-auto text-center text-lg leading-snug font-semibold sm:text-xl"
          style={{ color }}
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
                  "flex w-full items-center gap-3 rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3.5 text-left text-base transition-colors",
                  "hover:bg-white/[0.08] active:scale-[0.98]",
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
                <span className="min-w-0 flex-1 text-foreground/90">
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
