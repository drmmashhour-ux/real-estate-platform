import type { InvestorQACategory, InvestorQADifficulty } from "@prisma/client";
import { prisma } from "@/lib/db";

const CATEGORIES: InvestorQACategory[] = ["product", "growth", "financials", "competition", "strategy"];
const DIFFICULTIES: InvestorQADifficulty[] = ["easy", "medium", "hard"];

export function isInvestorQACategory(s: string): s is InvestorQACategory {
  return (CATEGORIES as string[]).includes(s);
}

export function isInvestorQADifficulty(s: string): s is InvestorQADifficulty {
  return (DIFFICULTIES as string[]).includes(s);
}

export async function listInvestorQA(opts: { q?: string; category?: InvestorQACategory | "all"; difficulty?: InvestorQADifficulty | "all" }) {
  const q = opts.q?.trim().toLowerCase();
  const cat = opts.category && opts.category !== "all" ? opts.category : undefined;
  const diff = opts.difficulty && opts.difficulty !== "all" ? opts.difficulty : undefined;

  const rows = await prisma.investorQA.findMany({
    where: {
      ...(cat ? { category: cat } : {}),
      ...(diff ? { difficulty: diff } : {}),
      ...(q
        ? {
            OR: [
              { question: { contains: q, mode: "insensitive" } },
              { answer: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return rows;
}

export async function createInvestorQA(input: {
  question: string;
  answer: string;
  category: InvestorQACategory;
  difficulty?: InvestorQADifficulty;
  sortOrder?: number;
}) {
  return prisma.investorQA.create({
    data: {
      question: input.question.trim(),
      answer: input.answer.trim(),
      category: input.category,
      difficulty: input.difficulty ?? "medium",
      sortOrder: input.sortOrder ?? 0,
    },
  });
}

export async function updateInvestorQA(
  id: string,
  patch: Partial<{
    question: string;
    answer: string;
    category: InvestorQACategory;
    difficulty: InvestorQADifficulty;
    sortOrder: number;
  }>,
) {
  return prisma.investorQA.update({
    where: { id },
    data: {
      ...(patch.question !== undefined ? { question: patch.question.trim() } : {}),
      ...(patch.answer !== undefined ? { answer: patch.answer.trim() } : {}),
      ...(patch.category !== undefined ? { category: patch.category } : {}),
      ...(patch.difficulty !== undefined ? { difficulty: patch.difficulty } : {}),
      ...(patch.sortOrder !== undefined ? { sortOrder: patch.sortOrder } : {}),
    },
  });
}

export async function deleteInvestorQA(id: string) {
  await prisma.investorQA.delete({ where: { id } });
}
