"use client";

import { languages } from "countries-list";
import countriesData from "@/data/countries.json";
import translationData from "@/data/ui-translations.json";
import { formatCopy, getCountryName, getLanguageFallbackCode, toTraditionalDeep } from "@/lib/i18n";
import type { CountryProfile } from "@/types/passport";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Globe2,
  Languages,
  LockKeyhole,
  MapPin,
  Plane,
  Route,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { forwardRef, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { WelcomeWorldMap } from "./welcome-world-map";

type Copy = {
  badge: string;
  titleTop: string;
  titleBottom: string;
  welcome: string;
  body: string[];
  action: string;
  trust: string;
  language: string;
  search: string;
  count: string;
  features: Array<[string, string]>;
};

const copyByLanguage: Record<string, Copy> = {
  zh: {
    badge: "AI 护照旅行助手",
    titleTop: "探索你的护照，",
    titleBottom: "连接世界",
    welcome: "你好，欢迎使用 Passport Atlas",
    body: ["我们将帮助你了解：", "你的护照可以去哪里，", "以及如何准备你的下一段旅程。"],
    action: "开始探索",
    trust: "数据来自权威公开机构，持续更新",
    language: "语言",
    search: "搜索语言",
    count: "种国家语言",
    features: [["全球覆盖", "199个国家和地区"], ["权威准确", "公开数据持续更新"], ["智能推荐", "AI 助力旅行规划"], ["隐私安全", "保护你的个人信息"]],
  },
  en: {
    badge: "AI Passport Travel Assistant",
    titleTop: "Explore your passport,",
    titleBottom: "connect the world",
    welcome: "Welcome to Passport Atlas",
    body: ["Understand where your passport can take you,", "what entry rules apply,", "and how to prepare for your next journey."],
    action: "Start exploring",
    trust: "Public data from authoritative sources, continuously updated",
    language: "Language",
    search: "Search languages",
    count: "national languages",
    features: [["Global coverage", "199 countries and regions"], ["Trusted data", "Continuously updated"], ["Smart guidance", "AI-assisted trip planning"], ["Privacy first", "Your information stays protected"]],
  },
  es: {
    badge: "Asistente de viaje con IA",
    titleTop: "Explora tu pasaporte,",
    titleBottom: "conecta el mundo",
    welcome: "Bienvenido a Passport Atlas",
    body: ["Descubre adonde te lleva tu pasaporte,", "los requisitos de entrada", "y como preparar tu proximo viaje."],
    action: "Empezar a explorar",
    trust: "Datos publicos de fuentes oficiales, actualizados continuamente",
    language: "Idioma",
    search: "Buscar idiomas",
    count: "idiomas nacionales",
    features: [["Cobertura global", "199 paises y regiones"], ["Datos fiables", "Actualizacion continua"], ["Guia inteligente", "Planificacion con IA"], ["Privacidad", "Tus datos estan protegidos"]],
  },
  fr: {
    badge: "Assistant voyage IA",
    titleTop: "Explorez votre passeport,",
    titleBottom: "connectez le monde",
    welcome: "Bienvenue sur Passport Atlas",
    body: ["Decouvrez ou votre passeport vous mene,", "les conditions d'entree", "et comment preparer votre prochain voyage."],
    action: "Commencer l'exploration",
    trust: "Donnees publiques de sources officielles, mises a jour en continu",
    language: "Langue",
    search: "Rechercher une langue",
    count: "langues nationales",
    features: [["Couverture mondiale", "199 pays et regions"], ["Donnees fiables", "Mise a jour continue"], ["Conseils intelligents", "Planification assistee par IA"], ["Confidentialite", "Vos informations sont protegees"]],
  },
  de: {
    badge: "KI-Reiseassistent",
    titleTop: "Entdecke deinen Reisepass,",
    titleBottom: "verbinde die Welt",
    welcome: "Willkommen bei Passport Atlas",
    body: ["Erfahre, wohin dich dein Pass bringt,", "welche Einreiseregeln gelten", "und wie du deine nachste Reise planst."],
    action: "Jetzt entdecken",
    trust: "Offentliche Daten aus verlasslichen Quellen, laufend aktualisiert",
    language: "Sprache",
    search: "Sprachen suchen",
    count: "Landessprachen",
    features: [["Globale Abdeckung", "199 Lander und Regionen"], ["Verlassliche Daten", "Laufend aktualisiert"], ["Smarte Empfehlungen", "Reiseplanung mit KI"], ["Datenschutz", "Deine Daten bleiben geschutzt"]],
  },
  ja: {
    badge: "AI パスポート旅行アシスタント",
    titleTop: "パスポートを探索し、",
    titleBottom: "世界とつながる",
    welcome: "Passport Atlas へようこそ",
    body: ["あなたのパスポートで行ける場所、", "入国条件、", "次の旅の準備方法をご案内します。"],
    action: "探索を始める",
    trust: "公的機関の公開データを継続的に更新",
    language: "言語",
    search: "言語を検索",
    count: "の公用語",
    features: [["グローバル対応", "199の国と地域"], ["信頼できる情報", "継続的に更新"], ["スマート提案", "AIによる旅行計画"], ["プライバシー", "個人情報を保護"]],
  },
  ko: {
    badge: "AI 여권 여행 도우미",
    titleTop: "여권을 탐색하고,",
    titleBottom: "세계와 연결하세요",
    welcome: "Passport Atlas에 오신 것을 환영합니다",
    body: ["여권으로 갈 수 있는 곳과", "입국 조건,", "다음 여행 준비 방법을 확인하세요."],
    action: "탐색 시작",
    trust: "공식 공개 데이터를 지속적으로 업데이트합니다",
    language: "언어",
    search: "언어 검색",
    count: "개 국가 언어",
    features: [["글로벌 범위", "199개 국가 및 지역"], ["신뢰할 수 있는 정보", "지속적인 업데이트"], ["스마트 추천", "AI 여행 계획"], ["개인정보 보호", "개인정보를 안전하게 보호"]],
  },
  ar: {
    badge: "مساعد السفر الذكي للجوازات",
    titleTop: "استكشف جواز سفرك،",
    titleBottom: "وتواصل مع العالم",
    welcome: "مرحباً بك في Passport Atlas",
    body: ["اكتشف أين يمكن أن يأخذك جواز سفرك،", "ومتطلبات الدخول،", "وكيف تستعد لرحلتك القادمة."],
    action: "ابدأ الاستكشاف",
    trust: "بيانات عامة من مصادر رسمية يتم تحديثها باستمرار",
    language: "اللغة",
    search: "ابحث عن لغة",
    count: "لغة وطنية",
    features: [["تغطية عالمية", "199 دولة ومنطقة"], ["بيانات موثوقة", "تحديث مستمر"], ["توصيات ذكية", "تخطيط سفر بالذكاء الاصطناعي"], ["الخصوصية", "حماية معلوماتك الشخصية"]],
  },
  ru: {
    badge: "ИИ-помощник для путешествий",
    titleTop: "Исследуйте свой паспорт,",
    titleBottom: "откройте мир",
    welcome: "Добро пожаловать в Passport Atlas",
    body: ["Узнайте, куда можно поехать с вашим паспортом,", "какие правила въезда действуют", "и как подготовиться к следующему путешествию."],
    action: "Начать исследование",
    trust: "Открытые данные из официальных источников регулярно обновляются",
    language: "Язык",
    search: "Поиск языка",
    count: "национальных языков",
    features: [["Весь мир", "199 стран и регионов"], ["Надежные данные", "Регулярные обновления"], ["Умные советы", "Планирование с ИИ"], ["Конфиденциальность", "Защита личных данных"]],
  },
  pt: {
    badge: "Assistente de viagem com IA",
    titleTop: "Explore o seu passaporte,",
    titleBottom: "conecte o mundo",
    welcome: "Bem-vindo ao Passport Atlas",
    body: ["Descubra onde o seu passaporte pode leva-lo,", "as regras de entrada", "e como preparar a sua proxima viagem."],
    action: "Comecar a explorar",
    trust: "Dados publicos de fontes oficiais, atualizados continuamente",
    language: "Idioma",
    search: "Pesquisar idiomas",
    count: "idiomas nacionais",
    features: [["Cobertura global", "199 paises e regioes"], ["Dados confiaveis", "Atualizacao continua"], ["Orientacao inteligente", "Planejamento com IA"], ["Privacidade", "Seus dados estao protegidos"]],
  },
  tr: {
    badge: "Yapay Zeka Pasaport Seyahat Asistanı",
    titleTop: "Pasaportunu keşfet,",
    titleBottom: "dünyaya bağlan",
    welcome: "Passport Atlas'a hoş geldin",
    body: ["Pasaportunun seni nereye götürebileceğini,", "hangi giriş kurallarının geçerli olduğunu", "ve sonraki yolculuğuna nasıl hazırlanacağını öğren."],
    action: "Keşfetmeye başla",
    trust: "Yetkili kaynaklardan alınan veriler sürekli güncellenir",
    language: "Dil",
    search: "Dil ara",
    count: "ulusal dil",
    features: [["Küresel kapsam", "199 ülke ve bölge"], ["Güvenilir veriler", "Sürekli güncellenir"], ["Akıllı öneriler", "Yapay zeka destekli seyahat planlama"], ["Gizlilik ve güvenlik", "Kişisel bilgilerin korunur"]],
  },
  hi: {
    badge: "AI पासपोर्ट यात्रा सहायक",
    titleTop: "अपने पासपोर्ट को जानें,",
    titleBottom: "दुनिया से जुड़ें",
    welcome: "Passport Atlas में आपका स्वागत है",
    body: ["जानें कि आपका पासपोर्ट आपको कहां ले जा सकता है,", "प्रवेश नियम क्या हैं", "और अगली यात्रा की तैयारी कैसे करें।"],
    action: "खोजना शुरू करें",
    trust: "आधिकारिक सार्वजनिक डेटा, निरंतर अपडेट के साथ",
    language: "भाषा",
    search: "भाषा खोजें",
    count: "राष्ट्रीय भाषाएं",
    features: [["वैश्विक कवरेज", "199 देश और क्षेत्र"], ["विश्वसनीय डेटा", "निरंतर अपडेट"], ["स्मार्ट सुझाव", "AI यात्रा योजना"], ["गोपनीयता", "आपकी जानकारी सुरक्षित"]],
  },
};

const countries = countriesData as CountryProfile[];

type RouteCopy = {
  planMode: string;
  exploreMode: string;
  originQuestion: string;
  originHint: string;
  destinationQuestion: string;
  destinationHint: string;
  placeholder: string;
  submit: string;
};

type EntryCopy = {
  hello: string;
  from: string;
  passport?: string;
  abroad?: string;
  currentLocation?: string;
  currentLocationHint?: string;
  clearLocation?: string;
  language: string;
  continue: string;
  privacy: string;
  selectCountry: string;
  searchCountries: string;
  countries: string;
};

type RouteCountryPickerProps = {
  step: string;
  question: string;
  hint: string;
  placeholder: string;
  searchPlaceholder: string;
  value: string;
  languageCode: string;
  countries: CountryProfile[];
  excludeIso3?: string;
  icon: ReactNode;
  onChange: (iso3: string) => void;
};

const RouteCountryPicker = forwardRef<HTMLButtonElement, RouteCountryPickerProps>(function RouteCountryPicker({
  step,
  question,
  hint,
  placeholder,
  searchPlaceholder,
  value,
  languageCode,
  countries,
  excludeIso3,
  icon,
  onChange,
}, forwardedRef) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const selected = countries.find((country) => country.iso3 === value);
  const filteredCountries = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return countries
      .filter((country) => country.iso3 !== excludeIso3)
      .filter((country) => {
        if (!normalizedQuery) return true;
        return [country.name, country.nameZh, country.iso2, country.iso3, ...country.aliases]
          .join(" ")
          .toLocaleLowerCase()
          .includes(normalizedQuery);
      })
      .sort((left, right) => left.name.localeCompare(right.name, "en", { sensitivity: "base" }));
  }, [countries, excludeIso3, query]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (open) window.setTimeout(() => searchInputRef.current?.focus(), 0);
  }, [open]);

  const chooseCountry = (iso3: string) => {
    onChange(iso3);
    setOpen(false);
    setQuery("");
  };

  return (
    <div className="welcome-route-field route-country-picker" ref={rootRef}>
      <span className="route-question"><small>{step}</small>{question}</span>
      <span className="route-hint">{hint}</span>
      <button
        ref={forwardedRef}
        className={`route-select-wrap route-select-trigger${selected ? " has-value" : ""}`}
        type="button"
        onClick={() => setOpen((isOpen) => !isOpen)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {icon}
        <span className={`route-selected-label${selected ? "" : " is-placeholder"}`}>
          {selected ? `${selected.flag} ${getCountryName(selected, languageCode)}` : placeholder}
        </span>
        <ChevronDown size={16} className={open ? "open" : ""} />
      </button>
      {open && (
        <section className="route-country-menu" aria-label={question}>
          <label className="language-search route-country-search">
            <Search size={16} />
            <input
              ref={searchInputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
            />
          </label>
          <div className="route-country-list" role="listbox" aria-label={question}>
            {filteredCountries.length > 0 ? filteredCountries.map((country) => (
              <button
                key={country.iso3}
                type="button"
                role="option"
                aria-selected={country.iso3 === value}
                onClick={() => chooseCountry(country.iso3)}
              >
                <span className="route-country-flag">{country.flag}</span>
                <span>
                  <strong>{getCountryName(country, languageCode)}</strong>
                  <small>{country.iso3} · {country.iso2}</small>
                </span>
                {country.iso3 === value && <Check size={16} />}
              </button>
            )) : (
              <p className="route-country-empty">No matching countries</p>
            )}
          </div>
        </section>
      )}
    </div>
  );
});

