import type { PackagingType } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

interface ProductVisualProps {
  name: string;
  packaging: PackagingType;
  accentColor: string;
  imageUrl?: string | null;
  className?: string;
  /** Tamanho da ilustração dentro do container */
  compact?: boolean;
}

const SHADE = "rgba(15,23,42,0.28)";
const LIGHT = "rgba(255,255,255,0.45)";

function shortLabel(name: string) {
  const first = name.split(/\s+/)[0] ?? name;
  return first.length > 12 ? `${first.slice(0, 11)}.` : first;
}

function Cross({ x, y, size = 10, color = "white" }: { x: number; y: number; size?: number; color?: string }) {
  const t = size / 3;
  return (
    <g fill={color}>
      <rect x={x - t / 2} y={y - size / 2} width={t} height={size} rx={t / 3} />
      <rect x={x - size / 2} y={y - t / 2} width={size} height={t} rx={t / 3} />
    </g>
  );
}

/** Ajusta a fonte para caber na largura útil do rótulo (≈0.62em por caractere). */
function LabelText({ x, y, text, color = "white", size = 15, maxWidth = 80 }: { x: number; y: number; text: string; color?: string; size?: number; maxWidth?: number }) {
  const fontSize = Math.min(size, maxWidth / (text.length * 0.62));
  return (
    <text x={x} y={y} textAnchor="middle" fontFamily="inherit" fontWeight={800} fontSize={fontSize.toFixed(1)} fill={color} letterSpacing={-0.3}>
      {text}
    </text>
  );
}

