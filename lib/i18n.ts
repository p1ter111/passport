import translationData from "@/data/ui-translations.json";
import countryNamesData from "@/data/country-names.json";
import type { CountryProfile } from "@/types/passport";

type TranslationSection = Record<string, string>;

type TranslationPack = {
  titleTop?: string;
  titleBottom?: string;
  welcome?: string;
  body?: string[];
  action?: string;
  trust?: string;
  language?: string;
  search?: string;
  features?: Array<[string, string]>;
  route?: Record<string, string>;
  app?: TranslationSection;
};

const data = translationData as unknown as {
  source?: TranslationPack;
  translations: Record<string, TranslationPack>;
  failures?: string[];
};
const localizedCountryNames = countryNamesData as Record<string, Record<string, string>>;

const english: TranslationSection = {
  ...(data.source?.app ?? {}),
  zoomControls: "Map zoom",
  zoomIn: "Zoom in",
  zoomOut: "Zoom out",
  myList: "My list",
  addFavorite: "Add to favorites",
  removeFavorite: "Remove from favorites",
  dataUpdated: "Visa data snapshot: 17 February 2026",
  evidenceLevel: "Reference confidence",
  evidenceReference: "Reference dataset - official verification required",
  verifyOfficial: "Verify with official sources",
  openIata: "Open IATA Travel Centre",
  findOfficial: "Find destination authority",
  travelPurpose: "Travel purpose",
  purposeTourism: "Tourism",
  purposeBusiness: "Business",
  purposeStudy: "Study",
  purposeVisit: "Visit family or friends",
  transitRoute: "Transit country or region",
  directRoute: "Direct or no transit",
  selectTransit: "Select transit country",
  saveRoute: "Save route",
  routeSaved: "Route saved",
  currentlyIn: "Currently in {country}",
  residenceVisaNotice: "Embassy jurisdiction and application documents may depend on your residence or legal status in this country.",
  boardingPass: "Boarding pass",
  boardingPassTitle: "Make this journey official",
  boardingPassIntro: "Choose your departure and arrival cities, then slide the pass through the gate.",
  fromCity: "From city",
  toCity: "To city",
  selectCity: "Select a city",
  passenger: "Passenger",
  flight: "Flight",
  gate: "Gate",
  seat: "Seat",
  boardingDate: "Departure",
  swipeToBoard: "Swipe right to board",
  boardingSuccess: "Boarding confirmed",
  journeyConfirmed: "Journey confirmed",
  confirmBoardingPass: "Confirm boarding pass",
  editCities: "Edit cities",
  boardingPassHint: "Drag the pass to the right edge",
  boardingPassDemo: "Planning preview · not a booked airline ticket",
  visaSnapshot: "Visa data snapshot",
  visaSource: "Source",
  visaRefreshCadence: "Recommended review: every 3 days - mark stale after 7 days",
  visaNeedsReview: "Needs fresh verification",
  visaReferenceOnly: "Reference data - official verification required",
  lastChecked: "Last route search",
  notCheckedYet: "Not checked for this route yet",
  searchLatestVisa: "Search latest visa requirements",
  passportHistory: "Passport archive",
  passportHistoryTitle: "edition history",
  passportHistoryIntro: "Compare each era's cover structure and the changes to design, identity, security and international standards.",
  passportHistoryNote: "199 countries covered · current cover verified · historical covers reconstructed",
  currentEdition: "Current reference",
  referenceEdition: "Historical reference",
  historyReference: "Global passport technology milestone",
  historyReconstruction: "Visual reconstruction · verify official archive",
  historyReconstructedImage: "Reconstructed cover",
  historyVerifiedImage: "Verified current image",
  historyStageReference: "Global technology-stage reference · exact national issue dates require official verification",
  historyImageSource: "Image source",
  historyChanges: "What changed",
  historyDesign: "Cover design",
  historySecurity: "Security",
  historyIdentity: "Identity data",
  historyStandards: "Standards",
  archiveEdition: "ARCHIVE EDITION",
  historyDisclaimer: "Historical issue years and cover designs vary by country; entries marked reconstruction are reference visuals.",
  historyMachineReadableTitle: "Machine-readable era",
  historyMachineReadableDescription: "Reconstructed view of the transition from traditional booklets to international machine-readable documents.",
  historyMachineDesign: "Formal state title, a prominent national seal and a traditional centered composition.",
  historyMachineSecurity: "Printed guilloche patterns and laminated identity pages became common safeguards.",
  historyMachineIdentity: "Printed personal data began moving toward a two-line machine-readable zone.",
  historyMachineStandards: "This stage reflects the international adoption of ICAO machine-readable travel document standards.",
  historyEpassportTitle: "First ePassport generation",
  historyEpassportDescription: "Reconstructed early electronic-passport cover with the international chip mark and a revised hierarchy.",
  historyEpassportDesign: "The contactless-chip symbol appeared and the cover hierarchy was reorganized around the national emblem.",
  historyEpassportSecurity: "A contactless chip and digital signatures added electronic authenticity checks.",
  historyEpassportIdentity: "Core identity fields and the facial image could be stored electronically.",
  historyEpassportStandards: "The document moved toward ICAO eMRTD and public-key verification standards.",
  historyBiometricTitle: "Biometric redesign",
  historyBiometricDescription: "Reconstructed later-generation biometric edition with modern typography, motifs and security cues.",
  historyBiometricDesign: "Cleaner typography, national motifs and a more restrained modern cover layout were introduced.",
  historyBiometricSecurity: "Optically variable printing, laser features and stronger chip authentication continued to evolve.",
  historyBiometricIdentity: "Facial biometrics became standard while data-page materials and integration improved.",
  historyBiometricStandards: "Later ePassport generations strengthened interoperability and inspection-system security.",
  historyCurrentTitle: "Current reference edition",
  historyCurrentDescription: "The passport cover shown in the current reference collection.",
  historyCurrentDesign: "The verified cover image in the current Passport Atlas reference collection is shown.",
  historyCurrentSecurity: "Current security features vary by national series and are intentionally not inferred from the cover.",
  historyCurrentIdentity: "Identity-page materials and biometric fields depend on the active issuing series.",
  historyCurrentStandards: "Check the issuing authority for exact series dates, features and validity rules.",
};

