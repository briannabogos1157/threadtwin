export type ApparelCategory = 'fabric' | 'fit' | 'construction' | 'care';

interface ApparelTerm {
  id: string;
  category: ApparelCategory;
  /** One facet per concept. A concept is never copied into a second category. */
  facet: string;
  phrases: string[];
}

/** Different concept ids in one family are related, not identical. */
interface TermFamily {
  ids: string[];
  /** Score when two different members of the family are compared. */
  within: number;
}

interface TermBridge {
  a: string;
  b: string;
  score: number;
}

/**
 * Each concept has one primary home.
 *
 * Neckline and sleeve length used to be copied into both fit and construction.
 * A crew-neck match then raised the fit average and the construction average,
 * and both averages are weighted in the total, so the same fact was counted twice.
 * Sleeve length now lives only under fit. Neckline and collar live only under construction.
 *
 * Wash, hand wash, and dry clean share the wash facet because they are alternative
 * cleaning methods. If they were separate facets, a dry-clean source and a
 * machine-wash candidate would each look like missing data and the conflict
 * would disappear. Dry and iron stay separate and are skipped when one side
 * does not mention them.
 *
 * Longer phrases claim their span first, so "skinny jeans" is a leg shape and
 * does not also count as a slim silhouette, and "wide leg" is not a wide sleeve.
 */