const entryCopyByLanguage: Record<string, EntryCopy> = {
  en: { hello: "Hello!", from: "I'm from", language: "Language", continue: "Continue", privacy: "Your privacy is important to us.", selectCountry: "Select your country", searchCountries: "Search countries", countries: "countries and regions" },
  zh: { hello: "你好！", from: "我来自", language: "语言", continue: "继续", privacy: "我们重视你的隐私。", selectCountry: "选择你的国家或地区", searchCountries: "搜索国家", countries: "个国家和地区" },
  es: { hello: "¡Hola!", from: "Soy de", language: "Idioma", continue: "Continuar", privacy: "Tu privacidad es importante para nosotros.", selectCountry: "Selecciona tu país", searchCountries: "Buscar países", countries: "países y regiones" },
  fr: { hello: "Bonjour !", from: "Je viens de", language: "Langue", continue: "Continuer", privacy: "Votre vie privée est importante pour nous.", selectCountry: "Sélectionnez votre pays", searchCountries: "Rechercher un pays", countries: "pays et régions" },
  de: { hello: "Hallo!", from: "Ich komme aus", language: "Sprache", continue: "Weiter", privacy: "Deine Privatsphäre ist uns wichtig.", selectCountry: "Wähle dein Land", searchCountries: "Länder suchen", countries: "Länder und Regionen" },
  ja: { hello: "こんにちは！", from: "出身国", language: "言語", continue: "続ける", privacy: "プライバシーを大切にしています。", selectCountry: "国または地域を選択", searchCountries: "国を検索", countries: "の国と地域" },
  ko: { hello: "안녕하세요!", from: "출신 국가", language: "언어", continue: "계속", privacy: "개인정보를 소중히 보호합니다.", selectCountry: "국가 또는 지역 선택", searchCountries: "국가 검색", countries: "개 국가 및 지역" },
  ar: { hello: "مرحباً!", from: "أنا من", language: "اللغة", continue: "متابعة", privacy: "خصوصيتك مهمة بالنسبة لنا.", selectCountry: "اختر دولتك", searchCountries: "ابحث عن دولة", countries: "دولة ومنطقة" },
  ru: { hello: "Здравствуйте!", from: "Я из", language: "Язык", continue: "Продолжить", privacy: "Ваша конфиденциальность важна для нас.", selectCountry: "Выберите страну", searchCountries: "Поиск стран", countries: "стран и регионов" },
  pt: { hello: "Olá!", from: "Eu sou de", language: "Idioma", continue: "Continuar", privacy: "A sua privacidade é importante para nós.", selectCountry: "Escolha o seu país", searchCountries: "Pesquisar países", countries: "países e regiões" },
  tr: { hello: "Merhaba!", from: "Ben", language: "Dil", continue: "Devam et", privacy: "Gizliliğiniz bizim için önemlidir.", selectCountry: "Ülkenizi seçin", searchCountries: "Ülke ara", countries: "ülke ve bölge" },
  hi: { hello: "नमस्ते!", from: "मैं यहां से हूं", language: "भाषा", continue: "जारी रखें", privacy: "आपकी गोपनीयता हमारे लिए महत्वपूर्ण है।", selectCountry: "अपना देश चुनें", searchCountries: "देश खोजें", countries: "देश और क्षेत्र" },
};

