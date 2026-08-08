import sharp from "sharp";

/**
 * Works out where the dog is in a photograph so the hero never puts type on a face.
 *
 * No model and no service. Shelter photos are a detailed animal against a plain kennel
 * wall or floor, so local detail is a reliable stand-in for "the dog is here": the image
 * is reduced to a tiny grayscale grid, a Sobel gradient gives a detail map, and the
 * brightest region of that map is the subject. Heads carry the most detail of all (eyes,
 * muzzle, ear edges), so the top of that region tracks the face closely enough to keep
 * copy off it.
 *
 * Runs on one photo per render, inside the page's 30 minute ISR window.
 */

export type Focus = {
  /** CSS object-position that keeps the subject in frame at any crop. */
  objectPosition: string;
  /** The half of the frame with less going on. Copy belongs here. */
  copySide: "left" | "right";
  /** Subject centre, 0 to 1 across the frame. */
  cx: number;
  cy: number;
  /** True when the detector found nothing convincing and we fell back to defaults. */
  fallback: boolean;
};

const FALLBACK: Focus = {
  objectPosition: "50% 35%",
  copySide: "left",
  cx: 0.5,
  cy: 0.35,
  fallback: true,
};

const W = 48;
const H = 36;

export async function findFocus(source: string | Buffer): Promise<Focus> {
  try {
    const input = typeof source === "string" ? await load(source) : source;
    if (!input) return FALLBACK;

    const { data } = await sharp(input)
      .greyscale()
      .resize(W, H, { fit: "fill" })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const at = (x: number, y: number) => data[y * W + x];

    // Sobel gradient magnitude: detail, not brightness, so a dark dog on a pale floor
    // registers as strongly as a pale dog on a dark one.
    const energy = new Float64Array(W * H);
    let total = 0;
    for (let y = 1; y < H - 1; y++) {
      for (let x = 1; x < W - 1; x++) {
        const gx =
          -at(x - 1, y - 1) -
          2 * at(x - 1, y) -
          at(x - 1, y + 1) +
          at(x + 1, y - 1) +
          2 * at(x + 1, y) +
          at(x + 1, y + 1);
        const gy =
          -at(x - 1, y - 1) -
          2 * at(x, y - 1) -
          at(x + 1, y - 1) +
          at(x - 1, y + 1) +
          2 * at(x, y + 1) +
          at(x + 1, y + 1);
        const m = Math.hypot(gx, gy);
        energy[y * W + x] = m;
        total += m;
      }
    }
    if (total < 1) return FALLBACK;

    // Ignore the quiet majority so a busy background texture cannot outvote the dog.
    const sorted = Float64Array.from(energy).sort();
    const cutoff = sorted[Math.floor(sorted.length * 0.72)];

    let sum = 0;
    let sx = 0;
    let sy = 0;
    const columns = new Float64Array(W);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const m = energy[y * W + x];
        if (m <= cutoff) continue;
        sum += m;
        sx += m * x;
        sy += m * y;
        columns[x] += m;
      }
    }
    if (sum < 1) return FALLBACK;

    const cx = sx / sum / (W - 1);
    const cy = sy / sum / (H - 1);

    // Which half carries less of the subject: that is where copy can sit.
    let left = 0;
    let right = 0;
    for (let x = 0; x < W; x++) {
      if (x < W / 2) left += columns[x];
      else right += columns[x];
    }
    const copySide: Focus["copySide"] = left <= right ? "left" : "right";

    // Bias the crop upward: on a wide hero the head matters more than the paws.
    const posY = clamp(cy * 100 - 12, 8, 62);
    const posX = clamp(cx * 100, 20, 80);

    return {
      objectPosition: `${round(posX)}% ${round(posY)}%`,
      copySide,
      cx,
      cy,
      fallback: false,
    };
  } catch {
    return FALLBACK;
  }
}

async function load(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

function round(v: number) {
  return Math.round(v * 10) / 10;
}