const TERMS: ApparelTerm[] = [
  { id: 'cotton', category: 'fabric', facet: 'fiber', phrases: ['organic cotton', 'cotton'] },
  { id: 'polyester', category: 'fabric', facet: 'fiber', phrases: ['polyester'] },
  { id: 'nylon', category: 'fabric', facet: 'fiber', phrases: ['polyamide', 'nylon'] },
  { id: 'elastane', category: 'fabric', facet: 'fiber', phrases: ['elastane', 'spandex', 'lycra'] },
  { id: 'wool', category: 'fabric', facet: 'fiber', phrases: ['merino wool', 'wool'] },
  { id: 'cashmere', category: 'fabric', facet: 'fiber', phrases: ['cashmere'] },
  { id: 'silk', category: 'fabric', facet: 'fiber', phrases: ['silk'] },
  { id: 'linen', category: 'fabric', facet: 'fiber', phrases: ['linen'] },
  { id: 'rayon', category: 'fabric', facet: 'fiber', phrases: ['rayon'] },
  { id: 'viscose', category: 'fabric', facet: 'fiber', phrases: ['viscose'] },
  { id: 'modal', category: 'fabric', facet: 'fiber', phrases: ['modal'] },
  { id: 'lyocell', category: 'fabric', facet: 'fiber', phrases: ['lyocell', 'tencel'] },
  { id: 'acetate', category: 'fabric', facet: 'fiber', phrases: ['acetate'] },
  { id: 'acrylic', category: 'fabric', facet: 'fiber', phrases: ['acrylic'] },
  { id: 'cupro', category: 'fabric', facet: 'fiber', phrases: ['cupro'] },
  { id: 'hemp', category: 'fabric', facet: 'fiber', phrases: ['hemp'] },

  { id: 'satin', category: 'fabric', facet: 'material', phrases: ['charmeuse', 'duchesse satin', 'satin'] },
  { id: 'chiffon', category: 'fabric', facet: 'material', phrases: ['chiffon'] },
  { id: 'organza', category: 'fabric', facet: 'material', phrases: ['organza'] },
  { id: 'velvet', category: 'fabric', facet: 'material', phrases: ['velvet'] },
  { id: 'denim', category: 'fabric', facet: 'material', phrases: ['denim'] },
  { id: 'twill', category: 'fabric', facet: 'material', phrases: ['twill'] },
  { id: 'corduroy', category: 'fabric', facet: 'material', phrases: ['corduroy'] },
  { id: 'fleece', category: 'fabric', facet: 'material', phrases: ['fleece'] },
  { id: 'flannel', category: 'fabric', facet: 'material', phrases: ['flannel'] },
  { id: 'tweed', category: 'fabric', facet: 'material', phrases: ['tweed'] },
  { id: 'crepe', category: 'fabric', facet: 'material', phrases: ['crepe'] },
  { id: 'taffeta', category: 'fabric', facet: 'material', phrases: ['taffeta'] },

  { id: 'slim', category: 'fit', facet: 'silhouette', phrases: ['tailored fit', 'skinny fit', 'fitted', 'slim fit', 'slim'] },
  { id: 'regular', category: 'fit', facet: 'silhouette', phrases: ['regular fit', 'classic fit', 'standard fit', 'regular', 'classic', 'standard'] },
  { id: 'relaxed', category: 'fit', facet: 'silhouette', phrases: ['relaxed fit', 'relaxed'] },
  { id: 'oversized', category: 'fit', facet: 'silhouette', phrases: ['oversized', 'oversize', 'boxy', 'slouchy', 'loose fit', 'loose'] },

  { id: 'sleeveless', category: 'fit', facet: 'sleeve', phrases: ['spaghetti strap', 'thin strap', 'sleeveless'] },
  { id: 'short-sleeve', category: 'fit', facet: 'sleeve', phrases: ['short sleeved', 'short sleeve'] },
  { id: 'elbow-sleeve', category: 'fit', facet: 'sleeve', phrases: ['elbow length sleeve', 'elbow sleeve', 'elbow length', 'below the elbow', 'falling below the elbow'] },
  { id: 'three-quarter-sleeve', category: 'fit', facet: 'sleeve', phrases: ['three quarter sleeve', 'three quarter length', '3 4 sleeve'] },
  { id: 'long-sleeve', category: 'fit', facet: 'sleeve', phrases: ['long sleeved', 'long sleeve', 'full sleeve'] },

  { id: 'wide-sleeve', category: 'fit', facet: 'volume', phrases: ['balloon sleeve', 'dolman sleeve', 'wide sleeve', 'voluminous sleeve', 'voluminous'] },
  { id: 'skinny-leg', category: 'fit', facet: 'leg', phrases: ['skinny jeans', 'skinny jean', 'skinny leg', 'skinny'] },
  { id: 'straight-leg', category: 'fit', facet: 'leg', phrases: ['straight leg', 'straight jeans', 'straight jean'] },
  { id: 'wide-leg', category: 'fit', facet: 'leg', phrases: ['wide leg', 'wide legged'] },
  { id: 'bootcut', category: 'fit', facet: 'leg', phrases: ['bootcut', 'boot cut'] },
  { id: 'flare-leg', category: 'fit', facet: 'leg', phrases: ['flared leg', 'flare leg', 'flared', 'flare'] },
  { id: 'tapered-leg', category: 'fit', facet: 'leg', phrases: ['tapered leg', 'tapered'] },

  { id: 'high-rise', category: 'fit', facet: 'rise', phrases: ['high rise', 'high waisted', 'high waist'] },
  { id: 'mid-rise', category: 'fit', facet: 'rise', phrases: ['mid rise'] },
  { id: 'low-rise', category: 'fit', facet: 'rise', phrases: ['low rise', 'low waisted', 'low waist'] },

  { id: 'cropped', category: 'fit', facet: 'length', phrases: ['cropped', 'crop'] },
  { id: 'mini', category: 'fit', facet: 'length', phrases: ['mini'] },
  { id: 'knee-length', category: 'fit', facet: 'length', phrases: ['knee length'] },
  { id: 'midi', category: 'fit', facet: 'length', phrases: ['midi'] },
  { id: 'ankle', category: 'fit', facet: 'length', phrases: ['ankle length', 'ankle'] },
  { id: 'maxi', category: 'fit', facet: 'length', phrases: ['maxi'] },
  { id: 'longline', category: 'fit', facet: 'length', phrases: ['longline', 'hip length'] },

  { id: 'a-line', category: 'fit', facet: 'proportion', phrases: ['a line'] },
  { id: 'bodycon', category: 'fit', facet: 'proportion', phrases: ['bodycon', 'body con'] },
  { id: 'shift', category: 'fit', facet: 'proportion', phrases: ['shift dress', 'shift'] },
  { id: 'empire', category: 'fit', facet: 'proportion', phrases: ['empire waist', 'empire'] },
  { id: 'dropped-shoulder', category: 'fit', facet: 'proportion', phrases: ['dropped shoulder', 'drop shoulder'] },
  { id: 'raglan', category: 'fit', facet: 'proportion', phrases: ['raglan'] },

  { id: 'crew', category: 'construction', facet: 'neckline', phrases: ['round neckline', 'round neck', 'crew neck', 'crewneck', 'crew neckline'] },
  { id: 'bound-crew', category: 'construction', facet: 'neckline', phrases: ['ribbed neckline', 'ribbed neck', 'bound crew neckline', 'bound crew'] },
  { id: 'v-neck', category: 'construction', facet: 'neckline', phrases: ['v neck', 'vneck'] },
  { id: 'scoop', category: 'construction', facet: 'neckline', phrases: ['scoop neck'] },
  { id: 'mock-neck', category: 'construction', facet: 'neckline', phrases: ['roll neckline', 'roll neck', 'mock neck', 'turtle neck', 'turtleneck'] },
  { id: 'polo', category: 'construction', facet: 'neckline', phrases: ['polo neck', 'polo collar'] },
  { id: 'collar', category: 'construction', facet: 'neckline', phrases: ['pointed collar', 'spread collar', 'collar'] },
  { id: 'lapel', category: 'construction', facet: 'neckline', phrases: ['notched lapel', 'peak lapel', 'shawl lapel', 'lapel'] },

  { id: 'jersey', category: 'construction', facet: 'knit', phrases: ['jersey knit', 'jersey'] },
  { id: 'knit', category: 'construction', facet: 'knit', phrases: ['cable knit', 'rib knit', 'ribbed knit', 'sweater', 'knit'] },
  { id: 'woven', category: 'construction', facet: 'knit', phrases: ['woven'] },

  { id: 'cardigan', category: 'construction', facet: 'closure', phrases: ['cardigan', 'button front', 'button through', 'open front'] },
  { id: 'pullover', category: 'construction', facet: 'closure', phrases: ['knit jumper', 'pullover', 'pull over'] },
  { id: 'zip', category: 'construction', facet: 'closure', phrases: ['quarter zip', 'half zip', 'full zip', 'zip front', 'zippered', 'zipper'] },
  { id: 'button', category: 'construction', facet: 'closure', phrases: ['single breasted', 'double breasted', 'button down', 'button up', 'button detailing', 'button closure', 'with buttons', 'buttoned'] },
  { id: 'wrap', category: 'construction', facet: 'closure', phrases: ['wrap front', 'wrap'] },

  { id: 'straight-hem', category: 'construction', facet: 'hem', phrases: ['straight hem'] },
  { id: 'curved-hem', category: 'construction', facet: 'hem', phrases: ['curved hem'] },
  { id: 'split-hem', category: 'construction', facet: 'hem', phrases: ['split hem', 'side slit'] },

  { id: 'flat-seam', category: 'construction', facet: 'seam', phrases: ['flatlock', 'flat seam', 'flat locked'] },
  { id: 'overlock', category: 'construction', facet: 'seam', phrases: ['overlock', 'raw seam', 'raw edge'] },

  { id: 'pocket', category: 'construction', facet: 'pocket', phrases: ['patch pocket', 'welt pocket', 'side pocket', 'pocket'] },
  { id: 'pocketless', category: 'construction', facet: 'pocket', phrases: ['no pockets', 'pocketless'] },

  { id: 'beaded', category: 'construction', facet: 'embellishment', phrases: ['beading', 'beaded'] },
  { id: 'sequin', category: 'construction', facet: 'embellishment', phrases: ['sequinned', 'sequins', 'sequin'] },
  { id: 'embroidered', category: 'construction', facet: 'embellishment', phrases: ['embroidery', 'embroidered'] },

  { id: 'graphic', category: 'construction', facet: 'graphic', phrases: ['printed graphic', 'graphic print', 'graphic tee', 'graphic'] },
  { id: 'floral-print', category: 'construction', facet: 'graphic', phrases: ['floral print'] },
  { id: 'contrast-print', category: 'construction', facet: 'graphic', phrases: ['contrast print', 'contrasting graphic', 'contrast graphic'] },

  { id: 'structured', category: 'construction', facet: 'structure', phrases: ['shoulder pads', 'shoulder pad', 'padded shoulder', 'structured', 'tailored'] },
  { id: 'unstructured', category: 'construction', facet: 'structure', phrases: ['unstructured', 'unconstructed'] },
  { id: 'lined', category: 'construction', facet: 'lining', phrases: ['fully lined', 'lining', 'lined'] },
  { id: 'unlined', category: 'construction', facet: 'lining', phrases: ['unlined'] },

  { id: 'machine-wash', category: 'care', facet: 'wash', phrases: ['machine wash cold', 'machine washable', 'machine wash', 'washable'] },
  { id: 'hand-wash', category: 'care', facet: 'wash', phrases: ['hand wash'] },
  { id: 'dry-clean', category: 'care', facet: 'wash', phrases: ['dry clean only', 'dry clean'] },
  { id: 'tumble-dry', category: 'care', facet: 'dry', phrases: ['tumble dry'] },
  { id: 'line-dry', category: 'care', facet: 'dry', phrases: ['line dry', 'hang dry'] },
  { id: 'flat-dry', category: 'care', facet: 'dry', phrases: ['lay flat', 'flat dry'] },
  { id: 'iron', category: 'care', facet: 'iron', phrases: ['steam iron', 'iron low', 'iron'] },
  { id: 'do-not-iron', category: 'care', facet: 'iron', phrases: ['do not iron'] },
];

