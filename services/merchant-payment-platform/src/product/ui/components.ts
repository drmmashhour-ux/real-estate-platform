import type { DesignTokens } from "../design-system/tokens.js";
import { escapeHtml } from "./html.js";

export type StatusTone = "neutral" | "success" | "warning" | "danger";

export interface TableColumn<T> {
  header: string;
  render: (row: T) => string;
}

export function renderButton(label: string, tokens: DesignTokens): string {
  return `<button class="nx-button" type="button" style="background:${tokens.colors.primary};color:white;border:0;border-radius:${tokens.radii.md};padding:${tokens.spacing.md};font-weight:${tokens.typography.weights.semibold};width:100%;">${escapeHtml(label)}</button>`;
}

export function renderCard(content: string): string {
  return `<section class="card">${content}</section>`;
}

export function renderKpiCard(label: string, value: string, helper: string): string {
  return renderCard(`<div class="muted">${escapeHtml(label)}</div><h2>${escapeHtml(value)}</h2><p class="muted">${escapeHtml(helper)}</p>`);
}

export function renderStatusBadge(label: string, tone: StatusTone = "neutral"): string {
  return `<span class="status ${tone}">${escapeHtml(label)}</span>`;
}

export function renderDataTable<T>(columns: readonly TableColumn<T>[], rows: readonly T[]): string {
  const header = columns.map((column) => `<th>${escapeHtml(column.header)}</th>`).join("");
  const body = rows
    .map((row) => `<tr>${columns.map((column) => `<td>${column.render(row)}</td>`).join("")}</tr>`)
    .join("");
  return `<table><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table>`;
}

export function statusTone(status: string): StatusTone {
  if (["completed", "settled", "success", "active"].includes(status)) return "success";
  if (["pending", "initiated", "authorized", "recorded"].includes(status)) return "warning";
  if (["failed", "suspended", "rejected"].includes(status)) return "danger";
  return "neutral";
}
