const PLACEHOLDER_PART = /^(?:\d+(?:\.\d+)?%\s*)?materials?$/i;

function titleCase(value: string): string {
  return value
    .split(/(\s+|-)/)
    .map((part) => {
      if (!/[a-z]/i.test(part)) return part;
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join('');
}

function formatPart(part: string): string {
  const percentage = part.match(/^(\d+(?:\.\d+)?)%\s*(.+)$/);
  if (percentage) return `${percentage[1]}% ${titleCase(percentage[2])}`;
  return titleCase(part);
}

/**
 * Turn extracted fabric data into a user-facing label.
 * Percentage compositions stay as percentages. Bare fibers are capitalized.
 * Placeholder copy such as "50% Material, 50% Material" becomes an empty string.
 */
export function formatMaterialLabel(raw: string | null | undefined): string {
  if (!raw?.trim()) return '';

  const parts = raw
    .split(/\s*,\s*/)
    .map((part) => part.trim())
    .filter((part) => part && !PLACEHOLDER_PART.test(part));

  if (!parts.length) return '';
  return parts.map(formatPart).join(', ');
}