type EntryContextCopy = {
  passport: string;
  abroad: string;
  currentLocation: string;
  currentLocationHint: string;
  clearLocation: string;
};

const entryContextCopyByLanguage: Record<string, EntryContextCopy> = {
  en: { passport: "My passport is from", abroad: "I am currently in another country", currentLocation: "Current location", currentLocationHint: "Optional · choose where you are applying or starting from", clearLocation: "Clear current location" },
  zh: { passport: "我的护照来自", abroad: "我目前在其他国家或地区", currentLocation: "当前所在国家或地区", currentLocationHint: "可选 · 选择你申请签证或出发所在的国家", clearLocation: "清除当前所在国家" },
  es: { passport: "Mi pasaporte es de", abroad: "Ahora estoy en otro país", currentLocation: "Ubicación actual", currentLocationHint: "Opcional · indica desde dónde solicitas o comienzas", clearLocation: "Borrar ubicación actual" },
  fr: { passport: "Mon passeport est délivré par", abroad: "Je suis actuellement dans un autre pays", currentLocation: "Lieu actuel", currentLocationHint: "Facultatif · indiquez où vous faites la demande ou commencez", clearLocation: "Effacer le lieu actuel" },
  de: { passport: "Mein Reisepass stammt aus", abroad: "Ich bin derzeit in einem anderen Land", currentLocation: "Aktueller Standort", currentLocationHint: "Optional · wähle, wo du den Antrag stellst oder startest", clearLocation: "Aktuellen Standort löschen" },
  ja: { passport: "パスポートの発行国", abroad: "現在は別の国にいます", currentLocation: "現在地の国または地域", currentLocationHint: "任意 · 申請または出発する場所を選択", clearLocation: "現在地を解除" },
  ko: { passport: "여권 발행 국가", abroad: "현재 다른 국가에 있습니다", currentLocation: "현재 위치한 국가 또는 지역", currentLocationHint: "선택 사항 · 신청하거나 출발하는 곳을 선택하세요", clearLocation: "현재 위치 삭제" },
  ar: { passport: "جواز سفري من", abroad: "أنا حالياً في دولة أخرى", currentLocation: "موقعك الحالي", currentLocationHint: "اختياري · اختر مكان تقديم الطلب أو بدء الرحلة", clearLocation: "مسح الموقع الحالي" },
  ru: { passport: "Мой паспорт выдан в", abroad: "Сейчас я нахожусь в другой стране", currentLocation: "Текущая страна или регион", currentLocationHint: "Необязательно · выберите место подачи или начала поездки", clearLocation: "Очистить текущее местоположение" },
  pt: { passport: "Meu passaporte é de", abroad: "Estou atualmente em outro país", currentLocation: "Localização atual", currentLocationHint: "Opcional · escolha onde solicita ou inicia a viagem", clearLocation: "Limpar localização atual" },
  tr: { passport: "Pasaportumun ülkesi", abroad: "Şu anda başka bir ülkedeyim", currentLocation: "Mevcut konum", currentLocationHint: "İsteğe bağlı · başvuru veya başlangıç yerini seçin", clearLocation: "Mevcut konumu temizle" },
  hi: { passport: "मेरा पासपोर्ट देश", abroad: "मैं अभी किसी दूसरे देश में हूं", currentLocation: "वर्तमान देश या क्षेत्र", currentLocationHint: "वैकल्पिक · आवेदन या यात्रा शुरू करने का स्थान चुनें", clearLocation: "वर्तमान स्थान हटाएं" },
};

