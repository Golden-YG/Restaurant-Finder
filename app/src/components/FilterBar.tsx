'use client';

import { Subratings } from '@/types';

export type Filters = {
  environment: number;
  foodQuality: number;
  service: number;
  priceMax: number;
  googleRating: number;
  aiRating: number;
};

export function FilterBar({ filters, setFilters }: { filters: Filters; setFilters: (f: Filters) => void }) {
  return (
    <div className="fixed top-4 right-4 z-50 bg-white/90 dark:bg-neutral-900/90 backdrop-blur rounded-md shadow p-3 w-72 space-y-3">
      <div className="font-semibold text-sm">Filters</div>
      <Slider label="Environment" min={1} max={5} step={0.5} value={filters.environment} onChange={(v) => setFilters({ ...filters, environment: v })} />
      <Slider label="Food" min={1} max={5} step={0.5} value={filters.foodQuality} onChange={(v) => setFilters({ ...filters, foodQuality: v })} />
      <Slider label="Service" min={1} max={5} step={0.5} value={filters.service} onChange={(v) => setFilters({ ...filters, service: v })} />
      <Slider label="Google Review Rating" min={1} max={5} step={0.1} value={filters.googleRating} onChange={(v) => setFilters({ ...filters, googleRating: v })} />
      <Slider label="AI Rating" min={1} max={5} step={0.1} value={filters.aiRating} onChange={(v) => setFilters({ ...filters, aiRating: v })} />
      <Slider label="Price (avg spend)" min={0} max={200} step={5} value={filters.priceMax} onChange={(v) => setFilters({ ...filters, priceMax: v })} />
    </div>
  );
}

function Slider({ label, min, max, step, value, onChange }: { label: string; min: number; max: number; step: number; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block text-xs">
      <div className="flex items-center justify-between mb-1">
        <span>{label}</span>
        <span className="tabular-nums">{value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full" />
    </label>
  );
}