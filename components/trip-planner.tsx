"use client";

import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  ExternalLink,
  FileCheck2,
  FileText,
  Globe2,
  Luggage,
  MapPin,
  Plane,
  Printer,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import countriesData from "@/data/countries.json";
import visaDataMeta from "@/data/visa-data-meta.json";
import type { CountryProfile } from "@/types/passport";
import type { VisaRule, VisaStatus } from "@/types/visa";
import { PassportCover } from "./passport-cover";
import { useSiteLanguage } from "./site-language";
import { formatCopy, getAppCopy, getCountryName, toTraditional, toTraditionalDeep } from "@/lib/i18n";
import { usePassportLibrary } from "./use-passport-library";
import { getCities } from "@/lib/country-cities";

type TripPlannerProps = {
  origin: CountryProfile;
  destination: CountryProfile;
  rule: VisaRule;
  initialPlan?: {
    tripDays?: number;
    departureDate?: string;
    purpose?: string;
    transitIso3?: string;
  };
};

const countries = countriesData as CountryProfile[];
const alphabeticalCountries = [...countries].sort((left, right) => left.name.localeCompare(right.name, "en", { sensitivity: "base" }));

type StatusPresentation = {
  label: string;
  headline: string;
  summary: string;
  tone: "green" | "blue" | "amber" | "red" | "dark" | "gray";
  steps: string[];
};

const statusPresentation: Record<VisaStatus, StatusPresentation> = {
  "visa free": {
    label: "免签入境",
    headline: "无需提前办理签证，可以直接规划出发",
    summary: "在允许停留期内，可凭有效护照按目的地入境要求旅行。",
    tone: "green",
    steps: ["确保护照在返程后仍有足够有效期", "准备返程机票与住宿证明", "确认旅行保险和入境申报要求", "出发前再次核对官方入境政策"],
  },
  "visa on arrival": {
    label: "落地签",
    headline: "可以在抵达后办理落地签",
    summary: "无需提前前往使领馆，但应准备现场申请材料和签证费用。",
    tone: "amber",
    steps: ["确保护照有效期符合要求", "准备证件照、住宿与返程证明", "确认落地签费用和支付方式", "抵达后前往落地签柜台办理"],
  },
  eta: {
    label: "电子旅行授权 ETA",
    headline: "出发前需要完成电子旅行授权",
    summary: "通常无需递交纸质护照，但必须在登机前取得有效授权。",
    tone: "blue",
    steps: ["进入目的地官方 ETA 申请网站", "填写护照和行程信息", "在线支付并等待授权结果", "保存授权凭证并在登机时备查"],
  },
  "e-visa": {
    label: "电子签证",
    headline: "出发前需要在线申请电子签证",
    summary: "申请通常可在线完成，获批后请携带电子或打印版签证。",
    tone: "blue",
    steps: ["确认符合目的地电子签申请条件", "上传护照、照片和行程材料", "在线支付签证费用", "获批后下载并核对电子签证"],
  },
  "visa required": {
    label: "需要签证",
    headline: "出发前需要完成签证申请",
    summary: "请预留材料准备、递交与审核时间，取得签证后再确认不可退行程。",
    tone: "red",
    steps: ["确认旅游签证类型和受理机构", "准备护照、照片、申请表与资产材料", "预约并递交申请，按要求采集生物信息", "等待审核并核对签证有效期和停留期"],
  },
  "no admission": {
    label: "暂不准入",
    headline: "当前规则显示暂不允许入境",
    summary: "请不要预订不可退行程，并向目的地官方机构核实最新限制。",
    tone: "dark",
    steps: ["查看目的地官方入境限制", "联系航空公司确认承运要求", "咨询使领馆是否存在特殊许可", "考虑调整目的地或出行日期"],
  },
  "-1": {
    label: "境内行程",
    headline: "这是同一国家或地区内的行程",
    summary: "无需办理国际旅行签证，请按当地交通与身份文件要求出行。",
    tone: "green",
    steps: ["确认所需身份证件", "安排当地交通和住宿", "查看目的地天气与安全提示", "准备出发"],
  },
  unknown: {
    label: "需要核实",
    headline: "暂未获得这条路线的完整签证数据",
    summary: "请以目的地使领馆或官方移民部门发布的信息为准。",
    tone: "gray",
    steps: ["查看目的地官方移民网站", "联系目的地使领馆", "向航空公司确认登机文件", "获得确认后再预订行程"],
  },
};

