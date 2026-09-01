import { Archive, CalendarDays, ExternalLink, History } from "lucide-react";
import type { CSSProperties } from "react";
import type { CountryProfile } from "@/types/passport";
import { getPassportHistory } from "@/lib/passport-history";
import { getAppCopy, getCountryName } from "@/lib/i18n";

type PassportHistoryProps = {
  country: CountryProfile;
  locale: string;
};

function ArchiveCover({ country, year, current, cover, reconstruction, archiveLabel }: { country: CountryProfile; year: number; current?: boolean; cover?: string; reconstruction?: boolean; archiveLabel: string }) {
  const baseCover = cover ?? (reconstruction ? country.passportCover : undefined);
  const coverClass = reconstruction ? ` is-reconstruction era-${year}` : "";
  return (
    <div
      className={`passport-history-cover${current ? " is-current" : ""}${baseCover ? " has-image" : ""}${coverClass}`}
      style={{ "--archive-color": country.passportColor } as CSSProperties}
    >
      {baseCover ? (
        <>
          <img src={baseCover} alt={`${getCountryName(country, "en")} passport ${year} archive ${reconstruction ? "visual reconstruction" : "cover"}`} loading="lazy" draggable={false} />
          {reconstruction && (
            <span className="passport-history-cover-overlay" aria-hidden="true">
              <span>{year}</span>
              <small>{archiveLabel}</small>
            </span>
          )}
        </>
      ) : (
        <>
          <span className="passport-history-cover-year">{year}</span>
          <span className="passport-history-cover-country">{country.name}</span>
          <Archive size={30} strokeWidth={1.1} />
          <span className="passport-history-cover-mark">PASSPORT</span>
        </>
      )}
    </div>
  );
}

export function PassportHistory({ country, locale }: PassportHistoryProps) {
  const copy = getAppCopy(locale);
  const history = getPassportHistory(country);
  const countryName = getCountryName(country, locale);

  return (
    <section className="passport-history" aria-labelledby="passport-history-title">
      <div className="passport-history-heading">
        <div>
          <span className="section-kicker"><History size={14} />{copy.passportHistory}</span>
          <h2 id="passport-history-title">{countryName} {copy.passportHistoryTitle}</h2>
          <p>{copy.passportHistoryIntro}</p>
        </div>
        <div className="passport-history-note"><CalendarDays size={15} />{copy.passportHistoryNote}</div>
      </div>

      <div className="passport-history-timeline">
        {history.map((entry) => (
          <article className={`passport-history-item${entry.isCurrent ? " is-current" : ""}`} key={entry.year}>
            <div className="passport-history-dot" aria-hidden="true" />
            <ArchiveCover country={country} year={entry.year} current={entry.isCurrent} cover={entry.cover} reconstruction={entry.isReconstruction} archiveLabel={copy.archiveEdition} />
            <div className="passport-history-copy">
              <div className="passport-history-year"><span>{entry.year}</span>{entry.isCurrent ? copy.currentEdition : copy.referenceEdition}</div>
              <h3>{entry.titleKey ? copy[entry.titleKey] ?? entry.title : entry.title}</h3>
              <p>{entry.descriptionKey ? copy[entry.descriptionKey] ?? entry.description : entry.description}</p>
              {entry.isReference && <small><Archive size={13} />{entry.isReconstruction ? copy.historyReconstruction : copy.historyReference}</small>}
            </div>
          </article>
        ))}
      </div>

      <div className="passport-history-footer">
        <span><Archive size={14} />{copy.historyDisclaimer}</span>
        {country.passportCoverSource && (
          <a href={country.passportCoverSource} target="_blank" rel="noreferrer">
            {copy.coverReference}<ExternalLink size={13} />
          </a>
        )}
      </div>
    </section>
  );
}