const chinese: TranslationSection = {
  explore: "探索", rankings: "护照排名", compare: "对比", insights: "数据洞察", search: "搜索", login: "登录",
  mainNavigation: "主导航", mobileNavigation: "移动端导航", closeNavigation: "关闭导航菜单", openNavigation: "打开导航菜单",
  zoomControls: "地图缩放", zoomIn: "放大地图", zoomOut: "缩小地图",
  heroTop: "一本护照", heroBottom: "连接世界", heroBody: "实时探索全球旅行自由度，发现你的下一段旅程。",
  searchPlaceholder: "搜索国家或护照，例如：日本", countries: "国家和地区", passports: "本护照", destinations: "免预签目的地",
  flat: "平面", high: "高自由度", moderate: "较高", limited: "中等", restricted: "受限制", strength: "护照实力",
  globalRank: "全球排名", visaFree: "免预签通行", visaOnArrival: "落地签", eta: "电子许可", eVisa: "电子签", visaRequired: "需要签证", noAdmission: "暂不准入",
  details: "查看护照", travelFreedom: "旅行自由度", travelPlanner: "旅行规划", disclaimer: "签证和入境政策可能随时调整，出行前请以目的地官方信息为准。",
  compareTitle: "护照对比", close: "关闭", tripCheck: "旅行核验", plannerTitle: "旅行规划", myPassport: "我的护照", destination: "目的地",
  verifyPolicy: "需要核验最新政策", officialSource: "请以目的地政府发布的最新入境信息为准。", signIn: "登录 Passport Atlas", email: "邮箱", continue: "继续", pending: "资料更新中",
  noResult: "暂未找到该护照，请尝试其他国家名称。", emptySearch: "请输入国家名称。", loadingMap: "正在加载世界地图...", loadingGlobe: "正在构建 3D 地球...",
  globalMobilityIntelligence: "全球出行数据", globalFreedomMap: "全球自由度地图", mobilityIndex: "2026 出行指数", platformOverview: "平台数据概览", mapDisplayMode: "地图显示模式", passportFreedomLegend: "护照自由度图例", viewDetails: "查看详情", comparisonResults: "护照对比结果", accountReady: "账户入口已完成演示", accountDescription: "正式环境接入认证服务后即可发送登录链接。",
  rankingHero: "全球护照排名", rankingIntro: "比较全球护照通行能力、免签目的地与旅行自由度。", leadingRank: "最高排名", averageFreedom: "平均自由度", region: "地区", allRegions: "全部地区", results: "本护照", updated: "Henley 2026 年 7 月通行数据", rank: "排名", passport: "护照", freedom: "自由度", destinationCount: "个目的地", empty: "没有找到护照", emptyHint: "请尝试其他国家名称或地区。", backToMap: "返回地图", globalMobilityDatabase: "全球出行数据库", rankingOverview: "排行榜数据概览", globalPassportRanking: "全球护照排行榜", clearSearch: "清除搜索", sortRanking: "排行榜排序方式", view: "查看", home: "首页", compareTool: "对比工具", backWorldMap: "返回世界地图",
  passportTitle: "{country}护照", passportIntro: "探索{country}护照、入境通行范围以及全球目的地签证要求。", coverReference: "实物封面参考图", editionsVary: "不同签发年份可能有差异", passportHistory: "护照档案", passportHistoryTitle: "的版本演变", passportHistoryIntro: "对比每个阶段的封面结构，以及设计、身份信息、安全技术和国际标准的变化。", passportHistoryNote: "覆盖全部 199 个国家和地区 · 当前封面已核验 · 历史封面为重建", currentEdition: "当前参考版本", referenceEdition: "历史参考", historyReference: "全球护照技术演变参考", historyReconstruction: "视觉重建 · 请核验官方档案", historyReconstructedImage: "历史重建封面", historyVerifiedImage: "已核验当前图片", historyStageReference: "全球技术阶段参考 · 该国确切签发年份需以官方档案为准", historyImageSource: "图片来源", historyChanges: "本版变化", historyDesign: "封面设计", historySecurity: "安全技术", historyIdentity: "身份信息", historyStandards: "国际标准", archiveEdition: "历史版本", historyDisclaimer: "历史签发年份和封面设计因国家而异，标注“历史重建封面”的条目不是官方档案图片；当前图片可通过来源链接核验。", historyMachineReadableTitle: "机读护照时代", historyMachineReadableDescription: "传统护照向国际机读旅行证件过渡阶段的视觉重建。", historyMachineDesign: "正式国名、醒目的国家徽记和传统居中排版成为封面核心。", historyMachineSecurity: "复杂底纹与覆膜身份资料页逐渐成为常见防伪措施。", historyMachineIdentity: "印刷式个人资料开始加入两行机读区。", historyMachineStandards: "此阶段对应 ICAO 机读旅行证件标准在全球逐步采用。", historyEpassportTitle: "第一代电子护照", historyEpassportDescription: "带有国际芯片标志和新版信息层级的早期电子护照视觉重建。", historyEpassportDesign: "封面加入非接触芯片标志，并围绕国家徽记重新组织信息层级。", historyEpassportSecurity: "非接触芯片和数字签名让证件能够进行电子真伪验证。", historyEpassportIdentity: "核心身份字段与人像可以存储在电子芯片中。", historyEpassportStandards: "证件开始采用 ICAO 电子机读旅行证件与公钥验证标准。", historyBiometricTitle: "生物识别重新设计", historyBiometricDescription: "采用现代字体、国家纹样和新安全标识的后期生物识别版本视觉重建。", historyBiometricDesign: "更简洁的字体、国家纹样和克制的现代封面排版逐渐出现。", historyBiometricSecurity: "光学可变印刷、激光特征与更强的芯片验证持续升级。", historyBiometricIdentity: "人脸生物识别成为标准，资料页材料与整合方式继续改进。", historyBiometricStandards: "后续电子护照强化了全球互操作性和查验系统安全。", historyCurrentTitle: "当前参考版本", historyCurrentDescription: "当前参考资料库中已核验来源的护照封面。", historyCurrentDesign: "展示 Passport Atlas 当前资料库中已核验来源的实物封面图片。", historyCurrentSecurity: "各国当前版本的安全特征不同，本平台不会仅根据封面进行推断。", historyCurrentIdentity: "资料页材料和生物识别字段取决于该国正在签发的具体版本。", historyCurrentStandards: "确切版本日期、功能和有效规则请向该国签发机构核验。", henleyStamp: "Henley 排名：2026 年 7 月", matrixStamp: "签证矩阵更新于 2026 年 2 月", globalPassportRank: "全球通行排名", accessible: "免预签通行", onArrival: "落地签", matrixAccess: "矩阵通行总数", globalAccess: "全球通行", passportAccessMap: "{country}护照全球通行地图", mapIntro: "签发地以深灰色标记，其他目的地按入境政策分类。", switchPassport: "切换护照", visaLegend: "签证状态图例", passportCountry: "护照签发地", allDestinations: "全部目的地", noData: "暂无数据", passportCountryTitle: "{country}护照签发地", originDescription: "这是该护照的签发国家或地区。", visaFreeDays: "免签停留最多 {days} 天", visaFreeDescription: "可免签入境，停留期限请核验官方政策。", arrivalDays: "抵达后办理签证，通常可停留 {days} 天", arrivalDescription: "可在抵达口岸办理签证。", etaDescription: "出发前需完成电子旅行许可申请。", eVisaDescription: "出发前需在线申请电子签证。", visaRequiredDescription: "出发前需向使领馆或签证中心申请签证。", noAdmissionDescription: "普通护照持有人目前可能无法入境。", unknownDescription: "暂未收录该目的地的签证政策。", days: "天", policyNotice: "签证规则可能随外交政策、旅行目的和停留时间变化，请在购票前核验官方要求。", destinationKicker: "目的地", destinationVisaList: "目的地签证清单", searchDestinations: "搜索目的地", filterVisaStatus: "按签证状态筛选", destinationVisaInfo: "目的地签证信息", emptyDestinations: "没有匹配的目的地", sourceNote: "数据来源：passport-index-data（MIT）。签证政策仅供参考，请以目的地官方信息为准。", backHome: "返回首页",
  regionAsia: "亚洲", regionEurope: "欧洲", regionAfrica: "非洲", regionNorthAmerica: "北美洲", regionSouthAmerica: "南美洲", regionOceania: "大洋洲",
  myList: "我的列表", addFavorite: "收藏护照", removeFavorite: "取消收藏", dataUpdated: "签证数据快照：2026 年 2 月 17 日",
  evidenceLevel: "数据可信度", evidenceReference: "参考数据 · 需通过官方渠道再次核验", verifyOfficial: "核验官方政策",
  openIata: "打开 IATA 旅行中心", findOfficial: "查找目的地官方机构", travelPurpose: "旅行目的", purposeTourism: "旅游",
  purposeBusiness: "商务", purposeStudy: "学习", purposeVisit: "探亲访友", transitRoute: "中转国家或地区", directRoute: "直达或无需中转",
  selectTransit: "选择中转国家", saveRoute: "保存路线", routeSaved: "路线已保存",
  currentlyIn: "目前在{country}", residenceVisaNotice: "使领馆受理辖区和申请材料可能取决于你在当前国家的居留或合法停留身份。",
  boardingPass: "登机牌", boardingPassTitle: "让这段旅程正式启程", boardingPassIntro: "选择出发和抵达城市，然后将登机牌向右滑过闸机。", fromCity: "出发城市", toCity: "抵达城市", selectCity: "选择城市", passenger: "旅客", flight: "航班", gate: "登机口", seat: "座位", boardingDate: "出发日期", swipeToBoard: "向右滑动登机", boardingSuccess: "登机确认成功", journeyConfirmed: "旅程已确认", confirmBoardingPass: "确认登机牌", editCities: "修改城市", boardingPassHint: "将登机牌拖到右侧终点", boardingPassDemo: "旅行规划预览 · 不代表已购票",
  visaSnapshot: "签证数据快照", visaSource: "数据来源", visaRefreshCadence: "建议每 3 天复查 · 超过 7 天标记为过期", visaNeedsReview: "需要重新核验", visaReferenceOnly: "参考数据 · 必须通过官方渠道核验", lastChecked: "本路线上次搜索", notCheckedYet: "本路线尚未搜索", searchLatestVisa: "搜索最新签证要求",
};

