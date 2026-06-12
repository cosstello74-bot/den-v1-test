/**
 * DEN top-level category registry.
 *
 * Single source of truth for the homepage and all hub pages.
 * Electronics sub-categories map directly to the existing quiz routing.
 * All other sub-categories are stubs — comingSoon: true until populated.
 *
 * Beauty is geo-restricted to London (Mikki's Wax Bar is a physical salon):
 *   - middleware.ts redirects /beauty/* for visitors outside 35km of central London
 *   - getPublicCategories(isLondon) hides the Beauty card for non-London visitors
 */

export interface DenSubCategory {
  id: string
  label: string
  description: string
  href: string
  comingSoon?: boolean
}

export interface DenTopCategory {
  id: string
  label: string
  tagline: string
  href: string
  subCategories: DenSubCategory[]
  /** ISO 3166-1 alpha-2. When set, category is hidden outside this country. */
  geoRestricted?: string
  locationBadge?: string
  type: 'affiliate' | 'booking'
}

export const DEN_CATEGORIES: DenTopCategory[] = [
  {
    id: 'electronics',
    label: 'Electronics',
    tagline: 'Laptops, phones, tablets, monitors and desktops — ranked for your profile.',
    href: '/electronics',
    type: 'affiliate',
    subCategories: [
      { id: 'laptops',    label: 'Laptops',       description: 'Work, gaming, creative — ranked for your use case.',    href: '/quiz?category=laptops' },
      { id: 'phones',     label: 'Smartphones',   description: 'The right phone for your lifestyle and budget.',         href: '/quiz?category=phones' },
      { id: 'tablets',    label: 'Tablets',        description: 'Versatile touch devices between phone and laptop.',      href: '/quiz?category=tablets' },
      { id: 'monitors',   label: 'Monitors',       description: 'Displays for gaming, productivity and creation.',        href: '/quiz?category=monitors' },
      { id: 'pcs',        label: 'Desktop PCs',    description: 'High-performance systems for home and office.',          href: '/quiz?category=pcs' },
      { id: 'headphones', label: 'Headphones',     description: 'Noise-cancelling, studio, sport — ranked by profile.',   href: '/quiz?category=headphones', comingSoon: true },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    tagline: 'Credit cards, insurance, investments — one ranked answer for your situation.',
    href: '/finance',
    type: 'affiliate',
    subCategories: [
      { id: 'credit-cards',    label: 'Credit Cards',         description: 'Cashback, travel, balance transfer — ranked.',           href: '/finance/credit-cards',    comingSoon: true },
      { id: 'car-insurance',   label: 'Car Insurance',        description: 'The right cover at the right price for your vehicle.',    href: '/finance/car-insurance',   comingSoon: true },
      { id: 'home-insurance',  label: 'Home Insurance',       description: 'Buildings, contents and combined — ranked for your home.',href: '/finance/home-insurance',  comingSoon: true },
      { id: 'life-insurance',  label: 'Life Insurance',       description: 'Term, whole and critical illness cover — ranked.',        href: '/finance/life-insurance',  comingSoon: true },
      { id: 'personal-loans',  label: 'Personal Loans',       description: 'Ranked by rate, term and eligibility for your profile.',  href: '/finance/personal-loans',  comingSoon: true },
      { id: 'investments',     label: 'Investment Platforms', description: 'ISAs, SIPPs and trading accounts — ranked.',              href: '/finance/investments',     comingSoon: true },
    ],
  },
  {
    id: 'home',
    label: 'Home',
    tagline: 'Air purifiers, dehumidifiers, heaters and vacuums — ranked for your home.',
    href: '/home',
    type: 'affiliate',
    subCategories: [
      { id: 'purifier',     label: 'Air Purifiers', description: 'HEPA purifiers ranked by room size, effectiveness and value.',   href: '/quiz?category=home' },
      { id: 'dehumidifier', label: 'Dehumidifiers', description: 'Tackle damp and condensation — ranked by capacity and running cost.', href: '/quiz?category=home' },
      { id: 'heater',       label: 'Heaters',       description: 'Fast electric heating — ranked by efficiency and output.',        href: '/quiz?category=home' },
      { id: 'vacuum',       label: 'Vacuums',       description: 'Robot, cordless and specialist vacuums — ranked for your home.',  href: '/quiz?category=home' },
      { id: 'smart-home',   label: 'Smart Home',    description: 'Hubs, cameras, thermostats — ranked by ecosystem.',              href: '/home/smart-home', comingSoon: true },
    ],
  },
  {
    id: 'health',
    label: 'Health',
    tagline: 'Supplements, dental, sleep tech, fitness trackers — one clear answer.',
    href: '/health',
    type: 'affiliate',
    subCategories: [
      { id: 'supplements',      label: 'Supplements & Nutrition', description: 'Vitamins, protein and health foods — ranked for your goal.',  href: '/quiz?category=health' },
      { id: 'dental',           label: 'Dental Aligners',         description: 'At-home vs. in-clinic treatment — ranked for your case.',     href: '/health/dental',           comingSoon: true },
      { id: 'sleep-tech',       label: 'Sleep Technology',        description: 'Trackers, aids and smart monitors — ranked for quality.',     href: '/health/sleep-tech',       comingSoon: true },
      { id: 'fitness-trackers', label: 'Fitness Trackers',        description: 'Wearables ranked by activity type and precision needs.',      href: '/health/fitness-trackers', comingSoon: true },
      { id: 'health-insurance', label: 'Health Insurance',        description: 'Private medical cover — ranked by profile and budget.',      href: '/health/health-insurance', comingSoon: true },
    ],
  },
  {
    id: 'travel',
    label: 'Travel',
    tagline: 'Hotels, insurance, car hire, cruises — ranked by your travel profile.',
    href: '/travel',
    type: 'affiliate',
    subCategories: [
      { id: 'hotels',           label: 'Hotels',            description: 'Ranked by destination, budget and style preference.',     href: '/travel/hotels',           comingSoon: true },
      { id: 'travel-insurance', label: 'Travel Insurance',  description: 'Single trip, annual and backpacker — ranked.',            href: '/quiz?category=travel-insurance' },
      { id: 'car-hire',         label: 'Car Hire',          description: 'Ranked by vehicle size, duration and destination.',       href: '/travel/car-hire',         comingSoon: true },
      { id: 'cruises',          label: 'Cruises',           description: 'Lines, routes and cabin grades — ranked for you.',        href: '/travel/cruises',          comingSoon: true },
    ],
  },
  {
    id: 'software',
    label: 'Software',
    tagline: 'OS, Office, antivirus and VPN — one ranked answer for your licence needs.',
    href: '/software',
    type: 'affiliate',
    subCategories: [
      { id: 'os',               label: 'Operating Systems',      description: 'Windows 10 and 11 — matched to your hardware and use case.',       href: '/quiz?category=software' },
      { id: 'office',           label: 'Office & Productivity',  description: 'Word, Excel, PowerPoint — ranked by edition and budget.',           href: '/quiz?category=software' },
      { id: 'security',         label: 'Security & Antivirus',   description: 'Home, small business and enterprise protection — ranked.',           href: '/quiz?category=software' },
      { id: 'vpn',              label: 'VPN & Privacy',          description: 'Speed, privacy and streaming — ranked for your devices.',            href: '/quiz?category=software' },
      { id: 'software-bundles', label: 'Bundles & Deals',        description: 'Windows + Office bundles and discounted licence packs.',             href: '/software/bundles', comingSoon: true },
    ],
  },
  {
    id: 'business',
    label: 'Business',
    tagline: 'Accounting, CRM, hosting, payroll — ranked for your company size and sector.',
    href: '/business',
    type: 'affiliate',
    subCategories: [
      { id: 'accounting',   label: 'Accounting Software', description: 'Ranked by business size, complexity and integrations.',   href: '/business/accounting',   comingSoon: true },
      { id: 'crm',          label: 'CRM Tools',           description: 'Sales, service and marketing CRM — ranked by use case.', href: '/business/crm',          comingSoon: true },
      { id: 'web-hosting',  label: 'Web Hosting',         description: 'Shared, VPS and managed — ranked by site type.',         href: '/business/web-hosting',  comingSoon: true },
      { id: 'payroll',      label: 'Payroll Software',    description: 'Ranked by headcount, sector and compliance needs.',      href: '/business/payroll',      comingSoon: true },
    ],
  },
  {
    id: 'beauty',
    label: 'Beauty',
    tagline: "Professional treatments matched to your skin, hair type and goals.",
    href: '/beauty',
    type: 'booking',
    geoRestricted: 'LONDON',
    locationBadge: 'London',
    subCategories: [
      { id: 'laser',     label: 'Laser Hair Removal',       description: 'Long-lasting results — find your ideal course.', href: '/beauty#book' },
      { id: 'lvl',       label: 'LVL Lash Lift',            description: 'Natural lash enhancement, no extensions needed.', href: '/beauty#book' },
      { id: 'eyebrow',   label: 'Eyebrow Tint & Threading', description: 'Shape and define — matched to your face structure.', href: '/beauty#book' },
      { id: 'hot-wax',   label: 'Hot Wax',                  description: 'For sensitive areas and coarse hair — gentle, precise.', href: '/beauty#book' },
      { id: 'strip-wax', label: 'Strip Wax',                description: 'Quick and effective for larger body areas.', href: '/beauty#book' },
    ],
  },
]

/** All categories, no geo filtering — for server-side use where geo is already handled. */
export function getAllDenCategories(): DenTopCategory[] {
  return DEN_CATEGORIES
}

/** Returns categories visible to a visitor, applying geo restrictions. */
export function getPublicCategories(isLondon: boolean): DenTopCategory[] {
  return DEN_CATEGORIES.filter(c => {
    if (c.geoRestricted && !isLondon) return false
    return true
  })
}

export function getDenCategoryById(id: string): DenTopCategory | undefined {
  return DEN_CATEGORIES.find(c => c.id === id)
}