const traditionalWelcomeCopy = toTraditionalDeep(copyByLanguage.zh);
const traditionalEntryCopy = toTraditionalDeep(entryCopyByLanguage.zh);

const routeCopyByLanguage: Record<string, RouteCopy> = {
  zh: { planMode: "规划我的旅程", exploreMode: "自由探索护照", originQuestion: "你是哪国人？", originHint: "选择你持有的护照", destinationQuestion: "你想去哪个国家？", destinationHint: "选择本次旅行目的地", placeholder: "请选择国家或地区", submit: "查看我的签证方案" },
  en: { planMode: "Plan my journey", exploreMode: "Explore passports", originQuestion: "Which passport do you hold?", originHint: "Select your passport country", destinationQuestion: "Where do you want to go?", destinationHint: "Select your destination", placeholder: "Choose a country or region", submit: "See my visa plan" },
  es: { planMode: "Planificar mi viaje", exploreMode: "Explorar pasaportes", originQuestion: "¿Que pasaporte tienes?", originHint: "Selecciona el pais de tu pasaporte", destinationQuestion: "¿A donde quieres ir?", destinationHint: "Selecciona tu destino", placeholder: "Elige un pais o region", submit: "Ver mi plan de visado" },
  fr: { planMode: "Planifier mon voyage", exploreMode: "Explorer les passeports", originQuestion: "Quel passeport possedez-vous ?", originHint: "Selectionnez votre pays", destinationQuestion: "Ou souhaitez-vous aller ?", destinationHint: "Selectionnez votre destination", placeholder: "Choisissez un pays ou une region", submit: "Voir mon plan de visa" },
  de: { planMode: "Reise planen", exploreMode: "Passe entdecken", originQuestion: "Welchen Reisepass hast du?", originHint: "Wahle dein Passland", destinationQuestion: "Wohin mochtest du reisen?", destinationHint: "Wahle dein Reiseziel", placeholder: "Land oder Region wahlen", submit: "Visumplan anzeigen" },
  ja: { planMode: "旅程を計画", exploreMode: "パスポートを探索", originQuestion: "どの国のパスポートですか？", originHint: "保有するパスポートを選択", destinationQuestion: "どの国へ行きたいですか？", destinationHint: "旅行先を選択", placeholder: "国または地域を選択", submit: "ビザプランを確認" },
  ko: { planMode: "여행 계획", exploreMode: "여권 자유 탐색", originQuestion: "어느 나라 여권을 가지고 있나요?", originHint: "보유한 여권을 선택하세요", destinationQuestion: "어느 나라로 가고 싶나요?", destinationHint: "여행지를 선택하세요", placeholder: "국가 또는 지역 선택", submit: "비자 계획 확인" },
  ar: { planMode: "خطط لرحلتي", exploreMode: "استكشف الجوازات", originQuestion: "ما جواز السفر الذي تحمله؟", originHint: "اختر دولة جواز سفرك", destinationQuestion: "إلى أي دولة تريد الذهاب؟", destinationHint: "اختر وجهتك", placeholder: "اختر دولة أو منطقة", submit: "عرض خطة التأشيرة" },
  ru: { planMode: "Спланировать поездку", exploreMode: "Исследовать паспорта", originQuestion: "Какой у вас паспорт?", originHint: "Выберите страну паспорта", destinationQuestion: "Куда вы хотите поехать?", destinationHint: "Выберите страну назначения", placeholder: "Выберите страну или регион", submit: "Показать визовый план" },
  pt: { planMode: "Planejar minha viagem", exploreMode: "Explorar passaportes", originQuestion: "Qual passaporte voce possui?", originHint: "Selecione o pais do seu passaporte", destinationQuestion: "Para onde voce quer ir?", destinationHint: "Selecione o destino", placeholder: "Escolha um pais ou regiao", submit: "Ver meu plano de visto" },
  tr: { planMode: "Seyahatimi planla", exploreMode: "Pasaportları keşfet", originQuestion: "Hangi ülkenin pasaportuna sahipsin?", originHint: "Sahip olduğun pasaportu seç", destinationQuestion: "Hangi ülkeye gitmek istiyorsun?", destinationHint: "Seyahat hedefini seç", placeholder: "Ülke veya bölge seç", submit: "Vize planımı göster" },
  hi: { planMode: "मेरी यात्रा की योजना", exploreMode: "पासपोर्ट खोजें", originQuestion: "आपके पास किस देश का पासपोर्ट है?", originHint: "अपना पासपोर्ट देश चुनें", destinationQuestion: "आप किस देश जाना चाहते हैं?", destinationHint: "अपना गंतव्य चुनें", placeholder: "देश या क्षेत्र चुनें", submit: "वीजा योजना देखें" },
};

const traditionalRouteCopy = toTraditionalDeep(routeCopyByLanguage.zh);

const localizedCopyByLanguage: Record<string, Copy> = { ...copyByLanguage, "zh-TW": traditionalWelcomeCopy };
const localizedEntryCopyByLanguage: Record<string, EntryCopy> = { ...entryCopyByLanguage, "zh-TW": traditionalEntryCopy };
const localizedEntryContextCopyByLanguage: Record<string, EntryContextCopy> = { ...entryContextCopyByLanguage, "zh-TW": toTraditionalDeep(entryContextCopyByLanguage.zh) };
const localizedRouteCopyByLanguage: Record<string, RouteCopy> = { ...routeCopyByLanguage, "zh-TW": traditionalRouteCopy };

const languageOptions = [
  ...Object.entries(languages).map(([code, language]) => ({ code, name: language.name, native: language.native, rtl: Boolean(language.rtl) })),
  { code: "zh-TW", name: "Traditional Chinese", native: "繁體中文", rtl: false },
]
  .sort((left, right) => left.name < right.name ? -1 : left.name > right.name ? 1 : 0);

type PassportLanguagePromptCopy = {
  title: string;
  description: string;
  autoSelect: string;
  keepCurrent: string;
  close: string;
};

type PassportLanguagePrompt = {
  country: CountryProfile;
  languageCode: string;
};

const traditionalPassportLanguagePromptCopy = toTraditionalDeep({
  title: "是否根據護照自動選擇語言？",
  description: "根據你選擇的 {country} 護照，我們推薦使用 {language}。",
  autoSelect: "使用推薦語言",
  keepCurrent: "保持目前語言",
  close: "關閉",
});