// Keep Traditional Chinese as a real locale while sharing the maintained
// Chinese copy. The character map covers the product vocabulary and avoids
// relying on the user's operating-system locale for conversion.
const simplifiedToTraditional: Record<string, string> = Object.fromEntries(
  [
    ["护", "護"], ["连", "連"], ["实", "實"], ["时", "時"], ["现", "現"], ["发", "發"], ["规", "規"], ["则", "則"],
    ["准", "準"], ["备", "備"], ["权", "權"], ["开", "開"], ["机", "機"], ["构", "構"], ["续", "續"], ["较", "較"],
    ["国", "國"], ["区", "區"], ["种", "種"], ["语", "語"], ["签", "簽"], ["进", "進"], ["详", "詳"], ["细", "細"],
    ["统", "統"], ["计", "計"], ["领", "領"], ["选", "選"], ["择", "擇"], ["标", "標"], ["证", "證"], ["级", "級"],
    ["询", "詢"], ["数", "數"], ["据", "據"], ["游", "遊"], ["划", "劃"], ["这", "這"], ["么", "麼"], ["问", "問"],
    ["题", "題"], ["欢", "歡"], ["迎", "迎"], ["关", "關"], ["于", "於"], ["联", "聯"], ["系", "係"], ["情", "情"],
    ["电", "電"], ["许", "許"], ["请", "請"], ["预", "預"], ["办", "辦"], ["来", "來"], ["仅", "僅"], ["参", "參"],
    ["颜", "顏"], ["图", "圖"], ["绿", "綠"], ["黄", "黃"], ["红", "紅"], ["轻", "輕"], ["阴", "陰"], ["显", "顯"],
    ["动", "動"], ["并", "並"], ["钮", "鈕"], ["闭", "閉"], ["单", "單"], ["页", "頁"], ["载", "載"], ["复", "複"],
    ["杂", "雜"], ["过", "過"], ["滤", "濾"], ["结", "結"], ["处", "處"], ["际", "際"], ["专", "專"], ["业", "業"],
    ["产", "產"], ["体", "體"], ["验", "驗"], ["质", "質"], ["设", "設"], ["风", "風"], ["简", "簡"], ["洁", "潔"],
    ["译", "譯"], ["说", "說"], ["读", "讀"], ["写", "寫"], ["记", "記"], ["忆", "憶"], ["访", "訪"], ["账", "賬"],
    ["户", "戶"], ["录", "錄"], ["个", "個"], ["万", "萬"], ["为", "為"], ["与", "與"], ["并", "並"], ["内", "內"],
    ["从", "從"], ["给", "給"], ["会", "會"], ["应", "應"], ["将", "將"], ["进", "進"], ["还", "還"], ["这", "這"],
    ["们", "們"], ["帮", "幫"], ["哪", "哪"], ["里", "裡"], ["见", "見"], ["无", "無"], ["广", "廣"], ["范", "範"],
    ["围", "圍"], ["华", "華"], ["东", "東"], ["亚", "亞"], ["欧", "歐"], ["运", "運"], ["获", "獲"], ["几", "幾"],
    ["对", "對"], ["术", "術"], ["类", "類"], ["别", "別"], ["条", "條"], ["资", "資"], ["递", "遞"], ["审", "審"],
    ["视", "視"], ["频", "頻"], ["务", "務"], ["变", "變"], ["馆", "館"], ["门", "門"], ["项", "項"], ["错", "錯"],
    ["误", "誤"], ["线", "線"], ["远", "遠"], ["当", "當"], ["长", "長"], ["须", "須"], ["尽", "盡"], ["扩", "擴"],
    ["缩", "縮"], ["环", "環"], ["境", "境"], ["须", "須"], ["状", "狀"], ["态", "態"], ["严", "嚴"], ["谨", "謹"],
    ["网", "網"], ["络", "絡"], ["实", "實"], ["际", "際"], ["专", "專"], ["属", "屬"], ["页", "頁"], ["询", "詢"],
    ["继", "繼"], ["隐", "隱"], ["线", "線"], ["创", "創"], ["爱", "愛"], ["护", "護"], ["维", "維"], ["护", "護"],
  ],
);

