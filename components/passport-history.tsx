import {
  Archive,
  CalendarDays,
  ContactRound,
  ExternalLink,
  Fingerprint,
  Globe2,
  History,
  Landmark,
  Palette,
  ShieldCheck,
} from "lucide-react";
import type { CSSProperties } from "react";
import type { CountryProfile } from "@/types/passport";
import {
  getPassportHistory,
  type PassportHistoryChangeCategory,
  type PassportHistoryEntry,
} from "@/lib/passport-history";
import { getAppCopy, getCountryName } from "@/lib/i18n";

type PassportHistoryProps = {
  country: CountryProfile;
  locale: string;
};

type ArchiveCoverProps = {
  country: CountryProfile;
  countryName: string;
  entry: PassportHistoryEntry;
  reconstructionLabel: string;
  verifiedLabel: string;
};

const changeIcons = {
  design: Palette,
  security: ShieldCheck,
  identity: ContactRound,
  standards: Globe2,
} satisfies Record<PassportHistoryChangeCategory, typeof Palette>;

function ArchiveCover({ country, countryName, entry, reconstructionLabel, verifiedLabel }: ArchiveCoverProps) {
  const statusLabel = entry.isReconstruction ? reconstructionLabel : verifiedLabel;

  if (entry.cover && !entry.isReconstruction) {
    return (
      <figure className="passport-history-cover is-current has-image">
        <img
          src={entry.cover}
          alt={`${countryName} passport ${entry.period}`}
          loading="lazy"
          draggable={false}
        />
        <figcaption className="archive-cover-status is-verified"><ShieldCheck size={11} />{statusLabel}</figcaption>
      </figure>
    );
  }

  return (
    <figure
      className={`passport-history-cover is-reconstruction archive-cover-${entry.visual.layout} archive-pattern-${entry.visual.pattern} archive-variant-${entry.visual.variant}`}
      style={{ "--archive-color": country.passportColor } as CSSProperties}
      aria-label={`${countryName} ${entry.period} ${reconstructionLabel}`}
    >
      <span className="archive-cover-texture" aria-hidden="true" />
      <span className="archive-cover-period">{entry.period}</span>

      <div className="archive-cover-heading">
        <span className="archive-cover-country">{countryName}</span>
        <span className="archive-cover-authority">{country.iso3} · TRAVEL DOCUMENT</span>
      </div>

      <div className={`archive-cover-emblem emblem-${entry.visual.emblemStyle}`} aria-hidden="true">
        {entry.visual.emblemStyle === "seal" && <Landmark size={30} strokeWidth={1.1} />}
        {entry.visual.emblemStyle === "crest" && <span>{country.flag}</span>}
        {entry.visual.emblemStyle === "symbol" && <Fingerprint size={33} strokeWidth={1.05} />}
      </div>

      <div className="archive-cover-title">
        <strong>PASSPORT</strong>
        <span>{entry.era === "machine-readable" ? "MACHINE READABLE" : entry.era === "early-epassport" ? "ELECTRONIC" : "BIOMETRIC"}</span>
      </div>

      {entry.visual.chip && (
        <span className="archive-cover-chip" aria-label="Electronic passport chip">
          <i />
        </span>
      )}

      <figcaption className="archive-cover-status"><Archive size={11} />{statusLabel}</figcaption>
    </figure>
  );
}

export function PassportHistory({ country, locale }: PassportHistoryProps) {
  const copy = getAppCopy(locale);
  const history = getPassportHistory(country);
  const countryName = getCountryName(country, locale);
  const categoryLabels: Record<PassportHistoryChangeCategory, string> = {
    design: copy.historyDesign,
    security: copy.historySecurity,
    identity: copy.historyIdentity,
    standards: copy.historyStandards,
  };

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
          <article className={`passport-history-item${entry.isCurrent ? " is-current" : ""}`} key={`${entry.era}-${entry.year}`}>
            <div className="passport-history-dot" aria-hidden="true" />
            <ArchiveCover
              country={country}
              countryName={countryName}
              entry={entry}
              reconstructionLabel={copy.historyReconstructedImage}
              verifiedLabel={copy.historyVerifiedImage}
            />
            <div className="passport-history-copy">
              <div className="passport-history-year">
                <span>{entry.period}</span>
                {entry.isCurrent ? copy.currentEdition : copy.referenceEdition}
              </div>
              <h3>{entry.titleKey ? copy[entry.titleKey] ?? entry.title : entry.title}</h3>
              <p>{entry.descriptionKey ? copy[entry.descriptionKey] ?? entry.description : entry.description}</p>

              <div className="passport-history-changes">
                <h4>{copy.historyChanges}</h4>
                <ul>
                  {entry.changes.map((change) => {
                    const ChangeIcon = changeIcons[change.category];
                    return (
                      <li key={change.category}>
                        <ChangeIcon size={13} strokeWidth={1.6} />
                        <div>
                          <strong>{categoryLabels[change.category]}</strong>
                          <span>{copy[change.detailKey] ?? change.detail}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className={`passport-history-evidence${entry.isReconstruction ? " is-reference" : " is-verified"}`}>
                {entry.isReconstruction ? <Archive size={13} /> : <ShieldCheck size={13} />}
                <span>{entry.isReconstruction ? copy.historyStageReference : copy.historyVerifiedImage}</span>
                {entry.sourceUrl && (
                  <a href={entry.sourceUrl} target="_blank" rel="noreferrer" title={entry.sourceLabel}>
                    {copy.historyImageSource}<ExternalLink size={11} />
                  </a>
                )}
              </div>
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