const passportLanguagePromptCopyByLanguage: Record<string, PassportLanguagePromptCopy> = {
  en: {
    title: "Choose a language automatically?",
    description: "Based on your {country} passport, we recommend {language}.",
    autoSelect: "Use recommended language",
    keepCurrent: "Keep current language",
    close: "Close",
  },
  zh: {
    title: "是否根据护照自动选择语言？",
    description: "根据你选择的 {country} 护照，我们推荐使用 {language}。",
    autoSelect: "使用推荐语言",
    keepCurrent: "保持当前语言",
    close: "关闭",
  },
  "zh-TW": traditionalPassportLanguagePromptCopy,
  es: {
    title: "¿Elegir el idioma automáticamente?",
    description: "Según tu pasaporte de {country}, recomendamos {language}.",
    autoSelect: "Usar idioma recomendado",
    keepCurrent: "Mantener idioma actual",
    close: "Cerrar",
  },
  fr: {
    title: "Choisir automatiquement la langue ?",
    description: "Pour votre passeport de {country}, nous recommandons {language}.",
    autoSelect: "Utiliser la langue recommandée",
    keepCurrent: "Garder la langue actuelle",
    close: "Fermer",
  },
  de: {
    title: "Sprache automatisch auswählen?",
    description: "Für deinen Reisepass aus {country} empfehlen wir {language}.",
    autoSelect: "Empfohlene Sprache verwenden",
    keepCurrent: "Aktuelle Sprache behalten",
    close: "Schließen",
  },
  ja: {
    title: "パスポートに合わせて言語を選択しますか？",
    description: "{country}のパスポートには{language}をおすすめします。",
    autoSelect: "おすすめの言語を使う",
    keepCurrent: "現在の言語を使う",
    close: "閉じる",
  },
  ko: {
    title: "여권에 맞춰 언어를 자동으로 선택할까요?",
    description: "{country} 여권에는 {language}를 추천합니다.",
    autoSelect: "추천 언어 사용",
    keepCurrent: "현재 언어 유지",
    close: "닫기",
  },
  ar: {
    title: "اختيار اللغة تلقائياً حسب جواز السفر؟",
    description: "بناءً على جواز سفرك من {country}، نوصي باستخدام {language}.",
    autoSelect: "استخدام اللغة المقترحة",
    keepCurrent: "الاحتفاظ باللغة الحالية",
    close: "إغلاق",
  },
  ru: {
    title: "Выбрать язык автоматически по паспорту?",
    description: "Для паспорта страны {country} мы рекомендуем {language}.",
    autoSelect: "Использовать рекомендуемый язык",
    keepCurrent: "Оставить текущий язык",
    close: "Закрыть",
  },
  pt: {
    title: "Escolher o idioma automaticamente?",
    description: "Com um passaporte de {country}, recomendamos {language}.",
    autoSelect: "Usar idioma recomendado",
    keepCurrent: "Manter idioma atual",
    close: "Fechar",
  },
  tr: {
    title: "Dil pasaporta göre otomatik seçilsin mi?",
    description: "{country} pasaportuna göre {language} dilini öneriyoruz.",
    autoSelect: "Önerilen dili kullan",
    keepCurrent: "Mevcut dili koru",
    close: "Kapat",
  },
  hi: {
    title: "पासपोर्ट के अनुसार भाषा अपने आप चुनें?",
    description: "{country} के पासपोर्ट के आधार पर हम {language} की सलाह देते हैं।",
    autoSelect: "सुझाई गई भाषा चुनें",
    keepCurrent: "वर्तमान भाषा रखें",
    close: "बंद करें",
  },
};

// Primary/official languages are used as a helpful default for onboarding.
// Countries with multiple official languages use the most widely used travel language.
const passportLanguageCodeByIso3: Record<string, string> = {
  SGP: "en", JPN: "ja", KOR: "ko", ARE: "ar", SWE: "sv", BEL: "nl", DNK: "da", FIN: "fi",
  FRA: "fr", DEU: "de", IRL: "en", ITA: "it", LUX: "fr", NLD: "nl", NOR: "no", ESP: "es",
  AUT: "de", GRC: "el", MLT: "mt", PRT: "pt", CHE: "de", HUN: "hu", POL: "pl", GBR: "en",
  AUS: "en", CAN: "en", CZE: "cs", LVA: "lv", MYS: "ms", NZL: "en", SVK: "sk", SVN: "sl",
  HRV: "hr", EST: "et", LIE: "de", LTU: "lt", ISL: "is", USA: "en", BGR: "bg", ROU: "ro",
  MCO: "fr", CYP: "el", CHL: "es", HKG: "zh", AND: "ca", ARG: "es", BRA: "pt", SMR: "it",
  ISR: "he", BRB: "en", BRN: "ms", BHS: "en", KNA: "en", VCT: "en", MEX: "es", URY: "es",
  SYC: "en", ATG: "en", VAT: "it", CRI: "es", GRD: "en", MUS: "en", PAN: "es", PRY: "es",
  DMA: "en", TTO: "en", LCA: "en", MAC: "zh", UKR: "uk", PER: "es", SRB: "sr", TWN: "zh-TW",
  SLB: "en", GTM: "es", SLV: "es", COL: "es", HND: "es", MHL: "en", WSM: "sm", MNE: "sr",
  MKD: "mk", TON: "to", NIC: "es", TUV: "en", ALB: "sq", BIH: "bs", GEO: "ka", KIR: "en",
  FSM: "en", MDA: "ro", PLW: "en", VEN: "es", RUS: "ru", QAT: "ar", TUR: "tr", ZAF: "en",
  BLZ: "en", KWT: "ar", MDV: "dv", TLS: "pt", ECU: "es", SAU: "ar", BHR: "ar", GUY: "en",
  FJI: "en", VUT: "en", OMN: "ar", JAM: "en", NRU: "en", PNG: "en", XKX: "sq", CHN: "zh",
  BWA: "en", BLR: "ru", BOL: "es", KAZ: "kk", THA: "th", SUR: "nl", NAM: "en", LSO: "en",
  SWZ: "en", MAR: "ar", DOM: "es", IDN: "id", KEN: "sw", MWI: "en", GMB: "en", RWA: "rw",
  TZA: "sw", AZE: "az", GHA: "en", TUN: "ar", BEN: "fr", PHL: "fil", UGA: "en", ARM: "hy",
  CPV: "pt", MNG: "mn", ZMB: "en", SLE: "en", ZWE: "en", MOZ: "pt", KGZ: "ky", STP: "pt",
  UZB: "uz", BFA: "fr", CUB: "es", TGO: "fr", CIV: "fr", GAB: "fr", MDG: "fr", SEN: "fr",
  DZA: "ar", IND: "hi", MRT: "ar", GNQ: "es", NER: "fr", GIN: "fr", MLI: "fr", TJK: "tg",
  TCD: "fr", COM: "ar", GNB: "pt", AGO: "pt", EGY: "ar", JOR: "ar", LBR: "en", BDI: "fr",
  CMR: "fr", CAF: "fr", HTI: "fr", VNM: "vi", BTN: "dz", KHM: "km", COG: "fr", DJI: "fr",
  LAO: "lo", COD: "fr", NGA: "en", TKM: "tk", MMR: "my", ETH: "am", LBN: "ar", SSD: "en",
  SDN: "ar", LBY: "ar", LKA: "si", ERI: "ti", IRN: "fa", PSE: "ar", BGD: "bn", PRK: "ko",
  NPL: "ne", SOM: "so", YEM: "ar", PAK: "ur", IRQ: "ar", SYR: "ar", AFG: "fa",
};