const traditionalCharacterPattern = new RegExp(`[${Object.keys(simplifiedToTraditional).join("")}]`, "g");

export function toTraditional(value: string) {
  return value.replace(traditionalCharacterPattern, (character) => simplifiedToTraditional[character] ?? character);
}

export function toTraditionalDeep<T>(value: T): T {
  if (typeof value === "string") return toTraditional(value) as T;
  if (Array.isArray(value)) return value.map((item) => toTraditionalDeep(item)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, toTraditionalDeep(item)])) as T;
  }
  return value;
}

const traditionalChinese = toTraditionalDeep(chinese);

const manualPacks: Record<string, TranslationPack> = {
  es: { titleTop: "Explora tu pasaporte,", titleBottom: "conecta el mundo", body: ["Descubre adonde te lleva tu pasaporte,", "los requisitos de entrada y como preparar tu proximo viaje."], action: "Empezar a explorar", trust: "Datos publicos de fuentes oficiales, actualizados continuamente", language: "Idioma", search: "Buscar idiomas", route: { planMode: "Planificar mi viaje", exploreMode: "Explorar pasaportes", originQuestion: "¿Que pasaporte tienes?", originHint: "Selecciona el pais de tu pasaporte", destinationQuestion: "¿A donde quieres ir?", destinationHint: "Selecciona tu destino", placeholder: "Elige un pais o region", submit: "Ver mi plan de visado" } },
  fr: { titleTop: "Explorez votre passeport,", titleBottom: "connectez le monde", body: ["Decouvrez ou votre passeport vous mene,", "les conditions d'entree et la preparation de votre voyage."], action: "Commencer l'exploration", trust: "Donnees publiques de sources officielles, mises a jour en continu", language: "Langue", search: "Rechercher une langue", route: { planMode: "Planifier mon voyage", exploreMode: "Explorer les passeports", originQuestion: "Quel passeport possedez-vous ?", originHint: "Selectionnez votre pays", destinationQuestion: "Ou souhaitez-vous aller ?", destinationHint: "Selectionnez votre destination", placeholder: "Choisissez un pays ou une region", submit: "Voir mon plan de visa" } },
  de: { titleTop: "Entdecke deinen Reisepass,", titleBottom: "verbinde die Welt", body: ["Erfahre, wohin dich dein Pass bringt,", "welche Einreiseregeln gelten und wie du deine Reise planst."], action: "Jetzt entdecken", trust: "Offentliche Daten aus verlasslichen Quellen, laufend aktualisiert", language: "Sprache", search: "Sprachen suchen", route: { planMode: "Reise planen", exploreMode: "Passe entdecken", originQuestion: "Welchen Reisepass hast du?", originHint: "Wahle dein Passland", destinationQuestion: "Wohin mochtest du reisen?", destinationHint: "Wahle dein Reiseziel", placeholder: "Land oder Region wahlen", submit: "Visumplan anzeigen" } },
  ja: { titleTop: "パスポートを探索し、", titleBottom: "世界とつながる", body: ["パスポートで行ける場所、入国条件、", "次の旅の準備方法をご案内します。"], action: "探索を始める", trust: "公的機関の公開データを継続的に更新", language: "言語", search: "言語を検索", route: { planMode: "旅程を計画", exploreMode: "パスポートを探索", originQuestion: "どの国のパスポートですか？", originHint: "保有するパスポートを選択", destinationQuestion: "どの国へ行きたいですか？", destinationHint: "旅行先を選択", placeholder: "国または地域を選択", submit: "ビザプランを確認" } },
  ko: { titleTop: "여권을 탐색하고,", titleBottom: "세계와 연결하세요", body: ["여권으로 갈 수 있는 곳과 입국 조건,", "다음 여행 준비 방법을 확인하세요."], action: "탐색 시작", trust: "공식 공개 데이터를 지속적으로 업데이트합니다", language: "언어", search: "언어 검색", route: { planMode: "여행 계획", exploreMode: "여권 자유 탐색", originQuestion: "어느 나라 여권을 가지고 있나요?", originHint: "보유한 여권을 선택하세요", destinationQuestion: "어느 나라로 가고 싶나요?", destinationHint: "여행지를 선택하세요", placeholder: "국가 또는 지역 선택", submit: "비자 계획 확인" } },
  ar: { titleTop: "استكشف جواز سفرك،", titleBottom: "وتواصل مع العالم", body: ["اكتشف أين يمكن أن يأخذك جواز سفرك،", "ومتطلبات الدخول وكيف تستعد لرحلتك القادمة."], action: "ابدأ الاستكشاف", trust: "بيانات عامة من مصادر رسمية يتم تحديثها باستمرار", language: "اللغة", search: "ابحث عن لغة", route: { planMode: "خطط لرحلتي", exploreMode: "استكشف الجوازات", originQuestion: "ما جواز السفر الذي تحمله؟", originHint: "اختر دولة جواز سفرك", destinationQuestion: "إلى أي دولة تريد الذهاب؟", destinationHint: "اختر وجهتك", placeholder: "اختر دولة أو منطقة", submit: "عرض خطة التأشيرة" } },
  ru: { titleTop: "Исследуйте свой паспорт,", titleBottom: "откройте мир", body: ["Узнайте, куда можно поехать с вашим паспортом,", "какие правила въезда действуют и как подготовиться к путешествию."], action: "Начать исследование", trust: "Открытые данные из официальных источников регулярно обновляются", language: "Язык", search: "Поиск языка", route: { planMode: "Спланировать поездку", exploreMode: "Исследовать паспорта", originQuestion: "Какой у вас паспорт?", originHint: "Выберите страну паспорта", destinationQuestion: "Куда вы хотите поехать?", destinationHint: "Выберите страну назначения", placeholder: "Выберите страну или регион", submit: "Показать визовый план" } },
  pt: { titleTop: "Explore o seu passaporte,", titleBottom: "conecte o mundo", body: ["Descubra onde o seu passaporte pode leva-lo,", "as regras de entrada e como preparar a sua viagem."], action: "Comecar a explorar", trust: "Dados publicos de fontes oficiais, atualizados continuamente", language: "Idioma", search: "Pesquisar idiomas", route: { planMode: "Planejar minha viagem", exploreMode: "Explorar passaportes", originQuestion: "Qual passaporte voce possui?", originHint: "Selecione o pais do seu passaporte", destinationQuestion: "Para onde voce quer ir?", destinationHint: "Selecione o destino", placeholder: "Escolha um pais ou regiao", submit: "Ver meu plano de visto" } },
  tr: { titleTop: "Pasaportunu keşfet,", titleBottom: "dünyaya bağlan", body: ["Pasaportunun seni nereye götürebileceğini,", "giriş kurallarını ve sonraki yolculuğuna nasıl hazırlanacağını öğren."], action: "Keşfetmeye başla", trust: "Yetkili kaynaklardan alınan veriler sürekli güncellenir", language: "Dil", search: "Dil ara", route: { planMode: "Seyahatimi planla", exploreMode: "Pasaportları keşfet", originQuestion: "Hangi ülkenin pasaportuna sahipsin?", originHint: "Sahip olduğun pasaportu seç", destinationQuestion: "Hangi ülkeye gitmek istiyorsun?", destinationHint: "Seyahat hedefini seç", placeholder: "Ülke veya bölge seç", submit: "Vize planımı göster" } },
  hi: { titleTop: "अपने पासपोर्ट को जानें,", titleBottom: "दुनिया से जुड़ें", body: ["जानें कि आपका पासपोर्ट आपको कहां ले जा सकता है,", "प्रवेश नियम और अगली यात्रा की तैयारी।"], action: "खोजना शुरू करें", trust: "आधिकारिक सार्वजनिक डेटा निरंतर अपडेट किया जाता है", language: "भाषा", search: "भाषा खोजें", route: { planMode: "मेरी यात्रा की योजना", exploreMode: "पासपोर्ट खोजें", originQuestion: "आपके पास किस देश का पासपोर्ट है?", originHint: "अपना पासपोर्ट देश चुनें", destinationQuestion: "आप किस देश जाना चाहते हैं?", destinationHint: "अपना गंतव्य चुनें", placeholder: "देश या क्षेत्र चुनें", submit: "वीजा योजना देखें" } },
};

