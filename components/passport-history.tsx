import {
  Archive,
  CalendarDays,
  ContactRound,
  ExternalLink,
  FileCheck2,
  Globe2,
  History,
  ImageOff,
  Palette,
  ShieldCheck,
} from "lucide-react";
import type { CountryProfile } from "@/types/passport";
import {
  getPassportHistory,
  localizeHistoryText,
  type LocalizedHistoryText,
  type PassportHistoryChangeCategory,
  type PassportHistoryEntry,
} from "@/lib/passport-history";
import { getAppCopy, getCountryName, toTraditional } from "@/lib/i18n";

type PassportHistoryProps = {
  country: CountryProfile;
  locale: string;
};

const changeIcons = {
  design: Palette,
  security: ShieldCheck,
  identity: ContactRound,
  standards: Globe2,
} satisfies Record<PassportHistoryChangeCategory, typeof Palette>;

function getLocalizedHistoryText(text: LocalizedHistoryText, locale: string) {
  const localized = localizeHistoryText(text, locale);
  return locale === "zh-TW" ? toTraditional(localized) : localized;
}

function SourceArchiveCover({ entry, countryName, verifiedLabel }: { entry: PassportHistoryEntry; countryName: string; verifiedLabel: string }) {
  return (
    <figure className="passport-history-cover has-image is-verified-archive">
      <img
        src={entry.cover}
        alt={`${countryName} passport ${entry.period} verified archive cover`}
        loading="lazy"
        draggable={false}
      />
      <figcaption><FileCheck2 size={11} />{verifiedLabel}</figcaption>
    </figure>
  );
}

function formatEntryPeriod(entry: PassportHistoryEntry, locale: string) {
  if (entry.dateType === "archive-observed") {
    const value = locale === "zh" || locale === "zh-TW" ? `${entry.year} 年存档` : `${entry.year} archive`;
    return locale === "zh-TW" ? toTraditional(value) : value;
  }
  if (entry.dateType === "current-reference") {
    const value = locale === "zh" || locale === "zh-TW" ? "当前参考" : "Current reference";
    return locale === "zh-TW" ? toTraditional(value) : value;
  }
  return entry.period;
}

function getDateBasis(entry: PassportHistoryEntry, locale: string) {
  if (entry.dateType === "archive-observed") {
    const date = entry.observedAt?.slice(0, 10) ?? String(entry.year);
    const value = locale === "zh" || locale === "zh-TW"
      ? `网页存档于 ${date}，不是推定发行日`
      : `Web archive captured ${date}; not a claimed issue date`;
    return locale === "zh-TW" ? toTraditional(value) : value;
  }
  if (entry.dateType === "current-reference") {
    const value = locale === "zh" || locale === "zh-TW" ? "当前真实来源参考图" : "Current real-source reference";
    return locale === "zh-TW" ? toTraditional(value) : value;
  }
  const value = locale === "zh" || locale === "zh-TW" ? "有版本资料支持的发行阶段" : "Issue period supported by edition evidence";
  return locale === "zh-TW" ? toTraditional(value) : value;
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
        <div className="passport-history-note">
          <CalendarDays size={15} />
          {history.length > 0 ? `${history.length} ${copy.historyVerifiedEditions}` : copy.historyVerifiedOnly}
        </div>
      </div>

      {history.length === 0 ? (
        <div className="passport-history-empty">
          <ImageOff size={23} strokeWidth={1.4} />
          <div>
            <h3>{copy.historyArchiveUnavailableTitle}</h3>
            <p>{copy.historyArchiveUnavailable}</p>
          </div>
        </div>
      ) : (
        <div className={`passport-history-timeline verified-count-${Math.min(history.length, 5)}`}>
          {history.map((entry) => (
            <article className={`passport-history-item${entry.isCurrent ? " is-current" : ""}`} key={`${entry.year}-${entry.period}`}>
              <div className="passport-history-dot" aria-hidden="true" />
              <SourceArchiveCover entry={entry} countryName={countryName} verifiedLabel={copy.historyVerifiedArchiveImage} />

              <div className="passport-history-copy">
                <div className="passport-history-year">
                  <span>{formatEntryPeriod(entry, locale)}</span>
                  {entry.isCurrent ? copy.currentEdition : copy.archiveEdition}
                </div>
                <div className="passport-history-date-basis"><CalendarDays size={12} />{getDateBasis(entry, locale)}</div>
                <h3>{getLocalizedHistoryText(entry.title, locale)}</h3>
                <p>{getLocalizedHistoryText(entry.description, locale)}</p>

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
                            <span>{getLocalizedHistoryText(change.detail, locale)}</span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="passport-history-provenance">
                  <span><FileCheck2 size={12} />{entry.author} · {entry.license}</span>
                  <a href={entry.sourceUrl} target="_blank" rel="noreferrer">
                    {copy.historyImageSource}<ExternalLink size={11} />
                  </a>
                  <a href={entry.evidenceUrl} target="_blank" rel="noreferrer">
                    {copy.historyEvidence}<ExternalLink size={11} />
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

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