function Packaging({ type, c, label }: { type: PackagingType; c: string; label: string }) {
  switch (type) {
    case "BOX":
      return (
        <g>
          <polygon points="62,70 88,54 182,54 158,70" fill={c} />
          <polygon points="62,70 88,54 182,54 158,70" fill={LIGHT} />
          <polygon points="158,70 182,54 182,186 158,202" fill={c} />
          <polygon points="158,70 182,54 182,186 158,202" fill={SHADE} />
          <rect x="62" y="70" width="96" height="132" rx="4" fill="white" />
          <rect x="62" y="70" width="96" height="44" rx="4" fill={c} />
          <circle cx="82" cy="92" r="11" fill="white" opacity="0.25" />
          <Cross x={82} y={92} size={12} />
          <LabelText x={110} y={146} text={label} color="#0f172a" size={14} maxWidth={82} />
          <rect x="76" y="156" width="68" height="4" rx="2" fill={c} opacity="0.35" />
          <rect x="76" y="164" width="44" height="4" rx="2" fill={c} opacity="0.2" />
          <rect x="62" y="186" width="96" height="16" fill={c} opacity="0.9" />
        </g>
      );
    case "BOTTLE":
      return (
        <g>
          <rect x="80" y="44" width="80" height="34" rx="7" fill={c} />
          <rect x="80" y="44" width="80" height="34" rx="7" fill={SHADE} />
          {[92, 104, 116, 128, 140].map((x) => (
            <rect key={x} x={x} y="50" width="4" height="22" rx="2" fill="white" opacity="0.18" />
          ))}
          <rect x="86" y="76" width="68" height="10" fill="#e2e8f0" />
          <rect x="68" y="84" width="104" height="120" rx="18" fill="white" stroke="#e2e8f0" strokeWidth="2" />
          <rect x="68" y="112" width="104" height="64" fill={c} />
          <Cross x={120} y={130} size={11} />
          <LabelText x={120} y={160} text={label} size={15} maxWidth={88} />
          <rect x="78" y="94" width="9" height="100" rx="4.5" fill="white" opacity="0.55" />
        </g>
      );
    case "TUBE":
      return (
        <g>
          <rect x="74" y="34" width="92" height="14" rx="3" fill="#cbd5e1" />
          {[84, 96, 108, 120, 132, 144, 156].map((x) => (
            <rect key={x} x={x} y="37" width="3" height="8" rx="1.5" fill="white" opacity="0.6" />
          ))}
          <path d="M78 48 H162 L172 178 Q172 186 164 186 H76 Q68 186 68 178 Z" fill="white" stroke="#e2e8f0" strokeWidth="2" />
          <path d="M81 84 H159 L163 140 H77 Z" fill={c} />
          <LabelText x={120} y={118} text={label} size={15} maxWidth={74} />
          <Cross x={120} y={160} size={12} color={c} />
          <rect x="96" y="186" width="48" height="24" rx="5" fill={c} />
          <rect x="96" y="186" width="48" height="24" rx="5" fill={SHADE} />
        </g>
      );
    case "BLISTER":
      return (
        <g transform="rotate(-8 120 128)">
          <rect x="54" y="52" width="132" height="152" rx="14" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="2" />
          <rect x="54" y="52" width="132" height="34" rx="14" fill={c} />
          <rect x="54" y="72" width="132" height="14" fill={c} />
          <LabelText x={120} y={75} text={label} size={14} maxWidth={110} />
          {[0, 1, 2].map((row) =>
            [0, 1].map((col) => {
              const cx = 92 + col * 56;
              const cy = 112 + row * 32;
              return (
                <g key={`${row}-${col}`}>
                  <ellipse cx={cx} cy={cy} rx="22" ry="12" fill="white" stroke="#cbd5e1" strokeWidth="1.5" />
                  <rect x={cx - 15} y={cy - 6} width="30" height="12" rx="6" fill="white" stroke={c} strokeWidth="1.5" />
                  <path d={`M${cx} ${cy - 6} H${cx + 9} A6 6 0 0 1 ${cx + 9} ${cy + 6} H${cx} Z`} fill={c} />
                </g>
              );
            }),
          )}
        </g>
      );
    case "JAR":
      return (
        <g>
          <rect x="62" y="56" width="116" height="32" rx="9" fill={c} />
          <rect x="62" y="56" width="116" height="32" rx="9" fill={SHADE} />
          <rect x="62" y="56" width="116" height="10" rx="5" fill="white" opacity="0.15" />
          <rect x="56" y="84" width="128" height="120" rx="24" fill="white" stroke="#e2e8f0" strokeWidth="2" />
          <rect x="56" y="110" width="128" height="66" fill={c} />
          <Cross x={120} y={128} size={12} />
          <LabelText x={120} y={160} text={label} size={16} maxWidth={108} />
          <rect x="66" y="94" width="10" height="100" rx="5" fill="white" opacity="0.5" />
        </g>
      );
    case "SPRAY":
      return (
        <g>
          <rect x="108" y="26" width="26" height="16" rx="4" fill="#475569" />
          <rect x="132" y="31" width="14" height="5" rx="2.5" fill="#475569" />
          <path d="M86 70 Q86 44 120 44 Q154 44 154 70 Z" fill={c} />
          <path d="M86 70 Q86 44 120 44 Q154 44 154 70 Z" fill={SHADE} />
          <rect x="86" y="66" width="68" height="140" rx="14" fill="white" stroke="#e2e8f0" strokeWidth="2" />
          <rect x="86" y="96" width="68" height="74" fill={c} />
          <Cross x={120} y={114} size={11} />
          <LabelText x={120} y={146} text={label} size={13} maxWidth={58} />
          <rect x="94" y="74" width="8" height="124" rx="4" fill="white" opacity="0.55" />
        </g>
      );
  }
}

/**
 * Imagem do produto: usa a URL cadastrada no admin quando existir;
 * caso contrário, gera uma ilustração vetorial da embalagem.
 */
export function ProductVisual({ name, packaging, accentColor, imageUrl, className, compact }: ProductVisualProps) {
  const color = /^#[0-9a-f]{6}$/i.test(accentColor) ? accentColor : "#059669";
  return (
    <div
      className={cn("relative grid aspect-square place-items-center overflow-hidden", className)}
      style={{ background: `radial-gradient(circle at 50% 42%, ${color}26 0%, ${color}0d 45%, #f8fafc 75%)` }}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt={name} loading="lazy" referrerPolicy="no-referrer" className="size-full object-contain p-4" />
      ) : (
        <svg viewBox="0 0 240 240" className={cn("size-full", compact ? "p-1" : "p-3")} role="img" aria-label={`Ilustração: ${name}`}>
          <ellipse cx="120" cy="214" rx="70" ry="8" fill="rgba(15,23,42,0.08)" />
          <Packaging type={packaging} c={color} label={shortLabel(name)} />
        </svg>
      )}
    </div>
  );
}