const failedLocales = new Set((data.failures ?? []).map((failure) => failure.split(":")[0]));
const languageFallbacks: Record<string, string> = {
  an: "es", bi: "fr", cr: "fr", cu: "ru", ho: "fr", hz: "af", ia: "it", ie: "it",
  ii: "zh", ik: "es", io: "es", ki: "sw", kj: "af", ks: "ur", kw: "cy", lu: "sw",
  na: "fr", nd: "zu", ng: "af", nn: "no", nv: "es", oj: "fr", pi: "hi", rm: "it",
  sc: "it", vo: "de", wa: "fr", za: "zh",
};

export function getLanguageFallbackCode(locale: string) {
  return failedLocales.has(locale) ? languageFallbacks[locale] ?? "zh" : locale;
}

export function getAppCopy(locale: string): TranslationSection {
  const resolvedLocale = getLanguageFallbackCode(locale);
  if (resolvedLocale !== locale) return getAppCopy(resolvedLocale);
  if (locale === "en") return english;
  if (locale === "zh") return { ...english, ...chinese };
  if (locale === "zh-TW") return { ...english, ...traditionalChinese };
  const pack = data.translations[locale] ?? manualPacks[locale];
  if (!pack) return { ...english, ...chinese };
  return { ...english, ...deriveAppFallback(pack), ...(pack?.app ?? {}) };
}

