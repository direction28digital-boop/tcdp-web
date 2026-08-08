import { SHAPES } from "@/lib/shapes";
import { SWIPES } from "@/lib/swipes";

type EdgeProps = {
  /** CSS color for the paper that sits below the tear. */
  fill: string;
  className?: string;
  flip?: boolean;
};

/**
 * Hand-drawn torn paper edge. Sits at the top of a section and tears into the
 * section above it. Purely decorative, hidden from assistive tech.
 */
export function TornEdge({ fill, className = "", flip = false }: EdgeProps) {
  return (
    <svg
      viewBox={SHAPES.tornEdge.viewBox}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
      className={`block w-full ${className}`}
      style={{ transform: flip ? "scaleY(-1)" : undefined }}
    >
      <path d={SHAPES.tornEdge.d} fill={fill} />
    </svg>
  );
}

type ShapeProps = {
  fill: string;
  className?: string;
  style?: React.CSSProperties;
  /**
   * Both vectors are lens shaped: fat in the middle, tapering to a point at each end.
   * Cropping the viewBox to the fat middle gives a band of even weight with organic
   * edges, which is what these need to do behind text.
   */
  viewBox?: string;
};

/** Wide organic paint slab. Headlines sit on top of it. */
export function BrushSlab({
  fill,
  className = "",
  style,
  viewBox,
}: ShapeProps) {
  return (
    <svg
      viewBox={viewBox ?? SHAPES.brushSlab.viewBox}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
      className={className}
      style={style}
    >
      <path d={SHAPES.brushSlab.d} fill={fill} />
    </svg>
  );
}

/**
 * Paint swipe that runs behind a section title. A loaded-brush body plus the flecks
 * of spatter thrown off it, so it reads as painted rather than as a highlighter bar.
 */
export function BrushSwipe({
  fill,
  className = "",
  style,
  variant = "snug",
}: ShapeProps & { variant?: "snug" | "wide" }) {
  const swipe = SWIPES[variant];
  return (
    <svg
      viewBox={swipe.viewBox}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
      className={className}
      style={style}
    >
      <path d={swipe.body} fill={fill} />
      {swipe.dots.map((dot, i) => (
        <ellipse
          key={i}
          cx={dot.cx}
          cy={dot.cy}
          rx={dot.rx}
          ry={dot.ry}
          fill={fill}
          transform={`rotate(${dot.rot} ${dot.cx} ${dot.cy})`}
        />
      ))}
    </svg>
  );
}

export function SwipeHeading({
  children,
  swipe,
  as: Tag = "h2",
  className = "",
  variant = "snug",
}: {
  children: React.ReactNode;
  swipe: string;
  as?: "h1" | "h2" | "h3";
  className?: string;
  /** Use "wide" for headings longer than roughly five words. */
  variant?: "snug" | "wide";
}) {
  return (
    <div className="relative isolate inline-block">
      <BrushSwipe
        fill={swipe}
        variant={variant}
        className="absolute bottom-[-24%] left-[-4%] -z-10 h-[152%] w-[108%]"
      />
      <Tag
        className={`relative font-display font-extrabold tracking-tight text-ink ${className}`}
      >
        {children}
      </Tag>
    </div>
  );
}