function getPassportLanguageCode(country: CountryProfile) {
  const requestedCode = passportLanguageCodeByIso3[country.iso3] ?? "en";
  return languageOptions.some((language) => language.code === requestedCode) ? requestedCode : "en";
}

function getPassportLanguagePromptCopy(languageCode: string) {
  const fallbackCode = getLanguageFallbackCode(languageCode);
  return passportLanguagePromptCopyByLanguage[languageCode]
    ?? passportLanguagePromptCopyByLanguage[fallbackCode]
    ?? passportLanguagePromptCopyByLanguage.en;
}

const generatedUiTranslations = translationData.translations as unknown as Record<string, Partial<Copy> & {
  route?: Partial<RouteCopy>;
  entry?: Partial<EntryCopy>;
}>;

export function WelcomeScreen() {
  const router = useRouter();
  const [languageCode, setLanguageCode] = useState("en");
  const [languageOpen, setLanguageOpen] = useState(false);
  const [entryLanguageOpen, setEntryLanguageOpen] = useState(false);
  const [entryTopLanguageOpen, setEntryTopLanguageOpen] = useState(false);
  const [entryOriginOpen, setEntryOriginOpen] = useState(false);
  const [entryLanguageChosen, setEntryLanguageChosen] = useState(false);
  const [languageConfirmed, setLanguageConfirmed] = useState(false);
  const [languageLoaded, setLanguageLoaded] = useState(false);
  const [languageQuery, setLanguageQuery] = useState("");
  const [entryOriginQuery, setEntryOriginQuery] = useState("");
  const [originIso, setOriginIso] = useState("");
  const [destinationIso, setDestinationIso] = useState("");
  const [passportLanguagePrompt, setPassportLanguagePrompt] = useState<PassportLanguagePrompt | null>(null);
  const languageMenuRef = useRef<HTMLDivElement>(null);
  const entryLanguageMenuRef = useRef<HTMLDivElement>(null);
  const entryTopLanguageRef = useRef<HTMLDivElement>(null);
  const entryOriginMenuRef = useRef<HTMLDivElement>(null);
  const originSelectRef = useRef<HTMLButtonElement>(null);

  const activeLanguage = languageOptions.find((language) => language.code === languageCode) ?? languageOptions[0];
  const fallbackLanguageCode = getLanguageFallbackCode(languageCode);
  const generated = generatedUiTranslations[fallbackLanguageCode];
  const copy = localizedCopyByLanguage[languageCode] ?? localizedCopyByLanguage[fallbackLanguageCode] ?? { ...localizedCopyByLanguage.en, ...generated };
  const generatedEntryCopy: Partial<EntryCopy> = generated ? {
    hello: generated.welcome,
    from: generated.route?.originQuestion,
    language: generated.language,
    continue: generated.action,
    privacy: generated.trust,
    selectCountry: generated.route?.originHint,
    searchCountries: generated.search,
    countries: generated.features?.[0]?.[1],
  } : {};
  const entryCopy = localizedEntryCopyByLanguage[languageCode] ?? localizedEntryCopyByLanguage[fallbackLanguageCode] ?? { ...localizedEntryCopyByLanguage.en, ...generatedEntryCopy };
  const routeCopy = localizedRouteCopyByLanguage[languageCode] ?? localizedRouteCopyByLanguage[fallbackLanguageCode] ?? { ...localizedRouteCopyByLanguage.en, ...(generated?.route ?? {}) };
  const entryContextCopy = localizedEntryContextCopyByLanguage[languageCode] ?? localizedEntryContextCopyByLanguage[fallbackLanguageCode] ?? {
    passport: routeCopy.originQuestion,
    abroad: entryCopy.from,
    currentLocation: entryCopy.from,
    currentLocationHint: entryCopy.selectCountry,
    clearLocation: entryCopy.continue,
  };
  const filteredLanguages = useMemo(() => {
    const query = languageQuery.trim().toLocaleLowerCase();
    if (!query) return languageOptions;
    return languageOptions.filter((language) =>
      `${language.name} ${language.native} ${language.code}`.toLocaleLowerCase().includes(query),
    );
  }, [languageQuery]);

  const filteredEntryCountries = useMemo(() => {
    const query = entryOriginQuery.trim().toLocaleLowerCase();
    return countries
      .filter((country) => {
        if (!query) return true;
        return [country.name, country.nameZh, country.iso2, country.iso3, ...country.aliases]
          .join(" ")
          .toLocaleLowerCase()
          .includes(query);
      })
      .sort((left, right) => left.name.localeCompare(right.name, "en", { sensitivity: "base" }));
  }, [entryOriginQuery]);

  const selectedOrigin = countries.find((country) => country.iso3 === originIso);
  const selectedOriginName = selectedOrigin
    ? getCountryName(selectedOrigin, languageCode)
    : "";
  const passportLanguagePromptCopy = getPassportLanguagePromptCopy(languageCode);
  const recommendedLanguage = passportLanguagePrompt
    ? languageOptions.find((language) => language.code === passportLanguagePrompt.languageCode) ?? languageOptions.find((language) => language.code === "en")
    : null;
  useEffect(() => {
    // The onboarding screen is intentionally English on every fresh entry.
    // A visitor can still choose another language before continuing.
    setLanguageLoaded(true);
  }, []);

  useEffect(() => {
    document.documentElement.lang = languageCode;
    document.documentElement.dir = activeLanguage.rtl ? "rtl" : "ltr";
    if (!languageLoaded) return;
    window.localStorage.setItem("passport-atlas-language", languageCode);
    window.dispatchEvent(new Event("passport-atlas-language-change"));
  }, [activeLanguage.rtl, languageCode, languageLoaded]);

  useEffect(() => {
    if (!passportLanguagePrompt) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [passportLanguagePrompt]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!languageMenuRef.current?.contains(event.target as Node)) setLanguageOpen(false);
      if (!entryLanguageMenuRef.current?.contains(event.target as Node)) setEntryLanguageOpen(false);
      if (!entryTopLanguageRef.current?.contains(event.target as Node)) setEntryTopLanguageOpen(false);
      if (!entryOriginMenuRef.current?.contains(event.target as Node)) setEntryOriginOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLanguageOpen(false);
        setEntryLanguageOpen(false);
        setEntryTopLanguageOpen(false);
        setEntryOriginOpen(false);
        if (passportLanguagePrompt) {
          setPassportLanguagePrompt(null);
        }
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [passportLanguagePrompt]);

  const chooseLanguage = (code: string) => {
    setLanguageCode(code);
    setLanguageOpen(false);
    setLanguageQuery("");
  };

  const chooseEntryLanguage = (code: string) => {
    setLanguageCode(code);
    setEntryLanguageOpen(false);
    setEntryTopLanguageOpen(false);
    setEntryLanguageChosen(true);
    setLanguageQuery("");
    setEntryOriginQuery("");
    if (!originIso) window.setTimeout(() => setEntryOriginOpen(true), 120);
  };

  const chooseEntryOrigin = (iso3: string) => {
    const country = countries.find((item) => item.iso3 === iso3);
    setOriginIso(iso3);
    setEntryOriginOpen(false);
    setEntryOriginQuery("");
    if (!entryLanguageChosen && country) {
      setPassportLanguagePrompt({ country, languageCode: getPassportLanguageCode(country) });
    }
  };

  const usePassportLanguage = () => {
    if (!passportLanguagePrompt) return;
    setLanguageCode(passportLanguagePrompt.languageCode);
    setEntryLanguageChosen(true);
    setEntryLanguageOpen(false);
    setEntryTopLanguageOpen(false);
    setLanguageQuery("");
    setPassportLanguagePrompt(null);
  };

  const keepCurrentLanguage = () => {
    setEntryLanguageChosen(true);
    setPassportLanguagePrompt(null);
  };

  const dismissPassportLanguagePrompt = () => {
    setPassportLanguagePrompt(null);
  };

  const confirmEntry = (nextLanguage = languageCode, nextOrigin = originIso) => {
    window.localStorage.setItem("passport-atlas-language", nextLanguage);
    if (nextOrigin) window.localStorage.setItem("passport-atlas-origin", nextOrigin);
    setLanguageConfirmed(true);
  };

  const submitRoute = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!originIso || !destinationIso) return;
    router.push(`/plan?from=${originIso}&to=${destinationIso}`);
  };

  if (!languageConfirmed) {
    return (
      <main className="entry-onboarding-page" dir={activeLanguage.rtl ? "rtl" : "ltr"}>
        <WelcomeWorldMap />

        <header className="entry-onboarding-header">
          <div className="entry-top-language" ref={entryTopLanguageRef}>
            <button
              type="button"
              onClick={() => setEntryTopLanguageOpen((open) => !open)}
              aria-haspopup="listbox"
              aria-expanded={entryTopLanguageOpen}
            >
              <Globe2 size={17} />
              <span>{activeLanguage.native}</span>
              <ChevronDown size={15} className={entryTopLanguageOpen ? "open" : ""} />
            </button>
            {entryTopLanguageOpen && (
              <section className="language-menu entry-top-language-menu" aria-label={entryCopy.language}>
                <div className="language-menu-head">
                  <span><Languages size={17} />{entryCopy.language}</span>
                  <small>{languageOptions.length}</small>
                </div>
                <label className="language-search">
                  <Search size={16} />
                  <input autoFocus value={languageQuery} onChange={(event) => setLanguageQuery(event.target.value)} placeholder={entryCopy.language} />
                </label>
                <div className="language-list" role="listbox" aria-label={entryCopy.language}>
                  {filteredLanguages.map((language) => (
                    <button key={language.code} type="button" role="option" aria-selected={language.code === languageCode} onClick={() => chooseEntryLanguage(language.code)}>
                      <span className="language-native" dir={language.rtl ? "rtl" : "ltr"}>{language.native}</span>
                      <span className="language-name">{language.name}</span>
                      <span className="language-code">{language.code.toUpperCase()}</span>
                      {language.code === languageCode && <Check size={15} />}
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>
        </header>

        <section className="entry-onboarding-content" aria-labelledby="entry-onboarding-title">
          <div className="entry-onboarding-hand" aria-hidden="true">👋</div>
          <h1 id="entry-onboarding-title">{entryCopy.hello}</h1>
          <p>{copy.welcome}</p>

          <div className="entry-onboarding-choices">
            <div className="entry-choice entry-choice-country" ref={entryOriginMenuRef}>
              <button className={`entry-choice-button${selectedOrigin ? " is-complete" : ""}`} type="button" onClick={() => setEntryOriginOpen((open) => !open)} aria-haspopup="listbox" aria-expanded={entryOriginOpen}>
                <ShieldCheck size={22} />
                <span>
                  {selectedOriginName && <small>{entryContextCopy.passport}</small>}
                  <strong>{selectedOriginName || entryContextCopy.passport}</strong>
                </span>
                {selectedOrigin ? <Check size={21} /> : <ArrowRight size={21} />}
              </button>
              {entryOriginOpen && (
                <section className="entry-choice-menu" aria-label={entryCopy.selectCountry}>
                  <label className="language-search">
                    <Search size={16} />
                    <input autoFocus value={entryOriginQuery} onChange={(event) => setEntryOriginQuery(event.target.value)} placeholder={entryCopy.searchCountries} />
                  </label>
                  <div className="entry-country-list" role="listbox" aria-label={entryCopy.selectCountry}>
                    {filteredEntryCountries.map((country) => (
                      <button key={country.iso3} type="button" role="option" aria-selected={country.iso3 === originIso} onClick={() => chooseEntryOrigin(country.iso3)}>
                        <span className="entry-country-flag">{country.flag}</span>
                        <span><strong>{getCountryName(country, languageCode)}</strong><small>{country.iso3} · {country.iso2}</small></span>
                        {country.iso3 === originIso && <Check size={16} />}
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <div className="entry-choice entry-choice-language" ref={entryLanguageMenuRef}>
              <button className={`entry-choice-button${entryLanguageChosen ? " is-complete" : ""}`} type="button" onClick={() => setEntryLanguageOpen((open) => !open)} aria-haspopup="listbox" aria-expanded={entryLanguageOpen}>
                <Languages size={22} />
                <span>
                  {entryLanguageChosen && <small>{entryCopy.language}</small>}
                  <strong>{entryLanguageChosen ? activeLanguage.native : entryCopy.language}</strong>
                </span>
                {entryLanguageChosen ? <Check size={21} /> : <ArrowRight size={21} />}
              </button>
              {entryLanguageOpen && (
                <section className="entry-choice-menu" aria-label={entryCopy.language}>
                  <label className="language-search">
                    <Search size={16} />
                    <input autoFocus value={languageQuery} onChange={(event) => setLanguageQuery(event.target.value)} placeholder={entryCopy.language} />
                  </label>
                  <div className="language-list" role="listbox" aria-label={entryCopy.language}>
                    {filteredLanguages.map((language) => (
                      <button key={language.code} type="button" role="option" aria-selected={language.code === languageCode} onClick={() => chooseEntryLanguage(language.code)}>
                        <span className="language-native" dir={language.rtl ? "rtl" : "ltr"}>{language.native}</span>
                        <span className="language-name">{language.name}</span>
                        <span className="language-code">{language.code.toUpperCase()}</span>
                        {language.code === languageCode && <Check size={15} />}
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>

          <button
            className="entry-onboarding-continue"
            type="button"
            disabled={!originIso || !entryLanguageChosen}
            onClick={() => confirmEntry()}
          >
            <span>{entryCopy.continue}</span>
            <ArrowRight size={19} />
          </button>
        </section>

        <footer className="entry-onboarding-privacy">
          <span><LockKeyhole size={14} />{entryCopy.privacy}</span>
          <small>© 2026 P1ter11. All rights reserved.</small>
        </footer>

        {passportLanguagePrompt && recommendedLanguage && (
          <div
              className="passport-language-prompt-backdrop"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) dismissPassportLanguagePrompt();
            }}
          >
            <section
              className="passport-language-prompt"
              role="dialog"
              aria-modal="true"
              aria-labelledby="passport-language-prompt-title"
              aria-describedby="passport-language-prompt-description"
            >
              <button
                className="passport-language-prompt-close"
                type="button"
                onClick={dismissPassportLanguagePrompt}
                aria-label={passportLanguagePromptCopy.close}
              >
                <X size={17} />
              </button>
              <div className="passport-language-prompt-icon" aria-hidden="true"><Languages size={20} /></div>
              <span className="passport-language-prompt-kicker">Passport Atlas</span>
              <h2 id="passport-language-prompt-title">{passportLanguagePromptCopy.title}</h2>
              <div className="passport-language-prompt-country">
                <span className="passport-language-prompt-flag" aria-hidden="true">{passportLanguagePrompt.country.flag}</span>
                <span>
                  <strong>{getCountryName(passportLanguagePrompt.country, languageCode)}</strong>
                  <small>{passportLanguagePrompt.country.iso3} · {passportLanguagePrompt.country.iso2}</small>
                </span>
              </div>
              <p id="passport-language-prompt-description">
                {formatCopy(passportLanguagePromptCopy.description, {
                  country: getCountryName(passportLanguagePrompt.country, languageCode),
                  language: recommendedLanguage.native,
                })}
              </p>
              <div className="passport-language-prompt-actions">
                <button className="passport-language-prompt-primary" type="button" onClick={usePassportLanguage}>
                  <Check size={16} />
                  <span>{passportLanguagePromptCopy.autoSelect}</span>
                </button>
                <button className="passport-language-prompt-secondary" type="button" onClick={() => keepCurrentLanguage()}>
                  <span>{passportLanguagePromptCopy.keepCurrent}</span>
                </button>
              </div>
            </section>
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="welcome-page">
      <header className="welcome-header">
        <button className="welcome-brand" type="button" aria-label="Passport Atlas">
          <span className="welcome-brand-mark"><Globe2 size={25} strokeWidth={1.7} /></span>
          <span>Passport <strong>Atlas</strong></span>
        </button>

        <div className="language-picker" ref={languageMenuRef}>
          <button
            className="language-trigger"
            type="button"
            onClick={() => setLanguageOpen((open) => !open)}
            aria-haspopup="listbox"
            aria-expanded={languageOpen}
          >
            <Globe2 size={18} />
            <span>{activeLanguage.native}</span>
            <ChevronDown size={16} className={languageOpen ? "open" : ""} />
          </button>

          {languageOpen && (
            <section className="language-menu" aria-label={copy.language}>
              <div className="language-menu-head">
                <span><Languages size={17} />{copy.language}</span>
                <small>{languageOptions.length} {copy.count}</small>
              </div>
              <label className="language-search">
                <Search size={16} />
                <input
                  autoFocus
                  value={languageQuery}
                  onChange={(event) => setLanguageQuery(event.target.value)}
                  placeholder={copy.search}
                />
              </label>
              <div className="language-list" role="listbox" aria-label={copy.language}>
                {filteredLanguages.map((language) => (
                  <button
                    key={language.code}
                    type="button"
                    role="option"
                    aria-selected={language.code === languageCode}
                    onClick={() => chooseLanguage(language.code)}
                  >
                    <span className="language-native" dir={language.rtl ? "rtl" : "ltr"}>{language.native}</span>
                    <span className="language-name">{language.name}</span>
                    <span className="language-code">{language.code.toUpperCase()}</span>
                    {language.code === languageCode && <Check size={15} />}
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      </header>

      <section className="welcome-hero" aria-labelledby="welcome-title">
        <div className="welcome-copy" dir={activeLanguage.rtl ? "rtl" : "ltr"}>
          <span className="welcome-step-label">Passport Atlas</span>
          <h1 id="welcome-title">{copy.welcome}</h1>
          <p className="welcome-body">{copy.body.map((line) => <span key={line}>{line}</span>)}</p>
          <div className="welcome-mode-switch" role="group" aria-label="Passport Atlas mode">
            <button className="active" type="button" aria-pressed="true" onClick={() => originSelectRef.current?.focus()}><Route size={16} />{routeCopy.planMode}</button>
            <button type="button" onClick={() => router.push("/explore")}><Globe2 size={16} />{routeCopy.exploreMode}</button>
          </div>
          <form className="welcome-route-form" onSubmit={submitRoute}>
            <RouteCountryPicker
              ref={originSelectRef}
              step="01"
              question={routeCopy.originQuestion}
              hint={routeCopy.originHint}
              placeholder={routeCopy.placeholder}
              searchPlaceholder={entryCopy.searchCountries}
              value={originIso}
              languageCode={languageCode}
              countries={countries}
              icon={<ShieldCheck size={18} />}
              onChange={(nextOrigin) => {
                setOriginIso(nextOrigin);
                if (nextOrigin === destinationIso) setDestinationIso("");
              }}
            />
            <span className="route-direction" aria-hidden="true"><Plane size={19} /></span>
            <RouteCountryPicker
              step="02"
              question={routeCopy.destinationQuestion}
              hint={routeCopy.destinationHint}
              placeholder={routeCopy.placeholder}
              searchPlaceholder={entryCopy.searchCountries}
              value={destinationIso}
              languageCode={languageCode}
              countries={countries}
              excludeIso3={originIso}
              icon={<MapPin size={18} />}
              onChange={setDestinationIso}
            />
            <button className="welcome-route-submit" type="submit" disabled={!originIso || !destinationIso}>
              <span>{routeCopy.submit}</span><ArrowRight size={19} />
            </button>
          </form>
          <p className="welcome-trust"><ShieldCheck size={17} /> {copy.trust}</p>
        </div>
      </section>

      <footer className="welcome-footer">© 2026 P1ter11. All rights reserved.</footer>
    </main>
  );
}