// Older language bundles predate the full application dictionary. Reuse their
// translated welcome and route phrases so every supported locale still has a
// localized interface instead of silently reverting to English.
function deriveAppFallback(pack?: TranslationPack): TranslationSection {
  if (!pack) return {};
  const feature = pack.features ?? [];
  const route = pack.route ?? {};
  const featureTitle = (index: number, fallback: string) => feature[index]?.[0] || fallback;
  const featureDetail = (index: number, fallback: string) => feature[index]?.[1] || fallback;
  const translated = {
    explore: route.exploreMode,
    rankings: featureTitle(0, route.exploreMode || "Rankings"),
    compare: featureTitle(2, route.planMode || "Compare"),
    insights: featureTitle(1, pack.language || "Insights"),
    search: pack.search,
    login: pack.action,
    mainNavigation: pack.language,
    mobileNavigation: pack.language,
    closeNavigation: pack.action,
    openNavigation: pack.action,
    heroTop: pack.titleTop,
    heroBottom: pack.titleBottom,
    heroBody: pack.body?.join(" "),
    searchPlaceholder: route.placeholder,
    countries: featureDetail(0, route.originHint || "Countries"),
    passports: route.exploreMode,
    destinations: featureDetail(0, route.destinationHint || "Destinations"),
    flat: route.exploreMode,
    high: featureTitle(0, route.exploreMode || "High access"),
    moderate: featureTitle(1, route.exploreMode || "Moderate"),
    limited: featureTitle(2, route.exploreMode || "Limited"),
    restricted: featureTitle(3, route.exploreMode || "Restricted"),
    strength: featureTitle(0, route.exploreMode || "Passport strength"),
    globalRank: featureTitle(1, route.exploreMode || "Global rank"),
    visaFree: route.exploreMode,
    visaOnArrival: route.planMode,
    eta: pack.search,
    eVisa: pack.search,
    visaRequired: pack.action,
    noAdmission: pack.trust,
    details: pack.action,
    travelFreedom: featureTitle(1, route.exploreMode || "Travel freedom"),
    travelPlanner: route.planMode,
    compareTitle: route.planMode,
    close: pack.action,
    tripCheck: route.planMode,
    plannerTitle: route.planMode,
    myPassport: route.originQuestion,
    destination: route.destinationQuestion,
    verifyPolicy: pack.trust,
    officialSource: pack.trust,
    signIn: pack.action,
    email: pack.language,
    continue: pack.action,
    pending: pack.trust,
    noResult: pack.trust,
    emptySearch: route.placeholder,
    globalMobilityIntelligence: pack.titleTop,
    globalFreedomMap: pack.titleBottom,
    platformOverview: pack.language,
    mapDisplayMode: pack.language,
    passportFreedomLegend: pack.language,
    viewDetails: pack.action,
    comparisonResults: route.planMode,
    accountReady: pack.action,
    accountDescription: pack.trust,
    rankingHero: pack.titleTop,
    rankingIntro: pack.body?.join(" "),
    leadingRank: featureTitle(0, route.exploreMode),
    averageFreedom: featureTitle(1, route.exploreMode),
    region: pack.language,
    allRegions: route.placeholder,
    results: featureDetail(0, route.exploreMode),
    updated: pack.trust,
    rank: featureTitle(0, route.exploreMode),
    passport: route.exploreMode,
    freedom: featureTitle(1, route.exploreMode),
    destinationCount: featureDetail(0, route.exploreMode),
    empty: pack.trust,
    emptyHint: route.placeholder,
    backToMap: route.exploreMode,
    globalMobilityDatabase: pack.titleTop,
    rankingOverview: pack.language,
    globalPassportRanking: route.exploreMode,
    clearSearch: pack.action,
    sortRanking: pack.language,
    view: pack.action,
    home: route.exploreMode,
    compareTool: route.planMode,
    backWorldMap: route.exploreMode,
    passportTitle: route.exploreMode,
    passportIntro: pack.body?.join(" "),
    coverReference: pack.action,
    editionsVary: pack.trust,
    henleyStamp: pack.trust,
    matrixStamp: pack.trust,
    globalPassportRank: featureTitle(0, route.exploreMode),
    accessible: featureDetail(0, route.exploreMode),
    onArrival: route.planMode,
    matrixAccess: featureDetail(1, route.exploreMode),
    globalAccess: pack.titleBottom,
    passportAccessMap: route.exploreMode,
    switchPassport: route.placeholder,
    visaLegend: pack.language,
    passportCountry: route.originQuestion,
    passportCountryTitle: route.originHint,
    routeTitle: route.planMode,
    allDestinations: route.placeholder,
    noData: pack.trust,
    originDescription: pack.trust,
    visaFreeDays: route.destinationHint,
    visaFreeDescription: pack.trust,
    arrivalDays: route.destinationHint,
    arrivalDescription: pack.trust,
    etaDescription: pack.trust,
    eVisaDescription: pack.trust,
    visaRequiredDescription: pack.trust,
    noAdmissionDescription: pack.trust,
    unknownDescription: pack.trust,
    days: pack.language,
    policyNotice: pack.trust,
    destinationKicker: route.destinationQuestion,
    destinationVisaList: route.destinationQuestion,
    searchDestinations: route.placeholder,
    filterVisaStatus: pack.language,
    destinationVisaInfo: route.destinationQuestion,
    emptyDestinations: pack.trust,
    sourceNote: pack.trust,
    backHome: route.exploreMode,
    ...Object.fromEntries([
      ["regionAsia", featureTitle(0, route.exploreMode)], ["regionEurope", featureTitle(0, route.exploreMode)],
      ["regionAfrica", featureTitle(0, route.exploreMode)], ["regionNorthAmerica", featureTitle(0, route.exploreMode)],
      ["regionSouthAmerica", featureTitle(0, route.exploreMode)], ["regionOceania", featureTitle(0, route.exploreMode)],
    ]),
    changeRoute: route.planMode,
    chooseRoute: route.originQuestion,
    visaAndTrip: route.destinationQuestion,
    getReady: pack.action,
    yourTravelPlan: route.planMode,
    tripIntro: pack.body?.join(" "),
    stayRules: route.destinationHint,
    howManyDays: route.destinationQuestion,
    stayAffects: pack.trust,
    departureDate: route.destinationHint,
    travelChecklist: pack.language,
    openSteps: pack.trust,
    markComplete: pack.action,
    undoComplete: pack.action,
    generatePlan: route.submit,
    planReady: route.submit,
    yourActionPlan: route.planMode,
    nextStepsReady: route.submit,
    route: route.planMode,
    entryMethod: route.destinationQuestion,
    plannedStay: route.destinationHint,
    departure: route.destinationHint,
    toBeSet: route.placeholder,
    printChecklist: pack.action,
    viewAccessMap: route.exploreMode,
    planAnotherTrip: route.planMode,
  };
  const result = Object.fromEntries(Object.entries(translated).filter(([, value]) => Boolean(value))) as TranslationSection;
  const safeFallback = pack.trust || pack.action || pack.language || "";
  for (const key of Object.keys(english)) {
    if (!result[key] && safeFallback) result[key] = safeFallback;
  }
  return result;
}