const FAMILIES: TermFamily[] = [
  { ids: ['viscose', 'rayon', 'modal', 'lyocell'], within: 85 },
  { ids: ['wool', 'cashmere'], within: 75 },
  { ids: ['cotton', 'linen', 'hemp'], within: 40 },
  { ids: ['satin', 'charmeuse'], within: 90 },
  { ids: ['denim', 'twill'], within: 70 },
  { ids: ['chiffon', 'organza'], within: 55 },
  { ids: ['regular', 'relaxed'], within: 75 },
  { ids: ['jersey', 'knit'], within: 80 },
  { ids: ['crew', 'bound-crew'], within: 80 },
  { ids: ['graphic', 'contrast-print'], within: 70 },
  { ids: ['graphic', 'floral-print'], within: 55 },
  { ids: ['flat-seam', 'overlock'], within: 60 },
  { ids: ['beaded', 'embroidered'], within: 45 },
];

const BRIDGES: TermBridge[] = [
  { a: 'polyester', b: 'nylon', score: 30 },
  { a: 'polyester', b: 'acetate', score: 35 },
  { a: 'cotton', b: 'viscose', score: 25 },
  { a: 'regular', b: 'oversized', score: 45 },
  { a: 'relaxed', b: 'oversized', score: 55 },
  { a: 'slim', b: 'regular', score: 40 },
  { a: 'slim', b: 'oversized', score: 15 },
  { a: 'short-sleeve', b: 'elbow-sleeve', score: 40 },
  { a: 'elbow-sleeve', b: 'three-quarter-sleeve', score: 70 },
  { a: 'three-quarter-sleeve', b: 'long-sleeve', score: 55 },
  { a: 'short-sleeve', b: 'three-quarter-sleeve', score: 35 },
  { a: 'elbow-sleeve', b: 'long-sleeve', score: 30 },
  { a: 'short-sleeve', b: 'long-sleeve', score: 15 },
  { a: 'sleeveless', b: 'short-sleeve', score: 25 },
  { a: 'skinny-leg', b: 'straight-leg', score: 40 },
  { a: 'straight-leg', b: 'wide-leg', score: 35 },
  { a: 'skinny-leg', b: 'wide-leg', score: 10 },
  { a: 'skinny-leg', b: 'tapered-leg', score: 55 },
  { a: 'straight-leg', b: 'tapered-leg', score: 60 },
  { a: 'straight-leg', b: 'bootcut', score: 50 },
  { a: 'bootcut', b: 'flare-leg', score: 60 },
  { a: 'wide-leg', b: 'flare-leg', score: 55 },
  { a: 'high-rise', b: 'mid-rise', score: 60 },
  { a: 'mid-rise', b: 'low-rise', score: 60 },
  { a: 'high-rise', b: 'low-rise', score: 20 },
  { a: 'mini', b: 'midi', score: 40 },
  { a: 'midi', b: 'maxi', score: 45 },
  { a: 'mini', b: 'maxi', score: 15 },
  { a: 'midi', b: 'knee-length', score: 70 },
  { a: 'cropped', b: 'longline', score: 20 },
  { a: 'cropped', b: 'mini', score: 50 },
  { a: 'ankle', b: 'maxi', score: 55 },
  { a: 'a-line', b: 'shift', score: 60 },
  { a: 'a-line', b: 'bodycon', score: 15 },
  { a: 'dropped-shoulder', b: 'raglan', score: 40 },
  { a: 'crew', b: 'scoop', score: 55 },
  { a: 'crew', b: 'v-neck', score: 35 },
  { a: 'crew', b: 'mock-neck', score: 40 },
  { a: 'v-neck', b: 'scoop', score: 45 },
  { a: 'lapel', b: 'collar', score: 60 },
  { a: 'polo', b: 'collar', score: 55 },
  { a: 'crew', b: 'collar', score: 30 },
  { a: 'crew', b: 'lapel', score: 15 },
  { a: 'jersey', b: 'woven', score: 25 },
  { a: 'knit', b: 'woven', score: 25 },
  { a: 'cardigan', b: 'pullover', score: 10 },
  { a: 'cardigan', b: 'button', score: 75 },
  { a: 'cardigan', b: 'zip', score: 35 },
  { a: 'cardigan', b: 'wrap', score: 50 },
  { a: 'pullover', b: 'zip', score: 40 },
  { a: 'button', b: 'zip', score: 45 },
  { a: 'structured', b: 'unstructured', score: 15 },
  { a: 'lined', b: 'unlined', score: 15 },
  { a: 'pocket', b: 'pocketless', score: 0 },
  { a: 'beaded', b: 'sequin', score: 35 },
  { a: 'machine-wash', b: 'hand-wash', score: 20 },
  { a: 'machine-wash', b: 'dry-clean', score: 10 },
  { a: 'hand-wash', b: 'dry-clean', score: 40 },
  { a: 'tumble-dry', b: 'line-dry', score: 25 },
  { a: 'tumble-dry', b: 'flat-dry', score: 15 },
  { a: 'line-dry', b: 'flat-dry', score: 65 },
  { a: 'iron', b: 'do-not-iron', score: 0 },
];

