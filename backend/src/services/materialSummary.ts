const FIBERS = [
  'cotton', 'polyester', 'nylon', 'spandex', 'elastane', 'wool',
  'silk', 'linen', 'rayon', 'viscose', 'lyocell', 'modal', 'cashmere',
  'acrylic', 'hemp', 'bamboo',
];

const PLACEHOLDER_FIBER = /^(material|materials|fabric|fabrics|content|contents)$/i;

function titleCase(value: string): string {
  return value
    .split(/(\s+|-)/)
    .map((part) => {
      if (!/[a-z]/i.test(part)) return part;
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join('');
}

const FIBER_MODIFIER = 'organic|recycled|pima|supima|merino';

function compositionLabel(percent: string, fiber: string, modifier?: string): string {
  const name = modifier ? `${titleCase(modifier)} ${titleCase(fiber)}` : titleCase(fiber);
  return `${percent}% ${name}`;
}

/** Percentage compositions such as "100% Cotton" or "Cotton 100%". */
export function extractPercentCompositions(text: string): string[] {
  const found: string[] = [];
  const fiberPattern = FIBERS.join('|');
  const percentFirst = new RegExp(
    `(\\d{1,3}(?:\\.\\d+)?)\\s*%\\s*(?:(${FIBER_MODIFIER})\\s+)?(${fiberPattern})`,
    'gi'
  );
  const fiberFirst = new RegExp(
    `(?:(${FIBER_MODIFIER})\\s+)?(${fiberPattern})\\s+(\\d{1,3}(?:\\.\\d+)?)\\s*%`,
    'gi'
  );

  const add = (percent: string, fiber: string, modifier?: string) => {
    const label = compositionLabel(percent, fiber, modifier);
    if (!found.includes(label)) found.push(label);
  };

  let match: RegExpExecArray | null;
  while ((match = percentFirst.exec(text)) !== null) {
    add(match[1], match[3], match[2]);
  }
  while ((match = fiberFirst.exec(text)) !== null) {
    add(match[3], match[2], match[1]);
  }
  return found;
}

/**
 * Prefer a real percentage composition. Otherwise use the extracted fiber names.
 * Never return a "Material" placeholder.
 */
export function materialSummaryFrom(text: string, keywords: string[]): string {
  const percentages = extractPercentCompositions(text);
  if (percentages.length) return percentages.join(', ');

  const names = keywords
    .map((keyword) => keyword.trim())
    .filter((keyword) => keyword && !PLACEHOLDER_FIBER.test(keyword))
    .map((keyword) => titleCase(keyword));

  return names.join(', ');
}