const statusPresentationEn: Record<VisaStatus, StatusPresentation> = {
  "visa free": { label: "Visa free", headline: "No advance visa is required for this route", summary: "Travel within the permitted stay period with a valid passport and the destination's entry requirements.", tone: "green", steps: ["Verify passport validity and entry conditions", "Prepare return travel and accommodation evidence", "Confirm insurance and arrival declaration requirements", "Recheck official entry policy before departure"] },
  "visa on arrival": { label: "Visa on arrival", headline: "Apply for the visa after you arrive", summary: "Prepare the required documents and payment method before reaching the border.", tone: "amber", steps: ["Verify passport validity requirements", "Prepare photo, accommodation, and return travel evidence", "Confirm the visa fee and payment method", "Apply at the designated arrival counter"] },
  eta: { label: "Electronic travel authorization", headline: "Complete an online authorization before departure", summary: "You usually do not need a paper visa, but authorization must be approved before boarding.", tone: "blue", steps: ["Open the destination's official authorization portal", "Enter passport and itinerary details", "Pay online and wait for the decision", "Save the approval and keep it available at check-in"] },
  "e-visa": { label: "E-visa", headline: "Apply for an electronic visa before departure", summary: "Complete the application online and carry the approved electronic or printed visa.", tone: "blue", steps: ["Confirm eligibility and application conditions", "Upload passport, photo, and itinerary documents", "Pay the visa fee online", "Download and verify the approved e-visa"] },
  "visa required": { label: "Visa required", headline: "Complete a visa application before departure", summary: "Allow time for documents, submission, and review. Travel only after the visa is granted.", tone: "red", steps: ["Confirm the visa type and official receiving center", "Prepare passport, photo, application, and financial documents", "Book an appointment and submit biometrics if required", "Check the visa validity and permitted stay after approval"] },
  "no admission": { label: "No admission", headline: "Current rules do not permit entry", summary: "Do not book a non-refundable itinerary until the destination authority confirms an exception.", tone: "dark", steps: ["Review the destination's entry restrictions", "Confirm airline carriage requirements", "Ask the embassy whether an exception exists", "Consider a different destination or travel date"] },
  "-1": { label: "Domestic route", headline: "This is a route within the same country or region", summary: "International visa rules do not apply. Check local identity and transport requirements.", tone: "green", steps: ["Confirm the identity document you need", "Arrange local transport and accommodation", "Review weather and safety notices", "Prepare for departure"] },
  unknown: { label: "Needs verification", headline: "Complete visa information is not available for this route", summary: "Use the destination embassy or official immigration authority as the source of truth.", tone: "gray", steps: ["Review the official immigration website", "Contact the destination embassy", "Confirm airline check-in documents", "Book travel only after confirmation"] },
};

function numericDays(days: VisaRule["days"]) {
  if (typeof days === "number") return days;
  if (typeof days !== "string") return null;
  const match = days.match(/\d+/);
  return match ? Number(match[0]) : null;
}

function chineseText(value: string, locale: string) {
  return locale === "zh-TW" ? toTraditional(value) : value;
}

function localizedPresentation(status: VisaStatus, locale: string): StatusPresentation {
  if (locale === "zh") return statusPresentation[status];
  if (locale === "zh-TW") return toTraditionalDeep(statusPresentation[status]);
  if (locale === "en") return statusPresentationEn[status];
  const copy = getAppCopy(locale);
  const labels: Record<VisaStatus, string> = {
    "visa free": copy.visaFree,
    "visa on arrival": copy.visaOnArrival,
    eta: copy.eta,
    "e-visa": copy.eVisa,
    "visa required": copy.visaRequired,
    "no admission": copy.noAdmission,
    "-1": copy.passportCountry,
    unknown: copy.noData,
  };
  const label = labels[status];
  return {
    label,
    headline: copy.officialSource,
    summary: copy.policyNotice,
    tone: status === "visa free" || status === "-1" ? "green" : status === "visa required" || status === "no admission" ? "red" : "amber",
    steps: [copy.officialSource, copy.officialSource, copy.officialSource, copy.officialSource],
  };
}