export interface FiberAmount {
  id: string;
  percent: number | null;
}

export interface ExtractedApparel {
  fabric: string[];
  fibers: FiberAmount[];
  facets: Record<ApparelCategory, Record<string, string[]>>;
}

interface PhraseHit {
  term: ApparelTerm;
  start: number;
  end: number;
  phraseLength: number;
  percent: number | null;
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9%]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const MATCH_ORDER = TERMS.flatMap((term) => term.phrases.map((phrase) => ({
  term,
  phrase: normalizeText(phrase),
}))).filter((item) => item.phrase.length > 0);

function overlaps(left: PhraseHit, right: PhraseHit): boolean {
  return left.start < right.end && right.start < left.end;
}

function findHits(text: string): PhraseHit[] {
  const padded = ` ${text} `;
  const found: PhraseHit[] = [];
  for (const { term, phrase } of MATCH_ORDER) {
    const variants = phrase.endsWith('s') ? [phrase] : [phrase, `${phrase}s`];
    for (const variant of variants) {
      const needle = ` ${variant} `;
      let from = 0;
      while (from < padded.length) {
        const at = padded.indexOf(needle, from);
        if (at < 0) break;
        const start = at;
        const end = start + variant.length;
        const before = text.slice(Math.max(0, start - 8), start);
        const percentMatch = before.match(/(\d{1,3})%\s*$/);
        found.push({
          term,
          start,
          end,
          phraseLength: variant.length,
          percent: percentMatch ? Number(percentMatch[1]) : null,
        });
        from = at + variant.length;
      }
    }
  }
  found.sort((a, b) => b.phraseLength - a.phraseLength || a.start - b.start);
  const accepted: PhraseHit[] = [];
  for (const hit of found) {
    if (accepted.some((prior) => overlaps(prior, hit))) continue;
    accepted.push(hit);
  }
  return accepted;
}

