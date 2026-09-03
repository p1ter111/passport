"use client";

import countriesData from "@/data/countries.json";
import { getCountryName, getRegionName } from "@/lib/i18n";
import type { CountryProfile } from "@/types/passport";
import { ArrowRight, Compass, Dices, ExternalLink, MapPin, RotateCcw, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { getCities } from "@/lib/country-cities";

type DestinationWheelProps = {
  languageCode: string;
  originIso?: string;
  id?: string;
};

type WheelCopy = {
  eyebrow: string;
  title: string;
  description: string;
  spin: string;
  spinning: string;
  again: string;
  ready: string;
  readyHint: string;
  pick: string;
  detail: string;
  plan: string;
  surprise: string;
  ariaLabel: string;
};

const copyByLanguage: Record<string, WheelCopy> = {
  en: {
    eyebrow: "A little serendipity",
    title: "Let the world choose your next stop",
    description: "A hand-picked circle of places worth getting curious about. Spin once and see where the atlas takes you.",
    spin: "Spin the wheel",
    spinning: "Choosing a destination…",
    again: "Spin again",
    ready: "Your next story is waiting",
    readyHint: "Tap the wheel when you are ready for a surprise.",
    pick: "Your destination",
    detail: "View passport",
    plan: "Plan this trip",
    surprise: "A random pick, just for you",
    ariaLabel: "Random destination wheel",
  },
  zh: {
    eyebrow: "给旅程一点偶然",
    title: "让世界替你选下一站",
    description: "从一组值得探索的目的地中随机抽取一个国家，给选择困难的你一点灵感。",
    spin: "转动转盘",
    spinning: "正在选择目的地…",
    again: "再转一次",
    ready: "下一段故事正在等你",
    readyHint: "准备好后点击转盘，看看这次会遇见哪里。",
    pick: "你的目的地",
    detail: "查看护照",
    plan: "规划这次旅行",
    surprise: "专属于你的随机选择",
    ariaLabel: "随机目的地转盘",
  },
  "zh-TW": {
    eyebrow: "給旅程一點偶然",
    title: "讓世界替你選下一站",
    description: "從一組值得探索的目的地中隨機抽取一個國家，給選擇困難的你一點靈感。",
    spin: "轉動轉盤",
    spinning: "正在選擇目的地…",
    again: "再轉一次",
    ready: "下一段故事正在等你",
    readyHint: "準備好後點擊轉盤，看看這次會遇見哪裡。",
    pick: "你的目的地",
    detail: "查看護照",
    plan: "規劃這次旅行",
    surprise: "專屬於你的隨機選擇",
    ariaLabel: "隨機目的地轉盤",
  },
  es: {
    eyebrow: "Un poco de azar",
    title: "Deja que el mundo elija tu proxima parada",
    description: "Un circulo de lugares seleccionados para despertar tu curiosidad. Gira y descubre a donde te lleva el atlas.",
    spin: "Girar la ruleta",
    spinning: "Eligiendo destino…",
    again: "Girar de nuevo",
    ready: "Tu proxima historia te espera",
    readyHint: "Pulsa la ruleta cuando quieras una sorpresa.",
    pick: "Tu destino",
    detail: "Ver pasaporte",
    plan: "Planificar este viaje",
    surprise: "Una eleccion al azar para ti",
    ariaLabel: "Ruleta de destinos aleatorios",
  },
  fr: {
    eyebrow: "Un peu de hasard",
    title: "Laissez le monde choisir votre prochaine etape",
    description: "Un cercle de destinations choisies pour eveiller votre curiosite. Tournez et laissez l atlas vous guider.",
    spin: "Tourner la roue",
    spinning: "Choix de la destination…",
    again: "Tourner encore",
    ready: "Votre prochaine histoire vous attend",
    readyHint: "Touchez la roue pour une surprise.",
    pick: "Votre destination",
    detail: "Voir le passeport",
    plan: "Planifier ce voyage",
    surprise: "Un choix aleatoire pour vous",
    ariaLabel: "Roue des destinations aleatoires",
  },
  de: {
    eyebrow: "Ein wenig Zufall",
    title: "Lass die Welt dein nachstes Ziel wahlen",
    description: "Eine handverlesene Auswahl an Orten, die neugierig machen. Dreh das Rad und lass dich uberraschen.",
    spin: "Rad drehen",
    spinning: "Ziel wird ausgewahlt…",
    again: "Noch einmal drehen",
    ready: "Deine nachste Geschichte wartet",
    readyHint: "Dreh das Rad fur eine Uberraschung.",
    pick: "Dein Ziel",
    detail: "Pass ansehen",
    plan: "Reise planen",
    surprise: "Eine zufallige Wahl fur dich",
    ariaLabel: "Rad fur zufallige Reiseziele",
  },
  ja: {
    eyebrow: "少しの偶然を旅に",
    title: "次の行き先を世界に選んでもらう",
    description: "好奇心をくすぐる目的地を厳選しました。回して、アトラスに次の場所を任せてみましょう。",
    spin: "ルーレットを回す",
    spinning: "行き先を選んでいます…",
    again: "もう一度回す",
    ready: "次の物語が待っています",
    readyHint: "サプライズの準備ができたらルーレットを回してください。",
    pick: "あなたの目的地",
    detail: "パスポートを見る",
    plan: "この旅を計画",
    surprise: "あなたのためのランダムな選択",
    ariaLabel: "ランダム目的地ルーレット",
  },
  ko: {
    eyebrow: "여행에 우연을 더해 보세요",
    title: "다음 목적지를 세상에 맡겨 보세요",
    description: "호기심을 자극할 여행지를 엄선했습니다. 돌려서 아틀라스가 고른 곳을 만나 보세요.",
    spin: "룰렛 돌리기",
    spinning: "목적지를 고르는 중…",
    again: "다시 돌리기",
    ready: "다음 이야기가 기다립니다",
    readyHint: "깜짝 목적지를 원할 때 룰렛을 눌러 보세요.",
    pick: "나의 목적지",
    detail: "여권 보기",
    plan: "여행 계획하기",
    surprise: "당신을 위한 랜덤 선택",
    ariaLabel: "랜덤 목적지 룰렛",
  },
  tr: {
    eyebrow: "Yolculuga biraz sans kat",
    title: "Siradaki duragini dunyaya sectir",
    description: "Merak uyandiran yerlerden secilmis bir cember. Cevir ve atlasin seni nereye goturecegini gor.",
    spin: "Carki cevir",
    spinning: "Hedef seciliyor…",
    again: "Tekrar cevir",
    ready: "Siradaki hikayen seni bekliyor",
    readyHint: "Bir surpriz icin carka dokun.",
    pick: "Hedefin",
    detail: "Pasaportu gor",
    plan: "Bu geziyi planla",
    surprise: "Sana ozel rastgele secim",
    ariaLabel: "Rastgele hedef carki",
  },
  ru: {
    eyebrow: "Немного случайности",
    title: "Пусть мир выберет следующую остановку",
    description: "Подборка мест, которые стоит открыть. Крутите колесо и узнайте, куда ведет атлас.",
    spin: "Крутить колесо",
    spinning: "Выбираем направление…",
    again: "Крутить снова",
    ready: "Ваша следующая история уже ждет",
    readyHint: "Нажмите на колесо, чтобы получить сюрприз.",
    pick: "Ваше направление",
    detail: "Открыть паспорт",
    plan: "Спланировать поездку",
    surprise: "Случайный выбор для вас",
    ariaLabel: "Колесо случайных направлений",
  },
  pt: {
    eyebrow: "Um pouco de acaso",
    title: "Deixe o mundo escolher a sua proxima parada",
    description: "Um circulo de lugares escolhidos para despertar a curiosidade. Gire e descubra para onde o atlas leva voce.",
    spin: "Girar a roleta",
    spinning: "Escolhendo destino…",
    again: "Girar novamente",
    ready: "A sua proxima historia espera por voce",
    readyHint: "Toque na roleta quando quiser uma surpresa.",
    pick: "O seu destino",
    detail: "Ver passaporte",
    plan: "Planejar esta viagem",
    surprise: "Uma escolha aleatoria para voce",
    ariaLabel: "Roleta de destinos aleatorios",
  },
  ar: {
    eyebrow: "قليل من العفوية",
    title: "دع العالم يختار محطتك القادمة",
    description: "مجموعة منتقاة من الأماكن التي تستحق الاكتشاف. أدر العجلة ودع الأطلس يرشدك.",
    spin: "أدر العجلة",
    spinning: "جار اختيار الوجهة…",
    again: "أدرها مرة أخرى",
    ready: "قصتك القادمة بانتظارك",
    readyHint: "اضغط على العجلة عندما تريد مفاجأة.",
    pick: "وجهتك",
    detail: "عرض جواز السفر",
    plan: "خطط لهذه الرحلة",
    surprise: "اختيار عشوائي لك",
    ariaLabel: "عجلة وجهات عشوائية",
  },
  hi: {
    eyebrow: "यात्रा में थोड़ा संयोग",
    title: "दुनिया को अपना अगला पड़ाव चुनने दें",
    description: "जिज्ञासा जगाने वाली जगहों का चुना हुआ संग्रह। घुमाएं और देखें एटलस आपको कहां ले जाता है।",
    spin: "चक्र घुमाएं",
    spinning: "गंतव्य चुना जा रहा है…",
    again: "फिर घुमाएं",
    ready: "आपकी अगली कहानी इंतजार कर रही है",
    readyHint: "आश्चर्य के लिए चक्र पर टैप करें।",
    pick: "आपका गंतव्य",
    detail: "पासपोर्ट देखें",
    plan: "इस यात्रा की योजना बनाएं",
    surprise: "आपके लिए एक यादृच्छिक चयन",
    ariaLabel: "यादृच्छिक गंतव्य चक्र",
  },
};

type DestinationIdea = {
  iso3: string;
  blurb: string;
  blurbEn: string;
  tone: string;
};

type WheelRegion = "all" | CountryProfile["region"];

const regionOrder: WheelRegion[] = ["all", "亚洲", "中东", "欧洲", "非洲", "北美洲", "南美洲", "大洋洲"];

const regionLabels: Record<string, Record<WheelRegion, string>> = {
  en: { all: "All regions", "亚洲": "Asia", "中东": "Middle East", "欧洲": "Europe", "非洲": "Africa", "北美洲": "North America", "南美洲": "South America", "大洋洲": "Oceania" },
  zh: { all: "全部地区", "亚洲": "亚洲", "中东": "中东", "欧洲": "欧洲", "非洲": "非洲", "北美洲": "北美洲", "南美洲": "南美洲", "大洋洲": "大洋洲" },
  "zh-TW": { all: "全部地區", "亚洲": "亞洲", "中东": "中東", "欧洲": "歐洲", "非洲": "非洲", "北美洲": "北美洲", "南美洲": "南美洲", "大洋洲": "大洋洲" },
  es: { all: "Todas", "亚洲": "Asia", "中东": "Oriente Medio", "欧洲": "Europa", "非洲": "África", "北美洲": "Norteamérica", "南美洲": "Sudamérica", "大洋洲": "Oceanía" },
  fr: { all: "Toutes", "亚洲": "Asie", "中东": "Moyen-Orient", "欧洲": "Europe", "非洲": "Afrique", "北美洲": "Amérique du Nord", "南美洲": "Amérique du Sud", "大洋洲": "Océanie" },
  de: { all: "Alle", "亚洲": "Asien", "中东": "Nahost", "欧洲": "Europa", "非洲": "Afrika", "北美洲": "Nordamerika", "南美洲": "Südamerika", "大洋洲": "Ozeanien" },
  ja: { all: "すべて", "亚洲": "アジア", "中东": "中東", "欧洲": "ヨーロッパ", "非洲": "アフリカ", "北美洲": "北米", "南美洲": "南米", "大洋洲": "オセアニア" },
  ko: { all: "전체", "亚洲": "아시아", "中东": "중동", "欧洲": "유럽", "非洲": "아프리카", "北美洲": "북아메리카", "南美洲": "남아메리카", "大洋洲": "오세아니아" },
  tr: { all: "Tümü", "亚洲": "Asya", "中东": "Orta Doğu", "欧洲": "Avrupa", "非洲": "Afrika", "北美洲": "Kuzey Amerika", "南美洲": "Güney Amerika", "大洋洲": "Okyanusya" },
  ru: { all: "Все", "亚洲": "Азия", "中东": "Ближний Восток", "欧洲": "Европа", "非洲": "Африка", "北美洲": "Северная Америка", "南美洲": "Южная Америка", "大洋洲": "Океания" },
  pt: { all: "Todas", "亚洲": "Ásia", "中东": "Oriente Médio", "欧洲": "Europa", "非洲": "África", "北美洲": "América do Norte", "南美洲": "América do Sul", "大洋洲": "Oceania" },
  ar: { all: "كل المناطق", "亚洲": "آسيا", "中东": "الشرق الأوسط", "欧洲": "أوروبا", "非洲": "أفريقيا", "北美洲": "أمريكا الشمالية", "南美洲": "أمريكا الجنوبية", "大洋洲": "أوقيانوسيا" },
  hi: { all: "सभी", "亚洲": "एशिया", "中东": "मध्य पूर्व", "欧洲": "यूरोप", "非洲": "अफ्रीका", "北美洲": "उत्तरी अमेरिका", "南美洲": "दक्षिण अमेरिका", "大洋洲": "ओशिनिया" },
};

function getRegionLabel(region: WheelRegion, languageCode: string) {
  const locale = regionLabels[languageCode] ? languageCode : languageCode.split("-")[0];
  return regionLabels[locale]?.[region] ?? regionLabels.en[region];
}

const destinationIdeas: DestinationIdea[] = [
  { iso3: "ISL", blurb: "火山、冰川与极光交汇的北大西洋岛屿。", blurbEn: "Volcanoes, glaciers and northern lights meet across the North Atlantic.", tone: "#dcefeb" },
  { iso3: "JPN", blurb: "从古老神社到未来都市，传统与创新并行。", blurbEn: "Ancient shrines and future-facing cities share the same rhythm.", tone: "#f7e3e3" },
  { iso3: "NZL", blurb: "在峡湾、星空和电影般的山谷之间呼吸。", blurbEn: "Breathe in fjords, dark skies and valleys that feel like cinema.", tone: "#dbe8f4" },
  { iso3: "PRT", blurb: "沿着大西洋海岸，遇见老城、海风与慢生活。", blurbEn: "Atlantic coastlines, tiled old towns and an easy pace of life.", tone: "#f3e7cf" },
  { iso3: "MAR", blurb: "在香料市集、撒哈拉沙丘和蓝色山城间穿行。", blurbEn: "Wander through spice markets, Sahara dunes and blue mountain towns.", tone: "#f4ded2" },
  { iso3: "BTN", blurb: "喜马拉雅山谷里的寺院、森林与幸福哲学。", blurbEn: "Himalayan valleys, cliffside monasteries and a quieter idea of happiness.", tone: "#e2e8d7" },
  { iso3: "NAM", blurb: "红色沙丘、荒野海岸与无边星空的非洲之旅。", blurbEn: "Red dunes, wild coastlines and some of Africa's clearest night skies.", tone: "#f1e0ce" },
  { iso3: "GEO", blurb: "高加索山脉、葡萄酒村庄和热情好客的餐桌。", blurbEn: "Caucasus peaks, vineyard villages and tables made for long conversations.", tone: "#e4e0f1" },
  { iso3: "IDN", blurb: "火山、珊瑚海与多元岛屿文化组成的群岛。", blurbEn: "An archipelago of volcanoes, coral seas and many island cultures.", tone: "#d9ece7" },
  { iso3: "CAN", blurb: "穿过落基山脉，在森林湖泊中寻找辽阔感。", blurbEn: "Follow the Rockies into forests, clear lakes and wide-open space.", tone: "#e0e8f3" },
  { iso3: "CHL", blurb: "从阿塔卡马沙漠一路延伸到巴塔哥尼亚冰原。", blurbEn: "Travel from the Atacama desert to the ice fields of Patagonia.", tone: "#e5e0ef" },
  { iso3: "KEN", blurb: "草原日出、野生动物和印度洋海岸的多重风景。", blurbEn: "Savannah sunrises, wildlife encounters and an Indian Ocean coast.", tone: "#e7ead7" },
  { iso3: "GRC", blurb: "爱琴海蓝色岛屿、古典遗迹与漫长的晚餐。", blurbEn: "Aegean-blue islands, classical ruins and dinners that stretch into night.", tone: "#dce9f1" },
  { iso3: "VNM", blurb: "石灰岩海湾、街头小吃与从北到南的丰富地貌。", blurbEn: "Limestone bays, street food and a vivid journey from north to south.", tone: "#e1ecd9" },
  { iso3: "TUR", blurb: "横跨欧亚大陆，在清真寺、集市和热气球间漫游。", blurbEn: "Cross two continents between mosques, bazaars and Cappadocia skies.", tone: "#f0dedc" },
  { iso3: "FJI", blurb: "清澈泻湖、珊瑚礁与南太平洋岛屿的松弛节奏。", blurbEn: "Clear lagoons, coral reefs and the unhurried pulse of the South Pacific.", tone: "#d8edf0" },
  { iso3: "ITA", blurb: "在文艺复兴城市、山间村庄与地中海海岸之间漫游。", blurbEn: "Wander from Renaissance cities to mountain villages and Mediterranean shores.", tone: "#e2eadf" },
  { iso3: "ESP", blurb: "建筑、弗拉明戈和海岸小城组成的热烈旅程。", blurbEn: "A vibrant journey of bold architecture, flamenco and coastal towns.", tone: "#f0e3cc" },
  { iso3: "NOR", blurb: "峡湾、午夜阳光和北方小镇的宁静辽阔。", blurbEn: "Fjords, midnight sun and the quiet scale of northern towns.", tone: "#dce7f0" },
  { iso3: "EGY", blurb: "尼罗河、古老文明与红海潜水的时间旅行。", blurbEn: "A journey through Nile nights, ancient history and Red Sea reefs.", tone: "#efe4ce" },
  { iso3: "ZAF", blurb: "从开普敦海岸到野生动物保护区的多彩南非。", blurbEn: "Cape Town coastlines, mountain roads and unforgettable wildlife reserves.", tone: "#e5ead8" },
  { iso3: "BRA", blurb: "热带雨林、音乐节奏和漫长海岸线的南美能量。", blurbEn: "Rainforest, rhythm and a long coastline full of Brazilian energy.", tone: "#d9ead8" },
  { iso3: "THA", blurb: "金色寺庙、热闹街巷与安达曼海的岛屿时光。", blurbEn: "Golden temples, lively streets and slow island days on the Andaman Sea.", tone: "#f2dfd9" },
  { iso3: "MNG", blurb: "草原、戈壁与牧民营地构成的辽阔远方。", blurbEn: "Open steppe, Gobi horizons and nights in a nomad camp.", tone: "#e1e4ed" },
];

const countries = countriesData as CountryProfile[];

const localizedBlurbByLanguage: Record<string, string> = {
  es: "Paisajes, sabores y culturas para descubrir con calma.",
  fr: "Des paysages, des saveurs et des cultures a decouvrir.",
  de: "Landschaften, Aromen und Kulturen zum Entdecken.",
  ja: "風景、味、文化をゆっくり楽しめる場所です。",
  ko: "풍경과 맛, 문화를 천천히 발견할 수 있는 곳입니다.",
  tr: "Manzaralar, tatlar ve kulturler kesfedilmeyi bekliyor.",
  ru: "Пейзажи, вкусы и культуры, которые стоит открыть.",
  pt: "Paisagens, sabores e culturas para descobrir sem pressa.",
  ar: "مناظر ونكهات وثقافات تستحق الاكتشاف بهدوء.",
  hi: "दृश्य, स्वाद और संस्कृतियां जिन्हें आराम से खोजा जा सकता है।",
};

const cityCopyByLanguage: Record<string, { heading: string; hint: string }> = {
  en: { heading: "Popular cities", hint: "Choose a city to make the trip yours" },
  zh: { heading: "热门旅游城市", hint: "选择一座城市，开始细化你的旅程" },
  "zh-TW": { heading: "熱門旅遊城市", hint: "選擇一座城市，開始細化你的旅程" },
  es: { heading: "Ciudades populares", hint: "Elige una ciudad para personalizar tu viaje" },
  fr: { heading: "Villes populaires", hint: "Choisissez une ville pour personnaliser votre voyage" },
  de: { heading: "Beliebte Städte", hint: "Wähle eine Stadt für deine Reise" },
  ja: { heading: "人気の都市", hint: "旅の目的地となる都市を選んでください" },
  ko: { heading: "인기 도시", hint: "여행을 구체화할 도시를 선택하세요" },
  tr: { heading: "Popüler şehirler", hint: "Seyahatinizi kişiselleştirmek için bir şehir seçin" },
  ru: { heading: "Популярные города", hint: "Выберите город для своей поездки" },
  pt: { heading: "Cidades populares", hint: "Escolha uma cidade para personalizar a viagem" },
  ar: { heading: "مدن شهيرة", hint: "اختر مدينة لتخصيص رحلتك" },
  hi: { heading: "लोकप्रिय शहर", hint: "यात्रा को अपना बनाने के लिए शहर चुनें" },
};

function getCityCopy(languageCode: string) {
  return cityCopyByLanguage[languageCode] ?? cityCopyByLanguage[languageCode.split("-")[0]] ?? cityCopyByLanguage.en;
}

function getCopy(languageCode: string) {
  return copyByLanguage[languageCode]
    ?? copyByLanguage[languageCode.split("-")[0]]
    ?? copyByLanguage.en;
}

export function DestinationWheel({ languageCode, originIso, id }: DestinationWheelProps) {
  const router = useRouter();
  const copy = getCopy(languageCode);
  const allDestinations = useMemo(
    () => destinationIdeas.map((idea) => ({ ...idea, country: countries.find((country) => country.iso3 === idea.iso3) })).filter((item): item is typeof item & { country: CountryProfile } => Boolean(item.country)),
    [],
  );
  const [region, setRegion] = useState<WheelRegion>("all");
  const destinations = useMemo(
    () => region === "all" ? allDestinations : allDestinations.filter(({ country }) => country.region === region),
    [allDestinations, region],
  );
  const availableRegions = useMemo(
    () => regionOrder.filter((option) => option === "all" || allDestinations.some(({ country }) => country.region === option)),
    [allDestinations],
  );
  const [rotation, setRotation] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedCity, setSelectedCity] = useState("");
  const timerRef = useRef<number | null>(null);
  const sectorAngle = destinations.length ? 360 / destinations.length : 360;
  const selected = selectedIndex === null ? null : destinations[selectedIndex];
  const wheelBackground = `conic-gradient(from -90deg, ${destinations.map(({ tone }, index) => `${tone} ${index * sectorAngle}deg ${(index + 1) * sectorAngle}deg`).join(", ")})`;

  useEffect(() => () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    setSelectedIndex(null);
    setSelectedCity("");
    setIsSpinning(false);
    setRotation(0);
  }, [region]);

  useEffect(() => {
    if (!selected) {
      setSelectedCity("");
      return;
    }
    setSelectedCity(getCities(selected.country)[0] ?? selected.country.name);
  }, [selected]);

  const spin = () => {
    if (isSpinning || destinations.length === 0) return;
    const nextIndex = selectedIndex === null || destinations.length === 1
      ? Math.floor(Math.random() * destinations.length)
      : (selectedIndex + 1 + Math.floor(Math.random() * (destinations.length - 1))) % destinations.length;
    const currentMod = ((rotation % 360) + 360) % 360;
    const targetMod = -((nextIndex + 0.5) * sectorAngle);
    const deltaToTarget = (targetMod - currentMod + 360) % 360;
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1350;
    setIsSpinning(true);
    setSelectedIndex(null);
    setRotation(rotation + 1440 + deltaToTarget);
    timerRef.current = window.setTimeout(() => {
      setSelectedIndex(nextIndex);
      setIsSpinning(false);
    }, duration || 20);
  };

  const countryName = selected ? getCountryName(selected.country, languageCode) : "";
  const localeRoot = languageCode.split("-")[0];
  const selectedBlurb = selected
    ? languageCode === "zh" || languageCode === "zh-TW"
      ? selected.blurb
      : languageCode === "en"
        ? selected.blurbEn
        : `${countryName}: ${localizedBlurbByLanguage[localeRoot] ?? copy.description}`
    : "";
  const selectedCities = selected ? getCities(selected.country) : [];
  const isChinese = languageCode === "zh" || languageCode === "zh-TW";
  const cityCopy = getCityCopy(languageCode);
  const planQuery = selected ? new URLSearchParams({ ...(originIso ? { from: originIso } : {}), to: selected.country.iso3, ...(selectedCity ? { city: selectedCity } : {}) }).toString() : "";
  const planHref = selected ? `/plan?${planQuery}` : "#";

  return (
    <section id={id} className="destination-wheel-section" aria-labelledby="destination-wheel-title">
      <div className="destination-wheel-intro">
        <span className="destination-wheel-eyebrow"><Sparkles size={14} />{copy.eyebrow}</span>
        <h2 id="destination-wheel-title">{copy.title}</h2>
        <p>{copy.description}</p>
        <div className="destination-wheel-note"><Compass size={15} /><span>{copy.surprise}</span></div>
      </div>

      <div className="destination-wheel-regions" role="tablist" aria-label={isChinese ? (languageCode === "zh-TW" ? "依大洲篩選" : "按大洲筛选") : "Filter by continent"}>
        {availableRegions.map((option) => (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={region === option}
            className={region === option ? "is-active" : ""}
            onClick={() => setRegion(option)}
          >
            {getRegionLabel(option, languageCode)}
            {option !== "all" && <small>{allDestinations.filter(({ country }) => country.region === option).length}</small>}
          </button>
        ))}
      </div>

      <div className="destination-wheel-layout">
        <div className="destination-wheel-stage">
          <span className="destination-wheel-pointer" aria-hidden="true" />
          <div
            className={`destination-wheel${isSpinning ? " is-spinning" : ""}`}
            role="button"
            tabIndex={isSpinning ? -1 : 0}
            aria-label={isSpinning ? copy.spinning : copy.ariaLabel}
            aria-disabled={isSpinning}
            onClick={spin}
            onKeyDown={(event) => {
              if ((event.key === "Enter" || event.key === " ") && !isSpinning) {
                event.preventDefault();
                spin();
              }
            }}
            style={{ background: wheelBackground, transform: `rotate(${rotation}deg)` }}
          >
            {destinations.map(({ country }, index) => {
              const angle = index * sectorAngle + sectorAngle / 2;
              return (
                <span
                  className="destination-wheel-label"
                  key={country.iso3}
                  style={{ transform: `rotate(${angle}deg) translateY(-130px) rotate(${-angle - rotation}deg)` }}
                >
                  <span>{country.flag}</span>
                  <strong>{getCountryName(country, languageCode)}</strong>
                </span>
              );
            })}
            <span className="destination-wheel-hub" aria-hidden="true"><Dices size={25} /></span>
          </div>
          <button className="destination-wheel-spin" type="button" onClick={spin} disabled={isSpinning}>
            <Dices size={17} />
            <span>{isSpinning ? copy.spinning : selected ? copy.again : copy.spin}</span>
          </button>
        </div>

        <div className={`destination-wheel-result${selected ? " has-result" : ""}`} aria-live="polite">
          {selected ? (
            <>
              <span className="destination-wheel-result-kicker">{copy.pick}</span>
              <div className="destination-wheel-result-heading">
                <span className="destination-wheel-result-flag" aria-hidden="true">{selected.country.flag}</span>
                  <div><h3>{countryName}</h3><span>{getRegionName(selected.country.region, languageCode)}</span></div>
              </div>
              <p>{selectedBlurb}</p>
              <div className="destination-wheel-cities">
                <div className="destination-wheel-cities-heading"><span><MapPin size={14} />{cityCopy.heading}</span><small>{cityCopy.hint}</small></div>
                <div className="destination-wheel-city-list">
                  {selectedCities.map((city) => (
                    <button key={city} type="button" className={selectedCity === city ? "is-selected" : ""} onClick={() => setSelectedCity(city)}>
                      <MapPin size={13} />{city}
                    </button>
                  ))}
                </div>
              </div>
              <div className="destination-wheel-result-stats">
                <span><strong>{selected.country.visaFreeCountries}</strong> <small>{languageCode === "zh" || languageCode === "zh-TW" ? "免签目的地" : "visa-free destinations"}</small></span>
                <span><strong>{selected.country.freedomScore}%</strong> <small>{languageCode === "zh" || languageCode === "zh-TW" ? "旅行自由度" : "travel freedom"}</small></span>
              </div>
              <div className="destination-wheel-actions">
                <button type="button" onClick={() => router.push(`/passport/${selected.country.iso3.toLowerCase()}`)}><ExternalLink size={15} />{copy.detail}</button>
                <button type="button" onClick={() => router.push(planHref)}><ArrowRight size={15} />{copy.plan}</button>
              </div>
            </>
          ) : (
            <>
              <span className="destination-wheel-result-kicker"><RotateCcw size={14} />{copy.ready}</span>
              <h3>{copy.readyHint}</h3>
              <p>{copy.description}</p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