export function TripPlanner({ origin, destination, rule, initialPlan }: TripPlannerProps) {
  const router = useRouter();
  const locale = useSiteLanguage();
  const isEnglish = locale === "en";
  const isChinese = locale === "zh" || locale === "zh-TW";
  const copy = getAppCopy(locale);
  const { saveRoute } = usePassportLibrary();
  const allowedDays = numericDays(rule.days);
  const [tripDays, setTripDays] = useState(() => initialPlan?.tripDays ?? Math.min(allowedDays ?? 7, 7));
  const [departureDate, setDepartureDate] = useState(initialPlan?.departureDate ?? "");
  const [purpose, setPurpose] = useState(initialPlan?.purpose ?? "tourism");
  const [hasTransit, setHasTransit] = useState(Boolean(initialPlan?.transitIso3));
  const [transitIso3, setTransitIso3] = useState(initialPlan?.transitIso3 ?? "");
  const [routeSaved, setRouteSaved] = useState(false);
  const [checklistReady, setChecklistReady] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [expandedStep, setExpandedStep] = useState<number | null>(0);
  const [lastCheckedAt, setLastCheckedAt] = useState("");
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [currentLocationIso, setCurrentLocationIso] = useState("");
  const [originCity, setOriginCity] = useState(() => getCities(origin)[0] ?? origin.name);
  const [destinationCity, setDestinationCity] = useState(() => getCities(destination)[0] ?? destination.name);
  const [boardingPassSwiped, setBoardingPassSwiped] = useState(false);
  const [boardingPassOffset, setBoardingPassOffset] = useState(0);
  const [isBoardingDragging, setIsBoardingDragging] = useState(false);
  const generatedPlanRef = useRef<HTMLElement>(null);
  const boardingPassRef = useRef<HTMLElement>(null);
  const boardingPassTrackRef = useRef<HTMLDivElement>(null);
  const swipeStartRef = useRef({ x: 0, offset: 0 });
  const originCities = useMemo(() => getCities(origin), [origin]);
  const destinationCities = useMemo(() => getCities(destination), [destination]);
  const presentation = localizedPresentation(rule.status, locale);
  const routeLabel = isChinese
    ? chineseText(`从 ${origin.nameZh} 前往 ${destination.nameZh}`, locale)
    : `${getCountryName(origin, locale)} → ${getCountryName(destination, locale)}`;
  const exceedsStay = Boolean(allowedDays && tripDays > allowedDays);
  const completedCount = completedSteps.length;
  const transitCountry = countries.find((country) => country.iso3 === transitIso3);
  const currentLocationCountry = countries.find((country) => country.iso3 === currentLocationIso && country.iso3 !== origin.iso3);
  const currentLocationPrompt = currentLocationCountry
    ? formatCopy(copy.currentlyIn, { country: getCountryName(currentLocationCountry, locale) })
    : isChinese
      ? chineseText("我目前在其他国家或地区", locale)
      : "I am currently in another country";
  const departureLocationTitle = isChinese ? chineseText("你在出发前位于哪里？", locale) : "Where are you located before departure?";
  const departureLocationHint = isChinese
    ? chineseText("签证申请辖区和出发材料可能取决于你当前所在的国家或地区。", locale)
    : "Visa jurisdiction and departure documents may depend on your current country or region.";
  const transitMissing = hasTransit && !transitCountry;
  const officialSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(`${origin.name} passport holders ${destination.name} official immigration visa entry requirements`)}`;
  const visaRouteStorageKey = `passport-atlas-visa-check:${origin.iso3}:${destination.iso3}`;
  const snapshotDate = new Date(`${visaDataMeta.snapshotDate}T00:00:00Z`);
  const snapshotAgeDays = currentDate
    ? Math.max(0, Math.floor((currentDate.getTime() - snapshotDate.getTime()) / 86400000))
    : 0;
  const snapshotNeedsReview = snapshotAgeDays > visaDataMeta.staleAfterDays;
  const purposeLabels: Record<string, string> = {
    tourism: copy.purposeTourism,
    business: copy.purposeBusiness,
    study: copy.purposeStudy,
    visit: copy.purposeVisit,
  };

  const invalidatePlan = () => {
    setChecklistReady(false);
    setBoardingPassSwiped(false);
    setBoardingPassOffset(0);
    setIsBoardingDragging(false);
  };

  const getBoardingMaxOffset = () => {
    const track = boardingPassTrackRef.current;
    const card = track?.querySelector<HTMLElement>(".boarding-pass-card");
    if (!track || !card) return 0;
    return Math.max(0, track.clientWidth - card.offsetWidth - 12);
  };

  const completeBoardingPass = () => {
    const maxOffset = getBoardingMaxOffset();
    setBoardingPassOffset(maxOffset);
    setBoardingPassSwiped(true);
    setIsBoardingDragging(false);
    window.setTimeout(() => generatedPlanRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 180);
  };

  const handleBoardingPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (boardingPassSwiped) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    swipeStartRef.current = { x: event.clientX, offset: boardingPassOffset };
    setIsBoardingDragging(true);
  };

  const handleBoardingPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isBoardingDragging || boardingPassSwiped) return;
    const maxOffset = getBoardingMaxOffset();
    const nextOffset = Math.min(maxOffset, Math.max(0, swipeStartRef.current.offset + event.clientX - swipeStartRef.current.x));
    setBoardingPassOffset(nextOffset);
  };

  const handleBoardingPointerUp = () => {
    if (!isBoardingDragging || boardingPassSwiped) return;
    setIsBoardingDragging(false);
    const maxOffset = getBoardingMaxOffset();
    if (maxOffset > 0 && boardingPassOffset >= maxOffset * 0.68) {
      completeBoardingPass();
    } else {
      setBoardingPassOffset(0);
    }
  };

  useEffect(() => {
    setCurrentDate(new Date());
    setLastCheckedAt(window.localStorage.getItem(visaRouteStorageKey) ?? "");
    setCurrentLocationIso(window.localStorage.getItem("passport-atlas-current-location") ?? "");
  }, [visaRouteStorageKey]);

  useEffect(() => {
    if (!originCities.includes(originCity)) setOriginCity(originCities[0] ?? origin.name);
    if (!destinationCities.includes(destinationCity)) setDestinationCity(destinationCities[0] ?? destination.name);
  }, [destination.name, destinationCity, destinationCities, origin.name, originCity, originCities]);

  const formatEvidenceDate = (value: string | Date) => {
    const date = typeof value === "string" ? new Date(value) : value;
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat(isEnglish ? "en-GB" : locale === "zh-TW" ? "zh-TW" : "zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "Asia/Shanghai",
    }).format(date);
  };

  const recordRouteSearch = () => {
    const checkedAt = new Date().toISOString();
    window.localStorage.setItem(visaRouteStorageKey, checkedAt);
    setLastCheckedAt(checkedAt);
  };

  const stepGuidance = useMemo(() => [
    isEnglish ? `Use ${destination.name}'s government, immigration authority, or embassy website to verify the current requirements and note the check date.` : isChinese ? chineseText(`优先通过${destination.nameZh}政府、移民部门或使领馆的官方渠道核对当前要求，并保存查询日期。`, locale) : copy.officialSource,
    isEnglish ? "Prepare the official document list. Common items include a passport, photo, itinerary, accommodation, and proof of funds." : isChinese ? chineseText("按官方清单准备材料。基础材料通常包括护照、照片、行程、住宿和资金证明，最终以受理机构要求为准。", locale) : copy.officialSource,
    isEnglish ? "Confirm whether an appointment, biometrics, or online submission is required. Check your name, passport number, and travel dates before submitting." : isChinese ? chineseText("确认是否需要预约、采集生物信息或在线提交；提交前逐项核对姓名、护照号码和旅行日期。", locale) : copy.officialSource,
    isEnglish ? "After receiving a decision, check validity, entries, and permitted stay before booking non-refundable travel." : isChinese ? chineseText("在收到正式结果后核对有效期、入境次数和允许停留时间，再购买不可退改的机票或行程。", locale) : copy.officialSource,
  ], [copy.officialSource, destination.name, destination.nameZh, isChinese, isEnglish, locale]);

  const stayLabel = useMemo(() => {
    if (!rule.days) return isChinese ? chineseText("停留期限需向官方确认", locale) : copy.verifyPolicy;
    return isChinese ? chineseText(`通常可停留 ${rule.days} 天`, locale) : formatCopy(copy.visaFreeDays, { days: rule.days });
  }, [copy.verifyPolicy, copy.visaFreeDays, isChinese, locale, rule.days]);

  const updateDays = (value: number) => {
    setTripDays(Math.min(365, Math.max(1, value || 1)));
    invalidatePlan();
  };

  const toggleCompletedStep = (index: number) => {
    setCompletedSteps((current) => current.includes(index)
      ? current.filter((step) => step !== index)
      : [...current, index]);
  };

  const generatePlan = () => {
    if (transitMissing) return;
    setChecklistReady(true);
    setBoardingPassSwiped(false);
    setBoardingPassOffset(0);
    window.setTimeout(() => boardingPassRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  };

  const saveCurrentRoute = () => {
    saveRoute({
      originIso3: origin.iso3,
      destinationIso3: destination.iso3,
      purpose,
      tripDays,
      departureDate,
      transitIso3: hasTransit ? transitIso3 || undefined : undefined,
    });
    setRouteSaved(true);
    window.setTimeout(() => setRouteSaved(false), 1800);
  };

  const boardingDateLabel = departureDate ? formatEvidenceDate(departureDate) : isChinese ? chineseText("待设置", locale) : copy.toBeSet;
  const flightNumber = `PA${origin.iso3.slice(0, 2)}${destination.iso3.slice(0, 2)}${String((tripDays * 13) % 900 + 100)}`;
  const passengerLabel = isChinese ? chineseText("Passport Atlas 旅客", locale) : "Passport Atlas traveler";

  return (
    <main className="trip-page">
      <header className="trip-header">
        <button className="trip-brand" type="button" onClick={() => router.push("/")}>
          <span><Globe2 size={21} /></span>Passport <strong>Atlas</strong>
        </button>
        <button className="trip-back" type="button" onClick={() => router.push("/")}>
          <ArrowLeft size={16} />{isChinese ? chineseText("修改国家", locale) : copy.changeRoute}
        </button>
      </header>

      <nav className="trip-progress" aria-label={copy.yourTravelPlan}>
        <span className="done"><i><Check size={13} /></i><b>{isChinese ? chineseText("选择路线", locale) : copy.chooseRoute}</b></span>
        <em />
        <span className={boardingPassSwiped ? "done" : "active"}><i>{boardingPassSwiped ? <Check size={13} /> : 2}</i><b>{isChinese ? chineseText("签证与行程", locale) : copy.visaAndTrip}</b></span>
        <em />
        <span className={boardingPassSwiped ? "active" : ""}><i>3</i><b>{isChinese ? chineseText("准备出发", locale) : copy.getReady}</b></span>
      </nav>

      <section className="trip-route-band">
        <div className="trip-route-copy">
          <span className="trip-kicker">{copy.yourTravelPlan}</span>
          <h1>{routeLabel}</h1>
          <p>{isChinese ? chineseText("根据你的护照和目的地，先确认签证要求，再安排停留时间与出发材料。", locale) : copy.tripIntro}</p>
        </div>
        <div className="trip-route-visual" aria-label={routeLabel}>
          <div className="trip-country">
            <PassportCover color={origin.passportColor} name={getCountryName(origin, locale)} flag={origin.flag} cover={origin.passportCover} />
            <span><small>{isChinese ? chineseText("我的护照", locale) : copy.myPassport}</small><strong>{origin.flag} {getCountryName(origin, locale)}</strong><em>{origin.iso3}</em></span>
          </div>
          <div className="trip-flight"><span /><Plane size={22} /><span /></div>
          <div className="trip-country destination">
            <span className="trip-destination-flag">{destination.flag}</span>
            <span><small>{isChinese ? chineseText("旅行目的地", locale) : copy.destination}</small><strong>{destination.flag} {getCountryName(destination, locale)}</strong><em>{destination.iso3}</em></span>
          </div>
        </div>
      </section>

      <section className={`trip-status trip-tone-${presentation.tone}`}>
        <div className="trip-status-icon">
          {presentation.tone === "green" ? <CheckCircle2 size={25} /> : presentation.tone === "red" || presentation.tone === "dark" ? <CircleAlert size={25} /> : <ShieldCheck size={25} />}
        </div>
        <div className="trip-status-copy">
          <span>{presentation.label}</span>
          <h2>{presentation.headline}</h2>
          <p>{presentation.summary}</p>
        </div>
        <div className="trip-status-stay">
          <Clock3 size={18} />
          <span><small>{isChinese ? chineseText("停留规则", locale) : copy.stayRules}</small><strong>{stayLabel}</strong></span>
        </div>
      </section>

      <section className={`trip-evidence${snapshotNeedsReview ? " is-stale" : ""}`} aria-label={copy.evidenceLevel}>
        <div className="trip-evidence-state">
          {snapshotNeedsReview ? <CircleAlert size={18} /> : <ShieldCheck size={18} />}
          <span>
            <small>{copy.evidenceLevel}</small>
            <strong>{snapshotNeedsReview ? copy.visaNeedsReview : copy.visaReferenceOnly}</strong>
          </span>
        </div>
        <div className="trip-evidence-details">
          <span><Clock3 size={14} />{copy.visaSnapshot}: {formatEvidenceDate(visaDataMeta.snapshotDate)}</span>
          <span><Globe2 size={14} />{copy.visaSource}: {visaDataMeta.sourceName}</span>
          <span className="trip-evidence-cadence">{copy.visaRefreshCadence}</span>
          <span className="trip-evidence-checked">{lastCheckedAt ? `${copy.lastChecked}: ${formatEvidenceDate(lastCheckedAt)}` : copy.notCheckedYet}</span>
        </div>
        <div className="trip-evidence-links">
          <a href={officialSearchUrl} target="_blank" rel="noreferrer" onClick={recordRouteSearch}><Search size={14} />{copy.searchLatestVisa}<ExternalLink size={14} /></a>
          <a href="https://www.iatatravelcentre.com/" target="_blank" rel="noreferrer">{copy.openIata}<ExternalLink size={14} /></a>
          <a href={visaDataMeta.sourceUrl} target="_blank" rel="noreferrer">{copy.visaSource}<ExternalLink size={14} /></a>
        </div>
      </section>

      <section className="trip-workspace">
        <div className="trip-duration">
          <section className="trip-departure-location" aria-label={departureLocationTitle}>
            <div className="trip-departure-location-copy">
              <span><MapPin size={18} /></span>
              <div>
                <small>{isChinese ? chineseText("出发前信息", locale) : "Before departure"}</small>
                <strong>{departureLocationTitle}</strong>
                <p>{departureLocationHint}</p>
              </div>
            </div>
            <label className="trip-departure-location-field">
              <span>{currentLocationPrompt}</span>
              <select
                value={currentLocationIso}
                aria-label={currentLocationPrompt}
                onChange={(event) => {
                  const nextLocation = event.target.value;
                  setCurrentLocationIso(nextLocation);
                  if (nextLocation) window.localStorage.setItem("passport-atlas-current-location", nextLocation);
                  else window.localStorage.removeItem("passport-atlas-current-location");
                  invalidatePlan();
                }}
              >
                <option value="">{isChinese ? chineseText("我目前在其他国家或地区", locale) : "I am currently in another country"}</option>
                {alphabeticalCountries.filter((country) => country.iso3 !== origin.iso3).map((country) => (
                  <option value={country.iso3} key={country.iso3}>{country.flag} {getCountryName(country, locale)}</option>
                ))}
              </select>
            </label>
            {currentLocationCountry && <small className="trip-departure-location-note">{copy.residenceVisaNotice}</small>}
          </section>

          <div className="trip-section-heading">
            <span><CalendarDays size={19} /></span>
            <div><small>{copy.step} 02</small><h2>{isChinese ? chineseText("你计划去几天？", locale) : copy.howManyDays}</h2><p>{isChinese ? chineseText("停留天数会影响签证或免签条件判断。", locale) : copy.stayAffects}</p></div>
          </div>
          <div className="duration-control">
            <button type="button" onClick={() => updateDays(tripDays - 1)} aria-label="减少一天">−</button>
            <label><input type="number" min="1" max="365" value={tripDays} onChange={(event) => updateDays(Number(event.target.value))} /><span>{copy.days}</span></label>
            <button type="button" onClick={() => updateDays(tripDays + 1)} aria-label="增加一天">＋</button>
          </div>
          <div className="duration-presets" aria-label="常用停留时间">
            {[3, 7, 14, 30].map((days) => <button className={tripDays === days ? "active" : ""} type="button" key={days} onClick={() => updateDays(days)}>{days} {copy.days}</button>)}
          </div>
          <label className="trip-date-field">
            <span><CalendarDays size={16} />{isChinese ? chineseText("预计出发日期", locale) : copy.departureDate}</span>
            <input type="date" value={departureDate} onChange={(event) => { setDepartureDate(event.target.value); invalidatePlan(); }} />
          </label>
          <div className="trip-preferences">
            <label>
              <span>{copy.travelPurpose}</span>
              <select value={purpose} onChange={(event) => { setPurpose(event.target.value); invalidatePlan(); }}>
                <option value="tourism">{copy.purposeTourism}</option>
                <option value="business">{copy.purposeBusiness}</option>
                <option value="study">{copy.purposeStudy}</option>
                <option value="visit">{copy.purposeVisit}</option>
              </select>
            </label>
            <label className="trip-transit-toggle">
              <span><input type="checkbox" checked={hasTransit} onChange={(event) => { setHasTransit(event.target.checked); if (!event.target.checked) setTransitIso3(""); invalidatePlan(); }} />{copy.transitRoute}</span>
              <small>{hasTransit ? copy.selectTransit : copy.directRoute}</small>
            </label>
            {hasTransit && (
              <label>
                <span>{copy.selectTransit}</span>
                <select value={transitIso3} onChange={(event) => { setTransitIso3(event.target.value); invalidatePlan(); }}>
                  <option value="">{copy.selectTransit}</option>
                  {alphabeticalCountries.filter((country) => country.iso3 !== origin.iso3 && country.iso3 !== destination.iso3).map((country) => <option value={country.iso3} key={country.iso3}>{country.flag} {getCountryName(country, locale)}</option>)}
                </select>
              </label>
            )}
          </div>
          {(purpose === "business" || purpose === "study" || (hasTransit && transitIso3)) && (
            <div className="trip-context-warning"><CircleAlert size={17} /><span>{purpose === "study" ? copy.purposeStudy : purpose === "business" ? copy.purposeBusiness : transitCountry ? getCountryName(transitCountry, locale) : copy.selectTransit}: {copy.verifyOfficial}</span></div>
          )}
          {transitMissing && <div className="trip-context-warning"><CircleAlert size={17} /><span>{copy.selectTransit}: {copy.verifyOfficial}</span></div>}
          {exceedsStay ? (
            <div className="duration-warning"><CircleAlert size={18} /><span><strong>{isChinese ? chineseText("计划超过当前允许停留期", locale) : copy.verifyPolicy}</strong><small>{isChinese ? chineseText(`你的行程是 ${tripDays} 天，当前数据标注的通常停留期为 ${allowedDays} 天。请缩短行程或申请相应签证。`, locale) : copy.officialSource}</small></span></div>
          ) : (
            <div className="duration-ok"><CheckCircle2 size={18} /><span><strong>{isChinese ? chineseText(`${tripDays} 天行程符合当前停留规则`, locale) : copy.verifyPolicy}</strong><small>{isChinese ? chineseText("仍请在订票前确认目的地最新官方政策。", locale) : copy.officialSource}</small></span></div>
          )}
        </div>

        <div className="trip-requirements">
          <div className="trip-section-heading">
            <span><FileCheck2 size={19} /></span>
            <div><small>{copy.travelChecklist} · {completedCount}/{presentation.steps.length}</small><h2>{isChinese ? `${presentation.label}${chineseText("准备流程", locale)}` : formatCopy(copy.preparation, { status: presentation.label })}</h2><p>{isChinese ? chineseText("点击每一步查看说明，完成后逐项勾选。", locale) : copy.openSteps}</p></div>
          </div>
          <div className="trip-checklist-progress" aria-label={`${completedCount}/${presentation.steps.length}`}>
            <span style={{ width: `${(completedCount / presentation.steps.length) * 100}%` }} />
          </div>
          <ol className="trip-checklist">
            {presentation.steps.map((step, index) => (
              <li className={completedSteps.includes(index) ? "ready" : ""} key={step}>
                <button className="trip-checklist-row" type="button" onClick={() => setExpandedStep(expandedStep === index ? null : index)} aria-expanded={expandedStep === index}>
                  <i>{completedSteps.includes(index) ? <Check size={14} /> : index + 1}</i>
                  <span>{step}</span>
                  <ChevronRight className={expandedStep === index ? "open" : ""} size={15} />
                </button>
                {expandedStep === index && (
                  <div className="trip-step-detail">
                    <p>{stepGuidance[index]}</p>
                    <button type="button" onClick={() => toggleCompletedStep(index)}>
                      {completedSteps.includes(index) ? <><CheckCircle2 size={15} />{isChinese ? chineseText("已完成，点击撤销", locale) : copy.undoComplete}</> : <><Check size={15} />{isChinese ? chineseText("标记此项完成", locale) : copy.markComplete}</>}
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ol>
          <button className="trip-confirm" type="button" disabled={exceedsStay || transitMissing || rule.status === "no admission"} onClick={generatePlan}>
            {checklistReady ? <CheckCircle2 size={18} /> : rule.status === "visa required" ? <FileText size={18} /> : <Luggage size={18} />}
            <span>{transitMissing ? copy.selectTransit : checklistReady ? (isChinese ? chineseText("行动计划已生成，查看下方", locale) : copy.planReady) : (isChinese ? chineseText("生成我的出行行动计划", locale) : copy.generatePlan)}</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {checklistReady && (
        <section className="boarding-pass-section" ref={boardingPassRef} aria-live="polite">
          <header className="boarding-pass-heading">
            <div>
              <span className="trip-kicker">{copy.boardingPass}</span>
              <h2>{isChinese ? chineseText("把旅程变成一张登机牌", locale) : copy.boardingPassTitle}</h2>
              <p>{isChinese ? chineseText("选择更细的城市，然后向右滑动登机牌，确认你的旅程。", locale) : copy.boardingPassIntro}</p>
            </div>
            {boardingPassSwiped && <span className="boarding-pass-success"><CheckCircle2 size={16} />{copy.boardingSuccess}</span>}
          </header>

          <div className="boarding-pass-city-selectors">
            <label className="boarding-pass-city-field">
              <span><MapPin size={15} />{copy.fromCity}</span>
              <select value={originCity} onChange={(event) => { setOriginCity(event.target.value); setBoardingPassSwiped(false); setBoardingPassOffset(0); }}>
                {originCities.map((city) => <option value={city} key={city}>{city}</option>)}
              </select>
            </label>
            <div className="boarding-pass-city-arrow"><ArrowRight size={17} /></div>
            <label className="boarding-pass-city-field">
              <span><MapPin size={15} />{copy.toCity}</span>
              <select value={destinationCity} onChange={(event) => { setDestinationCity(event.target.value); setBoardingPassSwiped(false); setBoardingPassOffset(0); }}>
                {destinationCities.map((city) => <option value={city} key={city}>{city}</option>)}
              </select>
            </label>
          </div>

          <div className="boarding-pass-stage">
            <div className={`boarding-pass-gate${boardingPassSwiped ? " is-open" : ""}`} aria-hidden="true">
              <div className="boarding-pass-gate-screen"><span>{boardingPassSwiped ? "SUCCESS" : "READY"}</span><i /></div>
              <div className="boarding-pass-gate-beam" />
              <div className="boarding-pass-gate-base" />
            </div>
            <div className="boarding-pass-track" ref={boardingPassTrackRef}>
              <div
                className={`boarding-pass-card${isBoardingDragging ? " is-dragging" : ""}${boardingPassSwiped ? " is-success" : ""}`}
                role="button"
                tabIndex={0}
                aria-label={boardingPassSwiped ? copy.boardingSuccess : copy.swipeToBoard}
                onPointerDown={handleBoardingPointerDown}
                onPointerMove={handleBoardingPointerMove}
                onPointerUp={handleBoardingPointerUp}
                onPointerCancel={handleBoardingPointerUp}
                onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); completeBoardingPass(); } }}
                style={{ transform: `translateX(${boardingPassOffset}px)` }}
              >
                <div className="boarding-pass-card-top">
                  <span className="boarding-pass-brand"><Globe2 size={15} />Passport <b>Atlas</b></span>
                  <span>{boardingPassSwiped ? copy.boardingSuccess : copy.boardingPass}</span>
                </div>
                <div className="boarding-pass-route">
                  <div><small>{copy.fromCity}</small><strong>{originCity}</strong><em>{origin.iso3}</em></div>
                  <div className="boarding-pass-route-line"><Plane size={18} /></div>
                  <div className="boarding-pass-route-destination"><small>{copy.toCity}</small><strong>{destinationCity}</strong><em>{destination.iso3}</em></div>
                </div>
                <div className="boarding-pass-meta">
                  <span><small>{copy.passenger}</small><strong>{passengerLabel}</strong></span>
                  <span><small>{copy.flight}</small><strong>{flightNumber}</strong></span>
                  <span><small>{copy.boardingDate}</small><strong>{boardingDateLabel}</strong></span>
                  <span><small>{copy.gate}</small><strong>04</strong></span>
                  <span><small>{copy.seat}</small><strong>12A</strong></span>
                </div>
                <div className="boarding-pass-barcode" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
              </div>
              {!boardingPassSwiped && <span className="boarding-pass-swipe-hint"><ArrowRight size={15} />{copy.boardingPassHint}</span>}
            </div>
          </div>
          <div className="boarding-pass-actions">
            <button className="boarding-pass-confirm" type="button" onClick={completeBoardingPass} disabled={boardingPassSwiped}>
              {boardingPassSwiped ? <CheckCircle2 size={17} /> : <Plane size={17} />}
              {boardingPassSwiped ? copy.journeyConfirmed : copy.confirmBoardingPass}
            </button>
            {boardingPassSwiped && <button className="boarding-pass-edit" type="button" onClick={() => { setBoardingPassSwiped(false); setBoardingPassOffset(0); }}>{copy.editCities}</button>}
          </div>
          <p className="boarding-pass-note"><CircleAlert size={13} />{copy.boardingPassDemo}</p>
        </section>
      )}

      {checklistReady && boardingPassSwiped && (
        <section className="trip-generated-plan" ref={generatedPlanRef} aria-live="polite">
          <header>
            <span><CheckCircle2 size={24} /></span>
            <div><small>{copy.journeyConfirmed}</small><h2>{isChinese ? chineseText("旅程已确认，下一步已经整理好了", locale) : copy.nextStepsReady}</h2><p>{isChinese ? chineseText("按照下列顺序准备，并在出发前再次核对官方政策。", locale) : copy.officialSource}</p></div>
          </header>

          <div className="trip-plan-summary">
            <span><small>{isChinese ? chineseText("路线", locale) : copy.route}</small><strong>{originCity} → {destinationCity}</strong></span>
            <span><small>{isChinese ? chineseText("入境方式", locale) : copy.entryMethod}</small><strong>{presentation.label}</strong></span>
            <span><small>{isChinese ? chineseText("计划停留", locale) : copy.plannedStay}</small><strong>{tripDays} {copy.days}</strong></span>
            <span><small>{isChinese ? chineseText("预计出发", locale) : copy.departure}</small><strong>{departureDate || (isChinese ? chineseText("待设置", locale) : copy.toBeSet)}</strong></span>
            <span><small>{copy.travelPurpose}</small><strong>{purposeLabels[purpose]}</strong></span>
            <span><small>{copy.transitRoute}</small><strong>{hasTransit && transitCountry ? getCountryName(transitCountry, locale) : copy.directRoute}</strong></span>
          </div>

          <div className="trip-plan-next">
            <div>
              <small>{isChinese ? chineseText("现在先做什么", locale) : copy.step}</small>
              <h3>{isChinese ? chineseText(rule.status === "visa required" || rule.status === "e-visa" || rule.status === "eta" ? `核对${destination.nameZh}官方申请渠道与材料清单` : `确认${destination.nameZh}最新入境和停留规则`, locale) : copy.officialSource}</h3>
              <p>{isChinese ? chineseText(`当前已完成 ${completedCount}/${presentation.steps.length} 项准备事项。未完成的项目会继续保留在上方清单中。`, locale) : copy.officialSource}</p>
            </div>
            <strong>{Math.round((completedCount / presentation.steps.length) * 100)}%</strong>
          </div>

          <div className="trip-plan-actions">
            <button className="primary" type="button" onClick={() => window.print()}><Printer size={17} />{isChinese ? chineseText("打印或保存清单", locale) : copy.printChecklist}</button>
            <button type="button" onClick={() => router.push(`/passport/${origin.iso3.toLowerCase()}`)}><Globe2 size={17} />{isChinese ? chineseText("查看护照免签地图", locale) : copy.viewAccessMap}</button>
            <button type="button" onClick={() => router.push("/")}><RefreshCw size={17} />{isChinese ? chineseText("重新规划旅程", locale) : copy.planAnotherTrip}</button>
            <button type="button" onClick={saveCurrentRoute}><Save size={17} />{routeSaved ? copy.routeSaved : copy.saveRoute}</button>
          </div>
        </section>
      )}

      <section className="trip-policy-note">
        <MapPin size={16} />
        <p>{isChinese ? chineseText(`签证和入境政策可能随时调整。购买机票或提交申请前，请以 ${destination.nameZh} 官方移民部门、使领馆及承运航空公司的最新要求为准。`, locale) : copy.policyNotice}</p>
      </section>
    </main>
  );
}