export function formatCopy(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

export function getCountryName(country: CountryProfile, locale: string) {
  if (locale === "zh") return country.nameZh;
  if (locale === "zh-TW") return localizedCountryNames["zh-TW"]?.[country.iso2] ?? toTraditional(country.nameZh);
  if (locale === "en") return country.name;
  const storedName = localizedCountryNames[locale]?.[country.iso2];
  // Reject country names created by a system-locale fallback in older data.
  if (storedName && storedName !== country.nameZh) return storedName;

  try {
    const displayNames = new Intl.DisplayNames([locale], { type: "region" });
    const requested = locale.toLowerCase().split("-")[0];
    const resolved = displayNames.resolvedOptions().locale.toLowerCase().split("-")[0];
    if (requested !== resolved) return country.name;
    const name = displayNames.of(country.iso2);
    if (name && name !== country.iso2) return name;
  } catch {
    // Keep the canonical country name if this runtime does not include the locale.
  }
  return country.name;
}

const regionKeys: Record<string, string> = {
  "亚洲": "regionAsia",
  "欧洲": "regionEurope",
  "非洲": "regionAfrica",
  "北美洲": "regionNorthAmerica",
  "南美洲": "regionSouthAmerica",
  "大洋洲": "regionOceania",
};

export function getRegionName(region: string, locale: string) {
  const key = regionKeys[region];
  if (!key) return region;
  return getAppCopy(locale)[key] ?? region;
}
