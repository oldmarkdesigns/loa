// iconSystem.ts
// Fill each "" with the tag/name from your new icon library.
// Comment on the right = the current component name in src/components/icons/UiIcons.jsx

export const ICONS = {
  // --- Navigation & layout ---
  arrowLeft: "move-left",          // ArrowLeftIcon — back nav
  arrowRight: "move-right",         // ArrowRightIcon — forward / expand row
  arrowUp: "move-up",            // ArrowUpIcon — scroll-to-top
  close: "x",              // XIcon — close modal/dialog
  panelLeft: "panel-right",          // PanelLeftIcon — sidebar toggle

  // --- User & account ---
  user: "user-round",               // UserIcon — profile / avatar placeholder
  usersGroup: "users-round",         // UsersGroupIcon — team / brokers list
  switchHorizontal: "arrow-left-right",   // SwitchHorizontalIcon — role switch (renter ↔ broker)
  logout: "log-out",             // LogoutIcon — sign out

  // --- Search & filter ---
  search: "search",             // SearchIcon
  filter: "sliders-horizontal",             // FilterIcon
  reset: "rotate-ccw",              // ResetIcon — clear filters

  // --- Property / building types ---
  building: "building",           // BuildingIcon — office / commercial
  rooftop: "building",            // RooftopIcon — roof terrace amenity
  penthouse: "castle",          // PenthouseIcon — top-floor unit
  balcony: "fence",            // BalconyIcon — outdoor space

  // --- Amenities ---
  bike: "bike",               // BikeIcon — bike storage
  car: "car-front",                // CarIcon — parking / garage
  utensils: "utensils",           // UtensilsIcon — kitchen
  wifi: "wifi",               // WifiIcon — internet / fiber
  dumbbell: "dumbbell",           // DumbbellIcon — gym
  locker: "server",             // LockerIcon — storage / changing room
  snowflake: "air-vent",          // SnowflakeIcon — air conditioning
  lounge: "armchair",             // LoungeIcon — break room
  shield: "shield-check",             // ShieldIcon — secure entrance

  // --- Property amenities (bekvämligheter) ---
  // Dedicated slots per amenity label used on property cards / filters.
  // "Currently" = icon rendered today by ListingVisualCard / amenityOptions arrays.
  telefonbas: "phone",        // Telefonbås — phone booth            (currently: BuildingIcon)
  motesrum: "ratio",
  motesyta: "ratio",          // Mötesrum — meeting room             (currently: BuildingIcon)
  reception: "concierge-bell",         // Reception                           (currently: UserIcon)
  skyltfonster: "mirror-rectangular",      // Skyltfönster — storefront window    (currently: BuildingIcon)
  vantrum: "sofa",           // Väntrum — waiting room              (currently: UserIcon)
  lastzon: "forklift",           // Lastzon — loading zone              (currently: CarIcon)
  pentry: "cooking-pot",            // Pentry — kitchenette                (currently: UtensilsIcon)
  parkering: "circle-parking",         // Parkering — parking                 (currently: CarIcon on cards only; forms use "Garage")
  kaffezon: "coffee",          // Kaffezon — coffee zone              (UNWIRED — falls back to BuildingIcon)
  kaffe: "coffee",
  dusch: "shower-head",             // Dusch — shower                      (UNWIRED)
  vattenstation: "droplets",     // Vattenstation — water station       (UNWIRED; also "Vattenpunkter" / "Vattenpunkt" in mockData)
  ljusskenor: "lamp",        // Ljusskenor — track lighting         (UNWIRED)
  hogtITak: "arrow-up-to-line",          // Högt i tak — high ceiling           (UNWIRED)
  backOffice: "package",        // Back office                         (UNWIRED; spelled "Backoffice" in mockData)
  oppenYta: "grid-2x2-check",          // Öppen yta — open-plan space         (UNWIRED; also "Öppen plan" in mockData)

  // --- Location & map ---
  pin: "map-pin",                // PinIcon — address / map marker
  map: "map",                // MapIcon — map view toggle
  train: "train-front",              // TrainIcon — nearby transit
  bus: "bus-front",                // BusIcon — nearby transit

  // --- Dates, time, measurement ---
  calendar: "calendar-days",           // CalendarIcon — booking / lease
  clock: "clock",              // ClockIcon — duration / response time
  ruler: "ruler-dimension-line",              // RulerIcon — size / square meters
  coins: "hand-coins",              // CoinsIcon — price / rent

  // --- View & display modes ---
  cards: "gallery-thumbnails",              // CardsIcon — card view
  list: "layout-list",               // ListIcon — list view
  layoutDashboard: "layout-dashboard",    // LayoutDashboardIcon — dashboard view

  // --- Actions & editing ---
  pencil: "square-pen",             // PencilIcon — edit
  trash: "trash-2",              // TrashIcon — delete
  save: "arrow-down-to-line",               // SaveIcon
  upload: "upload",             // UploadIcon
  download: "download",           // DownloadIcon
  camera: "image-up",             // CameraIcon — photo upload
  share: "share-2",              // ShareIcon
  externalLink: "external-link",       // ExternalLinkIcon — open in new tab
  pdf: "file-text",                // PdfIcon — PDF file indicator
  eye: "eye",                // EyeIcon — view / preview

  // --- Status, feedback, AI ---
  star: "star",               // StarIcon — favorite / shortlist
  checkBadge: "badge-check",         // CheckBadgeIcon — verified
  sparkles: "sparkles",           // SparklesIcon — AI / smart feature
  history: "history",            // HistoryIcon — recent activity
  infoCircle: "badge-info",         // InfoCircleIcon — tooltip / help
  lightbulb: "lightbulb",          // LightbulbIcon — tip / suggestion

  // --- Notifications & messaging ---
  bell: "bell",               // BellIcon — notifications
  messageSquare: "message-square",      // MessageSquareIcon — messages / chat
  paperclip: "paperclip",
  sendHorizontal: "send-horizontal",
  archive: "archive",
  tag: "tag",
  userPlus: "user-plus",
  circleDot: "circle-dot",

  // --- Admin & settings ---
  settingsGear: "settings",       // SettingsGearIcon
  barChart3: "chart-column",          // BarChart3Icon — analytics
  moreHorizontal: "ellipsis",     // MoreHorizontalIcon — overflow menu

  // --- Support ---
  support: "headset",            // SupportIcon — help center
} as const;

export type IconKey = keyof typeof ICONS;
