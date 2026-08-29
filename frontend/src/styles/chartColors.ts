// Categorical palette: fixed hue order, validated for CVD-safety on adjacent
// pairs in both light and dark modes (see the dataviz skill's palette.md).
// Category identity is assigned by name (alphabetical), never by value rank,
// so the same category keeps the same color across different date ranges.
const CATEGORICAL_LIGHT = [
  '#2a78d6', // blue
  '#eb6834', // orange
  '#1baf7a', // aqua
  '#eda100', // yellow
  '#e87ba4', // magenta
  '#008300', // green
  '#4a3aa7', // violet
  '#e34948', // red
];

const CATEGORICAL_DARK = [
  '#3987e5',
  '#d95926',
  '#199e70',
  '#c98500',
  '#d55181',
  '#008300',
  '#9085e9',
  '#e66767',
];

const MAX_CATEGORICAL_SLOTS = CATEGORICAL_LIGHT.length;

export function getCategoryColor(name: string, allNames: string[], isDark: boolean): string {
  const sorted = [...new Set(allNames)].sort((a, b) => a.localeCompare(b));
  const index = sorted.indexOf(name) % MAX_CATEGORICAL_SLOTS;
  const palette = isDark ? CATEGORICAL_DARK : CATEGORICAL_LIGHT;
  return palette[index < 0 ? 0 : index];
}

// Income/expense have a fixed semantic meaning throughout the app (see
// success/danger tokens in index.css) — reused here rather than treated as
// generic categorical series.
export function getFlowColors(isDark: boolean) {
  return {
    income: isDark ? '#10b981' : '#059669',
    expense: isDark ? '#f43f5e' : '#e11d48',
  };
}

export function getChartChrome(isDark: boolean) {
  return {
    grid: isDark ? '#374151' : '#e5e7eb',
    axisText: isDark ? '#9ca3af' : '#6b7280',
    tooltipBg: isDark ? '#1f2937' : '#ffffff',
    tooltipBorder: isDark ? '#374151' : '#e5e7eb',
    tooltipText: isDark ? '#f3f4f6' : '#111827',
  };
}
