import { Landmark } from "lucide-react";

type PassportCoverProps = {
  color: string;
  name: string;
  flag: string;
  cover?: string;
  compact?: boolean;
};

export function PassportCover({ color, name, flag, cover, compact = false }: PassportCoverProps) {
  return (
    <div
      className={`passport-cover ${compact ? "passport-cover-compact" : ""}`}
      style={{ backgroundColor: color }}
      aria-label={`${name} 护照实物封面参考图`}
      title={`${name} 护照实物封面参考图；发行年份和版本可能不同`}
    >
      {cover ? (
        <img
          className="passport-cover-image"
          src={cover}
          alt={`${name} 护照实物封面参考图`}
          loading={compact ? "lazy" : "eager"}
          draggable={false}
        />
      ) : (
        <>
          <div className="passport-cover-sheen" />
          <span className="passport-country">{name}</span>
          <Landmark className="passport-emblem" strokeWidth={1.25} />
          <div className="passport-mark">
            <span className="passport-chip" />
            <span>PASSPORT</span>
          </div>
          <span className="passport-flag">{flag}</span>
        </>
      )}
    </div>
  );
}
