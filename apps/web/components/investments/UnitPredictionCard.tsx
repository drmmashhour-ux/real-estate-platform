"use client";

type Props = {
  title: string;
  currentValue: number;
  deliveryValue: number;
  oneYearValue: number;
  growthPercent: number;
  rentalYield: number;
  confidence: number;
};

export function UnitPredictionCard({ title, currentValue, deliveryValue, oneYearValue, growthPercent, rentalYield, confidence }: Props) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <p className="text-sm font-semibold text-white">{title}</p>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-white/5 p-3"><p className="text-xs text-slate-500">Current</p><p className="mt-1 font-semibold text-white">${currentValue.toLocaleString()}</p></div>
        <div className="rounded-xl bg-white/5 p-3"><p className="text-xs text-slate-500">Delivery</p><p className="mt-1 font-semibold text-teal-300">${deliveryValue.toLocaleString()}</p></div>
        <div className="rounded-xl bg-white/5 p-3"><p className="text-xs text-slate-500">1 Year</p><p className="mt-1 font-semibold text-teal-300">${oneYearValue.toLocaleString()}</p></div>
        <div className="rounded-xl bg-white/5 p-3"><p className="text-xs text-slate-500">Confidence</p><p className="mt-1 font-semibold text-white">{confidence}%</p></div>
      </div>
      <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-300">
        <span>Growth {growthPercent.toFixed(1)}%</span>
        <span>Rental yield {(rentalYield * 100).toFixed(1)}%</span>
      </div>
    </div>
  );
}
