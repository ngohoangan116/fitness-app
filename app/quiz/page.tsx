"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Answers = {
  goal: string;
  level: string;
  equipment: string;
  days: string;
};

const STEPS: {
  key: keyof Answers;
  question: string;
  options: string[];
}[] = [
  {
    key: "goal",
    question: "Mục tiêu chính của bạn là gì?",
    options: ["Tăng cơ", "Giảm mỡ", "Tăng sức bền", "Duy trì vóc dáng"],
  },
  {
    key: "level",
    question: "Mức độ vận động hiện tại?",
    options: ["Mới bắt đầu", "Tập không đều", "Tập đều 3-4 buổi/tuần", "Vận động viên"],
  },
  {
    key: "equipment",
    question: "Bạn có dụng cụ gì?",
    options: ["Không có gì", "Tạ đơn / dây kháng lực", "Đầy đủ phòng gym"],
  },
  {
    key: "days",
    question: "Bạn rảnh mấy buổi mỗi tuần?",
    options: ["2 buổi", "3 buổi", "4-5 buổi", "6+ buổi"],
  },
];

export default function QuizPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<Answers>>({});

  const current = STEPS[step];
  const progress = Math.round(((step) / STEPS.length) * 100);

  function choose(option: string) {
    const next = { ...answers, [current.key]: option };
    setAnswers(next);
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      localStorage.setItem("quizAnswers", JSON.stringify(next));
      router.push("/quiz/result");
    }
  }

  return (
    <main className="min-h-screen bg-chalk-premium flex flex-col">
      {/* progress bar */}
      <div className="h-1 bg-line/20">
        <div
          className="h-1 bg-signal transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-lg w-full">
          <p className="font-mono text-xs text-steel mb-3">
            CÂU {step + 1} / {STEPS.length}
          </p>
          <h1 className="stencil text-3xl mb-9">{current.question}</h1>
          <div className="grid gap-3">
            {current.options.map((opt) => (
              <button
                key={opt}
                onClick={() => choose(opt)}
                className="text-left font-body border-2 border-ink px-5 py-4 hover:bg-ink hover:text-chalk transition-colors"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