export function extractApparel(parts: Array<string | string[] | undefined>): ExtractedApparel {
  const text = normalizeText(parts.flatMap((part) => (Array.isArray(part) ? part : [part || ''])).join(' '));
  const facets: ExtractedApparel['facets'] = {
    fabric: {},
    fit: {},
    construction: {},
    care: {},
  };
  const fiberPercent = new Map<string, number | null>();
  const seen = new Set<string>();
  for (const hit of findHits(text)) {
    if (hit.term.category === 'fabric' && hit.term.facet === 'fiber') {
      const previous = fiberPercent.get(hit.term.id);
      if (hit.percent != null) fiberPercent.set(hit.term.id, (previous || 0) + hit.percent);
      else if (!fiberPercent.has(hit.term.id)) fiberPercent.set(hit.term.id, null);
    }
    const key = `${hit.term.category}:${hit.term.facet}:${hit.term.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const bucket = facets[hit.term.category][hit.term.facet] || [];
    bucket.push(hit.term.id);
    facets[hit.term.category][hit.term.facet] = bucket;
  }
  const fibers: FiberAmount[] = [...fiberPercent.entries()].map(([id, percent]) => ({ id, percent }));
  return {
    fabric: fibers.map((fiber) => fiber.id),
    fibers,
    facets,
  };
}

export function conceptSimilarity(left: string, right: string): number {
  if (left === right) return 100;
  const family = FAMILIES.find((group) => group.ids.includes(left) && group.ids.includes(right));
  if (family) return family.within;
  const bridge = BRIDGES.find((item) =>
    (item.a === left && item.b === right) || (item.a === right && item.b === left)
  );
  return bridge ? bridge.score : 0;
}

export function facetSimilarity(left: string[], right: string[]): number | null {
  if (!left.length || !right.length) return null;
  let best = 0;
  for (const source of left) {
    for (const candidate of right) {
      best = Math.max(best, conceptSimilarity(source, candidate));
    }
  }
  return best;
}

function sharesFromFibers(fibers: FiberAmount[], usePercents: boolean): Map<string, number> {
  const unique = [...new Set(fibers.map((fiber) => fiber.id))];
  const map = new Map<string, number>();
  if (!usePercents) {
    const share = unique.length ? 100 / unique.length : 0;
    for (const id of unique) map.set(id, share);
    return map;
  }
  const measured = fibers.filter((fiber) => fiber.percent != null && fiber.percent > 0);
  const sum = measured.reduce((total, fiber) => total + (fiber.percent || 0), 0);
  for (const fiber of measured) {
    map.set(fiber.id, (map.get(fiber.id) || 0) + ((fiber.percent || 0) / sum) * 100);
  }
  return map;
}

/** Overlap of two fiber mixes. Related fibers receive partial credit. */
export function fiberSimilarity(left: FiberAmount[], right: FiberAmount[]): number | null {
  if (!left.length || !right.length) return null;
  const leftHasPercent = left.some((fiber) => fiber.percent != null);
  const rightHasPercent = right.some((fiber) => fiber.percent != null);
  const usePercents = leftHasPercent && rightHasPercent;
  const leftShares = sharesFromFibers(left, usePercents);
  const rightShares = sharesFromFibers(right, usePercents);
  const pairs: Array<{ a: string; b: string; similarity: number }> = [];
  for (const a of leftShares.keys()) {
    for (const b of rightShares.keys()) {
      const similarity = conceptSimilarity(a, b);
      if (similarity > 0) pairs.push({ a, b, similarity });
    }
  }
  pairs.sort((a, b) => b.similarity - a.similarity);
  const leftRemaining = new Map(leftShares);
  const rightRemaining = new Map(rightShares);
  let credit = 0;
  for (const pair of pairs) {
    const availableLeft = leftRemaining.get(pair.a) || 0;
    const availableRight = rightRemaining.get(pair.b) || 0;
    const amount = Math.min(availableLeft, availableRight);
    if (amount <= 0) continue;
    credit += amount * (pair.similarity / 100);
    leftRemaining.set(pair.a, availableLeft - amount);
    rightRemaining.set(pair.b, availableRight - amount);
  }
  return Math.round(credit);
}

export function fibersUseBlend(left: FiberAmount[], right: FiberAmount[]): boolean {
  return left.some((fiber) => fiber.percent != null) && right.some((fiber) => fiber.percent != null);
}
