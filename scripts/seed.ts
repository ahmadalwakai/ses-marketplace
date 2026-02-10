import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'ahmadalwakai76@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123!@#';

// Placeholder product images from picsum (royalty-free)
const img = (id: number) => `https://picsum.photos/seed/ses${id}/600/600`;

type Rng = () => number;

function mulberry32(seed: number): Rng {
  return function () {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const sellerStoreNames = [
  'سوق الشام الحديث',
  'المحترف للتقنية',
  'دار البهجة',
  'شام ستايل',
  'كنوز الشرق',
  'بيت الحرف',
  'روائع النخبة',
  'المنارة للهواتف',
  'المدينة الذكية',
  'مخزن الأناقة',
  'الزهراء للمفروشات',
  'فنون دمشق',
  'النخبة الرياضية',
  'الحرفي السوري',
  'الواحة الرقمية',
  'رونق الحلي',
  'الرياضة بلس',
  'النور للأجهزة',
  'حكاية سوق',
  'مركز الابداع',
];

const sellerBios = [
  'متجر موثوق يقدم منتجات أصلية وشحن سريع داخل سوريا.',
  'تشكيلة واسعة بأسعار منافسة وخدمة عملاء مميزة.',
  'مختصون في أحدث الصيحات مع ضمان الجودة.',
  'منتجات مختارة بعناية من أفضل الموردين المحليين.',
  'نوفر خيارات متعددة مع عروض أسبوعية حصرية.',
  'خبرة طويلة في السوق السوري مع تقييمات ممتازة.',
];

const productAdjectives = [
  'Premium',
  'Classic',
  'Smart',
  'Ultra',
  'Eco',
  'Pro',
  'Light',
  'Max',
  'Sport',
  'Deluxe',
  'Compact',
  'Essential',
];

const productNouns = [
  'Phone',
  'Laptop',
  'Headphones',
  'Watch',
  'Shoes',
  'Backpack',
  'Camera',
  'Speaker',
  'Table',
  'Chair',
  'Lamp',
  'Jacket',
  'Dress',
  'Mixer',
  'Blender',
  'Router',
  'Monitor',
  'Keyboard',
  'Mouse',
  'Skincare Set',
  'Perfume',
  'Sunglasses',
  'Wallet',
  'Fitness Mat',
  'Resistance Band',
  'Toy Set',
  'Travel Bag',
  'Coffee Maker',
  'Vacuum',
  'Gaming Console',
];

const productBrands = [
  'Orion',
  'Zenith',
  'Nova',
  'Atlas',
  'Lumen',
  'Pulse',
  'Vertex',
  'Aurora',
  'Solace',
  'Vivoa',
  'Nexon',
  'Helio',
  'Artemis',
  'Strata',
  'Momentum',
  'Apex',
  'Cobalt',
  'Echo',
  'Glide',
  'Ridge',
];

const productTags = [
  'popular',
  'new',
  'bestseller',
  'sale',
  'gift',
  'trend',
];

const conditions = ['NEW', 'LIKE_NEW', 'GOOD', 'FAIR'] as const;

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

async function main() {
  console.log('🌱 Starting comprehensive database seed...\n');

  // ──────────────────────────────────────────────
  // 1. ADMIN USER
  // ──────────────────────────────────────────────
  const hashedAdmin = await bcrypt.hash(ADMIN_PASSWORD, 12);

  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { role: 'ADMIN', status: 'ACTIVE' },
    create: {
      email: ADMIN_EMAIL,
      name: 'أحمد الوكاعي',
      password: hashedAdmin,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Admin: ${admin.email}`);

  // ──────────────────────────────────────────────
  // 2. ADMIN SETTINGS
  // ──────────────────────────────────────────────
  await prisma.adminSettings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      freeMode: false,
      globalCommissionRate: 0.05,
      rankingWeights: {
        w_recency: 0.3,
        w_rating: 0.25,
        w_orders: 0.2,
        w_stock: 0.15,
        w_sellerRep: 0.1,
      },
      seoTemplates: {},
      featureFlags: {
        maxUploadSizeMb: 5,
        allowedMimes: ['image/jpeg', 'image/png', 'image/webp'],
        sesLive: true,
        saved: true,
        smallBusiness: true,
        advancedSearch: true,
        cookieConsent: true,
      },
      navConfig: { categories: [], showAll: true },
      cookieConsentConfig: { analytics: false, marketing: false, functional: true },
      searchConfig: {
        advancedEnabled: true,
        filtersEnabled: true,
        suggestionsEnabled: true,
        popularSearches: [
          'هواتف سامسونج',
          'ايفون مستعمل',
          'لابتوبات',
          'ساعات يد',
          'أحذية رياضية',
          'مستحضرات تجميل',
          'أجهزة منزلية',
          'أثاث منزلي',
        ],
      },
    },
  });
  console.log('✅ Admin settings');

  // Admin welcome notification
  const existingNotif = await prisma.notification.findFirst({
    where: { userId: admin.id, type: 'SYSTEM' },
  });
  if (!existingNotif) {
    await prisma.notification.create({
      data: {
        userId: admin.id,
        type: 'SYSTEM',
        title: 'مرحباً بك في لوحة تحكم SES',
        message: 'تم إعداد نظام الإدارة بنجاح. يمكنك الآن إدارة الموقع من هنا.',
        body: 'تم إعداد نظام الإدارة بنجاح.',
        entityType: 'AdminSettings',
        entityId: 'singleton',
      },
    });
  }

  // ──────────────────────────────────────────────
  // 3. CATEGORIES (eBay-style top-10 + subs)
  // ──────────────────────────────────────────────
  const topCategories = [
    { name: 'Electronics', nameAr: 'إلكترونيات', slug: 'electronics', sortOrder: 1, subs: [
      { name: 'Phones & Tablets', nameAr: 'هواتف وأجهزة لوحية', slug: 'phones-tablets' },
      { name: 'Computers & Laptops', nameAr: 'حواسيب ولابتوبات', slug: 'computers-laptops' },
      { name: 'TVs & Audio', nameAr: 'تلفزيونات وصوتيات', slug: 'tvs-audio' },
      { name: 'Gaming', nameAr: 'ألعاب فيديو', slug: 'gaming' },
      { name: 'Cameras & Drones', nameAr: 'كاميرات وطائرات', slug: 'cameras-drones' },
    ]},
    { name: 'Fashion', nameAr: 'أزياء', slug: 'fashion', sortOrder: 2, subs: [
      { name: "Men's Clothing", nameAr: 'ملابس رجالية', slug: 'mens-clothing' },
      { name: "Women's Clothing", nameAr: 'ملابس نسائية', slug: 'womens-clothing' },
      { name: "Kids' Clothing", nameAr: 'ملابس أطفال', slug: 'kids-clothing' },
      { name: 'Shoes', nameAr: 'أحذية', slug: 'shoes' },
      { name: 'Bags & Accessories', nameAr: 'حقائب وإكسسوارات', slug: 'bags-accessories' },
    ]},
    { name: 'Home & Garden', nameAr: 'المنزل والحديقة', slug: 'home-garden', sortOrder: 3, subs: [
      { name: 'Furniture', nameAr: 'أثاث', slug: 'furniture' },
      { name: 'Kitchen', nameAr: 'مطبخ', slug: 'kitchen' },
      { name: 'Garden Tools', nameAr: 'أدوات حديقة', slug: 'garden-tools' },
      { name: 'Decor', nameAr: 'ديكور', slug: 'home-decor' },
    ]},
    { name: 'Health & Beauty', nameAr: 'صحة وجمال', slug: 'health-beauty', sortOrder: 4, subs: [
      { name: 'Skincare', nameAr: 'عناية بالبشرة', slug: 'skincare' },
      { name: 'Makeup', nameAr: 'مكياج', slug: 'makeup' },
      { name: 'Perfumes', nameAr: 'عطور', slug: 'perfumes' },
      { name: 'Health Devices', nameAr: 'أجهزة صحية', slug: 'health-devices' },
    ]},
    { name: 'Sports & Leisure', nameAr: 'رياضة وترفيه', slug: 'sports-leisure', sortOrder: 5, subs: [
      { name: 'Fitness Equipment', nameAr: 'معدات لياقة', slug: 'fitness-equipment' },
      { name: 'Outdoor & Camping', nameAr: 'تخييم ورحلات', slug: 'outdoor-camping' },
      { name: 'Team Sports', nameAr: 'رياضات جماعية', slug: 'team-sports' },
    ]},
    { name: 'Motors', nameAr: 'سيارات ومركبات', slug: 'motors', sortOrder: 6, subs: [
      { name: 'Car Parts', nameAr: 'قطع غيار', slug: 'car-parts' },
      { name: 'Motorcycles', nameAr: 'دراجات نارية', slug: 'motorcycles' },
      { name: 'Car Accessories', nameAr: 'إكسسوارات سيارات', slug: 'car-accessories' },
    ]},
    { name: 'Jewellery & Watches', nameAr: 'مجوهرات وساعات', slug: 'jewellery-watches', sortOrder: 7, subs: [
      { name: 'Rings & Necklaces', nameAr: 'خواتم وقلادات', slug: 'rings-necklaces' },
      { name: 'Watches', nameAr: 'ساعات', slug: 'watches' },
      { name: 'Handmade Jewellery', nameAr: 'مجوهرات يدوية', slug: 'handmade-jewellery' },
    ]},
    { name: 'Collectables', nameAr: 'مقتنيات', slug: 'collectables', sortOrder: 8, subs: [
      { name: 'Coins & Stamps', nameAr: 'عملات وطوابع', slug: 'coins-stamps' },
      { name: 'Art', nameAr: 'فن', slug: 'art' },
      { name: 'Antiques', nameAr: 'تحف', slug: 'antiques' },
    ]},
    { name: 'Refurbished', nameAr: 'مجدّد', slug: 'refurbished', sortOrder: 9, subs: [
      { name: 'Refurbished Phones', nameAr: 'هواتف مجددة', slug: 'refurbished-phones' },
      { name: 'Refurbished Laptops', nameAr: 'لابتوبات مجددة', slug: 'refurbished-laptops' },
    ]},
    { name: 'Small Business', nameAr: 'مشاريع صغيرة', slug: 'small-business', sortOrder: 10, subs: [
      { name: 'Handmade', nameAr: 'صناعة يدوية', slug: 'handmade' },
      { name: 'Local Food', nameAr: 'طعام محلي', slug: 'local-food' },
      { name: 'Crafts', nameAr: 'حرف يدوية', slug: 'crafts' },
    ]},
  ];

  const categoryMap: Record<string, string> = {}; // slug -> id

  for (const top of topCategories) {
    const parent = await prisma.category.upsert({
      where: { slug: top.slug },
      update: { sortOrder: top.sortOrder, name: top.name, nameAr: top.nameAr },
      create: {
        name: top.name,
        nameAr: top.nameAr,
        slug: top.slug,
        sortOrder: top.sortOrder,
        isActive: true,
      },
    });
    categoryMap[top.slug] = parent.id;

    for (let i = 0; i < top.subs.length; i++) {
      const sub = top.subs[i];
      const child = await prisma.category.upsert({
        where: { slug: sub.slug },
        update: { parentId: parent.id, name: sub.name, nameAr: sub.nameAr, sortOrder: i + 1 },
        create: {
          name: sub.name,
          nameAr: sub.nameAr,
          slug: sub.slug,
          sortOrder: i + 1,
          parentId: parent.id,
          isActive: true,
        },
      });
      categoryMap[sub.slug] = child.id;
    }
  }
  console.log(`✅ ${Object.keys(categoryMap).length} categories (${topCategories.length} top + subs)`);

  // ──────────────────────────────────────────────
  // 4. SELLER ACCOUNTS (50 sellers)
  // ──────────────────────────────────────────────
  const sellerPassword = await bcrypt.hash('Seller123!@#', 12);
  const sellerRng = mulberry32(2026);

  const seller1User = await prisma.user.upsert({
    where: { email: 'seller1@ses.sy' },
    update: { role: 'SELLER', status: 'ACTIVE' },
    create: {
      email: 'seller1@ses.sy',
      name: 'نور الشام للإلكترونيات',
      password: sellerPassword,
      role: 'SELLER',
      status: 'ACTIVE',
    },
  });

  const seller1 = await prisma.sellerProfile.upsert({
    where: { userId: seller1User.id },
    update: { verificationStatus: 'APPROVED', verificationLevel: 'TOP_RATED', isSmallBusiness: false },
    create: {
      userId: seller1User.id,
      storeName: 'نور الشام للإلكترونيات',
      slug: 'nour-alsham-electronics',
      bio: 'متجر متخصص في الإلكترونيات والأجهزة الذكية. نوفر أحدث المنتجات بأفضل الأسعار مع ضمان وتوصيل لكل سوريا.',
      phone: '+963911234567',
      logo: img(4001),
      banner: img(4101),
      verificationStatus: 'APPROVED',
      verificationLevel: 'TOP_RATED',
      ratingAvg: 4.7,
      ratingCount: 48,
      totalSales: 420,
      isSmallBusiness: false,
    },
  });

  const seller2User = await prisma.user.upsert({
    where: { email: 'seller2@ses.sy' },
    update: { role: 'SELLER', status: 'ACTIVE' },
    create: {
      email: 'seller2@ses.sy',
      name: 'بيت الأناقة',
      password: sellerPassword,
      role: 'SELLER',
      status: 'ACTIVE',
    },
  });

  const seller2 = await prisma.sellerProfile.upsert({
    where: { userId: seller2User.id },
    update: { verificationStatus: 'APPROVED', verificationLevel: 'PREMIUM', isSmallBusiness: true },
    create: {
      userId: seller2User.id,
      storeName: 'بيت الأناقة',
      slug: 'bait-alanaqah',
      bio: 'أزياء عصرية ومجوهرات فاخرة. تشكيلة واسعة من الماركات العالمية والمحلية بأسعار منافسة.',
      phone: '+963933456789',
      logo: img(4002),
      banner: img(4102),
      verificationStatus: 'APPROVED',
      verificationLevel: 'PREMIUM',
      ratingAvg: 4.5,
      ratingCount: 32,
      totalSales: 280,
      isSmallBusiness: true,
    },
  });

  const extraSellers: Array<{ id: string; userId: string }> = [];
  const verificationLevels = ['BASIC', 'VERIFIED', 'PREMIUM', 'TOP_RATED'] as const;

  for (let i = 3; i <= 50; i++) {
    const storeName = sellerStoreNames[(i - 1) % sellerStoreNames.length] + ` ${i}`;
    const slug = `store-${i}`;
    const verificationStatus = sellerRng() > 0.2 ? 'APPROVED' : 'PENDING';
    const levelIndex = Math.floor(sellerRng() * verificationLevels.length);
    const verificationLevel = verificationLevels[levelIndex];
    const ratingAvg = Math.round((3.6 + sellerRng() * 1.4) * 10) / 10;
    const ratingCount = Math.floor(sellerRng() * 220);
    const totalSales = Math.floor(50 + sellerRng() * 1200);
    // Mark ~30% of sellers as small business
    const isSmallBusiness = sellerRng() < 0.3;

    const sellerUser = await prisma.user.upsert({
      where: { email: `seller${i}@ses.sy` },
      update: { role: 'SELLER', status: 'ACTIVE' },
      create: {
        email: `seller${i}@ses.sy`,
        name: storeName,
        password: sellerPassword,
        role: 'SELLER',
        status: 'ACTIVE',
      },
    });

    const profile = await prisma.sellerProfile.upsert({
      where: { userId: sellerUser.id },
      update: { verificationStatus, verificationLevel, ratingAvg, ratingCount, totalSales, isSmallBusiness },
      create: {
        userId: sellerUser.id,
        storeName,
        slug,
        bio: sellerBios[(i - 3) % sellerBios.length],
        phone: `+9639${Math.floor(10000000 + sellerRng() * 89999999)}`,
        logo: img(4000 + i),
        banner: img(4100 + i),
        verificationStatus,
        verificationLevel,
        ratingAvg,
        ratingCount,
        totalSales,
        isSmallBusiness,
      },
    });

    extraSellers.push({ id: profile.id, userId: sellerUser.id });
  }

  console.log('✅ 50 sellers seeded (seller1@ses.sy + seller2@ses.sy + seller3..seller50)');

  // ──────────────────────────────────────────────
  // 5. CUSTOMER ACCOUNTS (2 customers)
  // ──────────────────────────────────────────────
  const customerPassword = await bcrypt.hash('Customer123!', 12);

  const customer1 = await prisma.user.upsert({
    where: { email: 'customer1@ses.sy' },
    update: { role: 'CUSTOMER', status: 'ACTIVE' },
    create: {
      email: 'customer1@ses.sy',
      name: 'سارة حسن',
      password: customerPassword,
      role: 'CUSTOMER',
      status: 'ACTIVE',
    },
  });

  const customer2 = await prisma.user.upsert({
    where: { email: 'customer2@ses.sy' },
    update: { role: 'CUSTOMER', status: 'ACTIVE' },
    create: {
      email: 'customer2@ses.sy',
      name: 'عمر خليل',
      password: customerPassword,
      role: 'CUSTOMER',
      status: 'ACTIVE',
    },
  });

  console.log('✅ 2 customers: سارة (customer1@ses.sy) + عمر (customer2@ses.sy)');

  // ──────────────────────────────────────────────
  // 6. PRODUCTS (1000+ products across categories)
  // ──────────────────────────────────────────────
  interface ProductSeed {
    title: string;
    titleAr: string;
    slug: string;
    description: string;
    descriptionAr: string;
    price: number;
    quantity: number;
    condition: 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR';
    categorySlug: string;
    sellerId: string;
    imgSeed: number;
    ratingAvg: number;
    ratingCount: number;
    viewCount: number;
    status: 'ACTIVE' | 'PENDING';
    tags: string[];
  }

  const sellerIds = [seller1.id, seller2.id, ...extraSellers.map((s) => s.id)];
  const categorySlugs = Object.keys(categoryMap);
  const productRng = mulberry32(9090);

  const productSeeds: ProductSeed[] = [
    // Seller 1 — Electronics store (12 products)
    {
      title: 'Samsung Galaxy S24 Ultra', titleAr: 'سامسونج جالكسي S24 ألترا',
      slug: 'samsung-galaxy-s24-ultra',
      description: 'Latest Samsung flagship with S-Pen, 200MP camera, Titanium frame',
      descriptionAr: 'أحدث هاتف رائد من سامسونج مع قلم S-Pen وكاميرا 200 ميجابكسل وإطار تيتانيوم',
      price: 5500000, quantity: 15, condition: 'NEW',
      categorySlug: 'phones-tablets', sellerId: seller1.id, imgSeed: 101,
      ratingAvg: 4.8, ratingCount: 24, viewCount: 512,
      status: 'ACTIVE', tags: ['samsung', 'galaxy', 'flagship', 'android'],
    },
    {
      title: 'iPhone 15 Pro Max', titleAr: 'آيفون 15 برو ماكس',
      slug: 'iphone-15-pro-max',
      description: 'Apple iPhone 15 Pro Max 256GB, Titanium Blue',
      descriptionAr: 'آيفون 15 برو ماكس 256 جيجا، تيتانيوم أزرق، كاميرا 48 ميجابكسل',
      price: 7200000, quantity: 8, condition: 'NEW',
      categorySlug: 'phones-tablets', sellerId: seller1.id, imgSeed: 102,
      ratingAvg: 4.9, ratingCount: 31, viewCount: 843,
      status: 'ACTIVE', tags: ['apple', 'iphone', 'ios', 'flagship'],
    },
    {
      title: 'MacBook Air M3', titleAr: 'ماك بوك إير M3',
      slug: 'macbook-air-m3',
      description: 'Apple MacBook Air 15" M3 chip, 16GB RAM, 512GB SSD',
      descriptionAr: 'ماك بوك إير 15 بوصة، معالج M3، 16 جيجا رام، 512 جيجا تخزين',
      price: 8900000, quantity: 5, condition: 'NEW',
      categorySlug: 'computers-laptops', sellerId: seller1.id, imgSeed: 103,
      ratingAvg: 4.7, ratingCount: 12, viewCount: 345,
      status: 'ACTIVE', tags: ['apple', 'macbook', 'laptop', 'm3'],
    },
    {
      title: 'Sony PlayStation 5 Slim', titleAr: 'سوني بلايستيشن 5 سليم',
      slug: 'ps5-slim',
      description: 'PS5 Slim Digital Edition with DualSense controller',
      descriptionAr: 'بلايستيشن 5 النسخة الرقمية المدمجة مع يد تحكم DualSense',
      price: 3200000, quantity: 10, condition: 'NEW',
      categorySlug: 'gaming', sellerId: seller1.id, imgSeed: 104,
      ratingAvg: 4.6, ratingCount: 18, viewCount: 678,
      status: 'ACTIVE', tags: ['sony', 'ps5', 'gaming', 'console'],
    },
    {
      title: 'Samsung 65" OLED TV', titleAr: 'تلفزيون سامسونج 65 بوصة OLED',
      slug: 'samsung-65-oled-tv',
      description: 'Samsung S90C 65-inch OLED 4K Smart TV, HDR10+',
      descriptionAr: 'تلفزيون سامسونج OLED 65 بوصة، 4K ذكي، HDR10+',
      price: 6800000, quantity: 3, condition: 'NEW',
      categorySlug: 'tvs-audio', sellerId: seller1.id, imgSeed: 105,
      ratingAvg: 4.5, ratingCount: 7, viewCount: 214,
      status: 'ACTIVE', tags: ['samsung', 'tv', 'oled', '4k'],
    },
    {
      title: 'Canon EOS R6 Mark II', titleAr: 'كانون EOS R6 مارك 2',
      slug: 'canon-eos-r6-mark-ii',
      description: 'Canon EOS R6 Mark II mirrorless camera, 24MP, 4K 60fps',
      descriptionAr: 'كاميرا كانون بدون مرآة، 24 ميجابكسل، تصوير 4K بسرعة 60 إطار',
      price: 12000000, quantity: 2, condition: 'NEW',
      categorySlug: 'cameras-drones', sellerId: seller1.id, imgSeed: 106,
      ratingAvg: 4.9, ratingCount: 5, viewCount: 167,
      status: 'ACTIVE', tags: ['canon', 'camera', 'mirrorless', 'photography'],
    },
    {
      title: 'AirPods Pro 2', titleAr: 'إيربودز برو 2',
      slug: 'airpods-pro-2',
      description: 'Apple AirPods Pro 2nd Gen with USB-C, Adaptive Audio',
      descriptionAr: 'سماعات آبل إيربودز برو الجيل الثاني، منفذ USB-C، صوت تكيّفي',
      price: 1200000, quantity: 25, condition: 'NEW',
      categorySlug: 'phones-tablets', sellerId: seller1.id, imgSeed: 107,
      ratingAvg: 4.6, ratingCount: 42, viewCount: 923,
      status: 'ACTIVE', tags: ['apple', 'airpods', 'earbuds', 'wireless'],
    },
    {
      title: 'DJI Mini 4 Pro', titleAr: 'DJI ميني 4 برو',
      slug: 'dji-mini-4-pro',
      description: 'DJI Mini 4 Pro drone, 4K HDR, 34-min flight, under 249g',
      descriptionAr: 'طائرة DJI ميني 4 برو، تصوير 4K HDR، 34 دقيقة طيران، أقل من 249 غرام',
      price: 4500000, quantity: 4, condition: 'NEW',
      categorySlug: 'cameras-drones', sellerId: seller1.id, imgSeed: 108,
      ratingAvg: 4.7, ratingCount: 9, viewCount: 334,
      status: 'ACTIVE', tags: ['dji', 'drone', 'camera', 'aerial'],
    },
    // Refurbished items from seller 1
    {
      title: 'iPhone 13 Refurbished', titleAr: 'آيفون 13 مجدد',
      slug: 'iphone-13-refurbished',
      description: 'Refurbished iPhone 13 128GB, Grade A, 90-day warranty',
      descriptionAr: 'آيفون 13 مجدد 128 جيجا، درجة A ممتازة، ضمان 90 يوم',
      price: 2800000, quantity: 6, condition: 'LIKE_NEW',
      categorySlug: 'refurbished-phones', sellerId: seller1.id, imgSeed: 109,
      ratingAvg: 4.3, ratingCount: 15, viewCount: 456,
      status: 'ACTIVE', tags: ['apple', 'iphone', 'refurbished'],
    },
    {
      title: 'ThinkPad X1 Carbon Refurbished', titleAr: 'ثينك باد X1 كاربون مجدد',
      slug: 'thinkpad-x1-carbon-refurbished',
      description: 'Lenovo ThinkPad X1 Carbon Gen 10, i7, 16GB, refurbished',
      descriptionAr: 'لينوفو ثينك باد X1 كاربون الجيل العاشر، معالج i7، 16 جيجا رام، مجدد',
      price: 4200000, quantity: 3, condition: 'GOOD',
      categorySlug: 'refurbished-laptops', sellerId: seller1.id, imgSeed: 110,
      ratingAvg: 4.4, ratingCount: 8, viewCount: 198,
      status: 'ACTIVE', tags: ['lenovo', 'thinkpad', 'laptop', 'refurbished'],
    },

    // Seller 2 — Fashion & lifestyle (10 products)
    {
      title: 'Leather Crossbody Bag', titleAr: 'حقيبة جلد كروس بودي',
      slug: 'leather-crossbody-bag',
      description: 'Genuine leather crossbody bag, handmade in Damascus',
      descriptionAr: 'حقيبة كروس بودي من الجلد الطبيعي، صناعة يدوية دمشقية',
      price: 450000, quantity: 20, condition: 'NEW',
      categorySlug: 'bags-accessories', sellerId: seller2.id, imgSeed: 201,
      ratingAvg: 4.8, ratingCount: 22, viewCount: 389,
      status: 'ACTIVE', tags: ['bag', 'leather', 'handmade', 'damascus'],
    },
    {
      title: 'Men Casual Suit', titleAr: 'بدلة رجالية كاجوال',
      slug: 'men-casual-suit',
      description: 'Modern slim-fit casual suit, navy blue, premium fabric',
      descriptionAr: 'بدلة كاجوال حديثة بقصّة ضيقة، لون كحلي، قماش ممتاز',
      price: 850000, quantity: 12, condition: 'NEW',
      categorySlug: 'mens-clothing', sellerId: seller2.id, imgSeed: 202,
      ratingAvg: 4.4, ratingCount: 11, viewCount: 267,
      status: 'ACTIVE', tags: ['suit', 'men', 'casual', 'fashion'],
    },
    {
      title: 'Embroidered Abaya', titleAr: 'عباية مطرزة',
      slug: 'embroidered-abaya',
      description: 'Elegant black abaya with hand embroidery, premium crepe fabric',
      descriptionAr: 'عباية سوداء أنيقة مع تطريز يدوي، قماش كريب ممتاز',
      price: 650000, quantity: 15, condition: 'NEW',
      categorySlug: 'womens-clothing', sellerId: seller2.id, imgSeed: 203,
      ratingAvg: 4.9, ratingCount: 28, viewCount: 534,
      status: 'ACTIVE', tags: ['abaya', 'women', 'embroidery', 'elegant'],
    },
    {
      title: 'Kids Sneakers', titleAr: 'حذاء رياضي للأطفال',
      slug: 'kids-sneakers',
      description: 'Comfortable lightweight sneakers for kids, multiple colors',
      descriptionAr: 'حذاء رياضي خفيف ومريح للأطفال، ألوان متعددة',
      price: 180000, quantity: 30, condition: 'NEW',
      categorySlug: 'shoes', sellerId: seller2.id, imgSeed: 204,
      ratingAvg: 4.5, ratingCount: 19, viewCount: 412,
      status: 'ACTIVE', tags: ['kids', 'shoes', 'sneakers', 'comfortable'],
    },
    {
      title: 'Silver Damascus Ring', titleAr: 'خاتم فضة دمشقي',
      slug: 'silver-damascus-ring',
      description: 'Handcrafted silver ring with traditional Damascus motifs',
      descriptionAr: 'خاتم فضة مصنوع يدوياً بزخارف دمشقية تقليدية',
      price: 320000, quantity: 8, condition: 'NEW',
      categorySlug: 'rings-necklaces', sellerId: seller2.id, imgSeed: 205,
      ratingAvg: 4.7, ratingCount: 14, viewCount: 203,
      status: 'ACTIVE', tags: ['silver', 'ring', 'handmade', 'damascus', 'jewellery'],
    },
    {
      title: 'Aleppo Soap Gift Set', titleAr: 'طقم صابون حلبي هدية',
      slug: 'aleppo-soap-gift-set',
      description: '6-piece traditional Aleppo laurel soap gift box',
      descriptionAr: 'طقم هدية 6 قطع من صابون حلب بالغار الأصلي',
      price: 95000, quantity: 50, condition: 'NEW',
      categorySlug: 'skincare', sellerId: seller2.id, imgSeed: 206,
      ratingAvg: 4.9, ratingCount: 56, viewCount: 1023,
      status: 'ACTIVE', tags: ['aleppo', 'soap', 'natural', 'gift', 'skincare'],
    },
    {
      title: 'Handmade Mosaic Lamp', titleAr: 'مصباح فسيفساء يدوي',
      slug: 'handmade-mosaic-lamp',
      description: 'Traditional Syrian mosaic table lamp, handmade colored glass',
      descriptionAr: 'مصباح طاولة فسيفساء سوري تقليدي، زجاج ملون صناعة يدوية',
      price: 280000, quantity: 7, condition: 'NEW',
      categorySlug: 'handmade', sellerId: seller2.id, imgSeed: 207,
      ratingAvg: 4.8, ratingCount: 33, viewCount: 567,
      status: 'ACTIVE', tags: ['lamp', 'mosaic', 'handmade', 'syrian', 'decor'],
    },
    {
      title: 'Fitness Resistance Bands Set', titleAr: 'طقم أشرطة مقاومة للتمارين',
      slug: 'fitness-resistance-bands',
      description: '5-level resistance bands set with handles and door anchor',
      descriptionAr: 'طقم أشرطة مقاومة 5 مستويات مع مقابض وحامل باب',
      price: 120000, quantity: 40, condition: 'NEW',
      categorySlug: 'fitness-equipment', sellerId: seller2.id, imgSeed: 208,
      ratingAvg: 4.3, ratingCount: 17, viewCount: 298,
      status: 'ACTIVE', tags: ['fitness', 'resistance', 'bands', 'exercise'],
    },
    {
      title: 'Casio G-Shock Watch', titleAr: 'ساعة كاسيو جي شوك',
      slug: 'casio-g-shock-watch',
      description: 'Casio G-Shock GA-2100, CasiOak, black on black',
      descriptionAr: 'ساعة كاسيو جي شوك GA-2100، أسود بالكامل، مقاومة للصدمات',
      price: 580000, quantity: 10, condition: 'NEW',
      categorySlug: 'watches', sellerId: seller2.id, imgSeed: 209,
      ratingAvg: 4.6, ratingCount: 21, viewCount: 445,
      status: 'ACTIVE', tags: ['casio', 'gshock', 'watch', 'black'],
    },
    {
      title: 'Vintage Syrian Coins Collection', titleAr: 'مجموعة عملات سورية قديمة',
      slug: 'vintage-syrian-coins',
      description: '10-piece collection of vintage Syrian coins (1950s–1980s)',
      descriptionAr: 'مجموعة 10 عملات سورية قديمة من الخمسينات إلى الثمانينات',
      price: 750000, quantity: 2, condition: 'FAIR',
      categorySlug: 'coins-stamps', sellerId: seller2.id, imgSeed: 210,
      ratingAvg: 4.2, ratingCount: 3, viewCount: 89,
      status: 'ACTIVE', tags: ['coins', 'collection', 'vintage', 'syrian'],
    },
  ];

  const targetProductCount = 1000;
  let generatedIndex = 0;
  while (productSeeds.length < targetProductCount) {
    const sellerId = sellerIds[generatedIndex % sellerIds.length];
    const categorySlug = categorySlugs[generatedIndex % categorySlugs.length];
    const brand = productBrands[generatedIndex % productBrands.length];
    const adjective = productAdjectives[generatedIndex % productAdjectives.length];
    const noun = productNouns[generatedIndex % productNouns.length];
    const priceBase = 50000 + Math.floor(productRng() * 6000000);
    const quantity = Math.floor(productRng() * 120);
    const ratingAvg = Math.round((3.4 + productRng() * 1.6) * 10) / 10;
    const ratingCount = Math.floor(productRng() * 260);
    const viewCount = Math.floor(productRng() * 8000);
    const condition = conditions[Math.floor(productRng() * conditions.length)];
    const status = productRng() > 0.12 ? 'ACTIVE' : 'PENDING';
    const tag = productTags[Math.floor(productRng() * productTags.length)];

    const title = `${brand} ${adjective} ${noun}`;
    const slug = slugify(`${brand}-${adjective}-${noun}-${generatedIndex + 1}`);

    productSeeds.push({
      title,
      titleAr: title,
      slug,
      description: `${title} built for daily use with reliable quality and local support.`,
      descriptionAr: `${title} بجودة موثوقة واستعمال يومي مع دعم محلي.`,
      price: priceBase,
      quantity,
      condition,
      categorySlug,
      sellerId,
      imgSeed: 1000 + generatedIndex,
      ratingAvg,
      ratingCount,
      viewCount,
      status,
      tags: [brand.toLowerCase(), noun.toLowerCase(), categorySlug, tag],
    });

    generatedIndex += 1;
  }

  const productIdMap: Record<string, string> = {};

  for (const p of productSeeds) {
    const catId = categoryMap[p.categorySlug];
    const existing = await prisma.product.findUnique({ where: { slug: p.slug } });

    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        title: p.title,
        titleAr: p.titleAr,
        price: p.price,
        quantity: p.quantity,
        status: p.status,
        ratingAvg: p.ratingAvg,
        ratingCount: p.ratingCount,
        viewCount: p.viewCount,
        tags: p.tags,
      },
      create: {
        sellerId: p.sellerId,
        title: p.title,
        titleAr: p.titleAr,
        slug: p.slug,
        description: p.description,
        descriptionAr: p.descriptionAr,
        condition: p.condition,
        price: p.price,
        currency: 'SYP',
        quantity: p.quantity,
        status: p.status,
        categoryId: catId || null,
        tags: p.tags,
        ratingAvg: p.ratingAvg,
        ratingCount: p.ratingCount,
        viewCount: p.viewCount,
        score: p.ratingAvg * p.ratingCount + p.viewCount * 0.01,
      },
    });

    productIdMap[p.slug] = product.id;

    // Ensure at least 3 product images
    const existingCount = await prisma.productImage.count({
      where: { productId: product.id },
    });
    for (let i = existingCount; i < 3; i++) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: img(p.imgSeed + i),
          alt: p.titleAr,
          sortOrder: i,
          width: 600,
          height: 600,
        },
      });
    }
  }
  console.log(`✅ ${productSeeds.length} products with images`);

  // ──────────────────────────────────────────────
  // 7. ORDERS (3 orders across sellers, cash)
  // ──────────────────────────────────────────────
  const commissionRate = 0.05;

  // Helper to create an order
  async function createOrder(
    customerId: string,
    sellerId: string,
    items: { slug: string; qty: number }[],
    phone: string,
    address: Record<string, string>,
    status: 'DELIVERED' | 'CONFIRMED' | 'PENDING',
  ) {
    let subtotal = 0;
    const orderItems: {
      productId: string;
      titleSnapshot: string;
      priceSnapshot: number;
      qty: number;
      lineTotal: number;
      commissionRateSnapshot: number;
      commissionAmount: number;
      sellerNetAmount: number;
    }[] = [];

    for (const it of items) {
      const prod = await prisma.product.findUnique({ where: { slug: it.slug } });
      if (!prod) continue;
      const lineTotal = Number(prod.price) * it.qty;
      const commission = lineTotal * commissionRate;
      subtotal += lineTotal;
      orderItems.push({
        productId: prod.id,
        titleSnapshot: prod.titleAr || prod.title,
        priceSnapshot: Number(prod.price),
        qty: it.qty,
        lineTotal,
        commissionRateSnapshot: commissionRate,
        commissionAmount: commission,
        sellerNetAmount: lineTotal - commission,
      });
    }

    const commissionTotal = subtotal * commissionRate;

    // Check if order already exists (use a unique check via notes)
    const noteKey = `seed-${customerId}-${sellerId}-${items.map((i) => i.slug).join(',')}`;
    const existingOrder = await prisma.order.findFirst({
      where: { notes: noteKey },
    });
    if (existingOrder) return existingOrder;

    return prisma.order.create({
      data: {
        customerId,
        sellerId,
        status,
        paymentMethod: 'CASH',
        subtotal,
        commissionTotal,
        total: subtotal,
        deliveryMode: 'ARRANGED',
        deliveryAddress: address,
        phone,
        notes: noteKey,
        items: { create: orderItems },
      },
    });
  }

  // Order 1: سارة buys from seller 1 (electronics) — DELIVERED
  await createOrder(
    customer1.id,
    seller1.id,
    [
      { slug: 'airpods-pro-2', qty: 1 },
      { slug: 'iphone-15-pro-max', qty: 1 },
    ],
    '+963912345678',
    { city: 'دمشق', area: 'المزة', street: 'شارع الحمرا', building: '12' },
    'DELIVERED',
  );

  // Order 2: عمر buys from seller 2 (fashion) — CONFIRMED
  await createOrder(
    customer2.id,
    seller2.id,
    [
      { slug: 'leather-crossbody-bag', qty: 1 },
      { slug: 'casio-g-shock-watch', qty: 1 },
      { slug: 'aleppo-soap-gift-set', qty: 2 },
    ],
    '+963945678901',
    { city: 'حلب', area: 'العزيزية', street: 'شارع النيل', building: '5' },
    'CONFIRMED',
  );

  // Order 3: سارة buys from seller 2 (fashion) — PENDING
  await createOrder(
    customer1.id,
    seller2.id,
    [
      { slug: 'embroidered-abaya', qty: 1 },
      { slug: 'handmade-mosaic-lamp', qty: 2 },
    ],
    '+963912345678',
    { city: 'دمشق', area: 'التجارة', street: 'شارع بغداد', building: '8' },
    'PENDING',
  );

  console.log('✅ 3 orders (delivered + confirmed + pending)');

  // ──────────────────────────────────────────────
  // 8. REVIEWS (for delivered order)
  // ──────────────────────────────────────────────
  // Find the delivered order
  const deliveredOrder = await prisma.order.findFirst({
    where: { customerId: customer1.id, sellerId: seller1.id, status: 'DELIVERED' },
    include: { items: true },
  });

  if (deliveredOrder) {
    for (const item of deliveredOrder.items) {
      const existingReview = await prisma.review.findFirst({
        where: { orderId: deliveredOrder.id, productId: item.productId, customerId: customer1.id },
      });
      if (!existingReview) {
        await prisma.review.create({
          data: {
            orderId: deliveredOrder.id,
            productId: item.productId,
            customerId: customer1.id,
            rating: 5,
            comment: 'منتج ممتاز! التوصيل كان سريع وحالة المنتج مثالية. شكراً لمتجر نور الشام 🌟',
            status: 'APPROVED',
          },
        });
      }
    }
    console.log('✅ Reviews on delivered order');
  }

  // ──────────────────────────────────────────────
  // 9. NOTIFICATIONS for new activity
  // ──────────────────────────────────────────────
  const notifications = [
    {
      userId: admin.id, type: 'ORDER',
      title: 'طلب جديد #1',
      message: 'تم إنشاء طلب جديد بقيمة 8,400,000 ل.س من سارة حسن',
      body: 'طلب إلكترونيات: آيفون 15 + إيربودز',
      entityType: 'Order', entityId: 'seed-order-1',
    },
    {
      userId: admin.id, type: 'ORDER',
      title: 'طلب جديد #2',
      message: 'تم إنشاء طلب جديد بقيمة 1,220,000 ل.س من عمر خليل',
      body: 'طلب أزياء: حقيبة + ساعة + صابون حلبي',
      entityType: 'Order', entityId: 'seed-order-2',
    },
    {
      userId: admin.id, type: 'REVIEW',
      title: 'تقييم جديد ⭐⭐⭐⭐⭐',
      message: 'أضافت سارة حسن تقييم 5 نجوم على آيفون 15 برو ماكس',
      body: 'منتج ممتاز! التوصيل كان سريع',
      entityType: 'Review', entityId: 'seed-review-1',
    },
    {
      userId: seller1User.id, type: 'ORDER',
      title: 'لديك طلب جديد!',
      message: 'طلب من سارة حسن: آيفون 15 برو ماكس + إيربودز برو 2',
      body: 'المبلغ الإجمالي: 8,400,000 ل.س',
      entityType: 'Order', entityId: 'seed-seller1-order',
    },
    {
      userId: seller2User.id, type: 'ORDER',
      title: 'لديك طلبان جديدان!',
      message: 'طلبان جديدان بانتظار التأكيد',
      body: 'من عمر خليل وسارة حسن',
      entityType: 'Order', entityId: 'seed-seller2-orders',
    },
  ];

  for (const n of notifications) {
    const exists = await prisma.notification.findFirst({
      where: { userId: n.userId, entityId: n.entityId },
    });
    if (!exists) {
      await prisma.notification.create({ data: n });
    }
  }
  console.log('✅ Notifications for admin + sellers');

  // ──────────────────────────────────────────────
  // LIVE STREAMS
  // ──────────────────────────────────────────────
  // Get some product IDs for stream products
  const streamProducts = await prisma.product.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, sellerId: true },
    take: 20,
  });

  const seller1Products = streamProducts.filter(p => p.sellerId === seller1.id);
  const seller2Products = streamProducts.filter(p => p.sellerId === seller2.id);

  // Clean up old seeded streams
  await prisma.liveStreamProduct.deleteMany({});
  await prisma.liveStream.deleteMany({});

  // Live stream 1 - Currently LIVE from seller 1
  const stream1 = await prisma.liveStream.create({
    data: {
      sellerId: seller1.id,
      title: 'Flash Sale - Electronics Night',
      titleAr: 'تخفيضات خاطفة - ليلة الإلكترونيات',
      description: 'Huge discounts on phones, laptops and accessories',
      descriptionAr: 'خصومات كبيرة على الهواتف والحواسيب والإكسسوارات',
      status: 'LIVE',
      startedAt: new Date(Date.now() - 45 * 60 * 1000), // Started 45 min ago
      viewerCount: 234,
      peakViewers: 312,
    },
  });

  // Add products to stream 1
  for (let i = 0; i < Math.min(4, seller1Products.length); i++) {
    await prisma.liveStreamProduct.create({
      data: {
        streamId: stream1.id,
        productId: seller1Products[i].id,
        discount: [15, 20, 10, 25][i],
        sortOrder: i,
      },
    });
  }

  // Live stream 2 - Currently LIVE from seller 2
  const stream2 = await prisma.liveStream.create({
    data: {
      sellerId: seller2.id,
      title: 'Fashion Show Live',
      titleAr: 'عرض أزياء مباشر',
      description: 'Latest fashion collection reveal',
      descriptionAr: 'كشف عن أحدث تشكيلة أزياء مع عروض حصرية للمشاهدين',
      status: 'LIVE',
      startedAt: new Date(Date.now() - 20 * 60 * 1000), // Started 20 min ago
      viewerCount: 156,
      peakViewers: 189,
    },
  });

  for (let i = 0; i < Math.min(3, seller2Products.length); i++) {
    await prisma.liveStreamProduct.create({
      data: {
        streamId: stream2.id,
        productId: seller2Products[i].id,
        discount: [30, 20, 15][i],
        sortOrder: i,
      },
    });
  }

  // Live stream 3 - Scheduled for tomorrow
  await prisma.liveStream.create({
    data: {
      sellerId: seller1.id,
      title: 'Tech Unboxing Session',
      titleAr: 'جلسة فتح صناديق تقنية',
      description: 'Unboxing latest tech products',
      descriptionAr: 'فتح أحدث المنتجات التقنية بأسعار حصرية',
      status: 'SCHEDULED',
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    },
  });

  // Live stream 4 - Scheduled for next week
  await prisma.liveStream.create({
    data: {
      sellerId: seller2.id,
      title: 'Handmade Crafts Special',
      titleAr: 'عروض خاصة على المصنوعات اليدوية',
      description: 'Special deals on handmade Syrian crafts',
      descriptionAr: 'عروض خاصة على الحرف اليدوية السورية مع تخفيضات تصل إلى 40%',
      status: 'SCHEDULED',
      scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days out
    },
  });

  // Live stream 5 - Ended (past)
  await prisma.liveStream.create({
    data: {
      sellerId: seller1.id,
      title: 'Gaming Deals Marathon',
      titleAr: 'ماراثون عروض الألعاب',
      description: 'Gaming consoles and accessories deals',
      descriptionAr: 'عروض على أجهزة الألعاب والإكسسوارات',
      status: 'ENDED',
      startedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      endedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      viewerCount: 0,
      peakViewers: 478,
    },
  });

  // Live stream 6 - Ended (yesterday)
  await prisma.liveStream.create({
    data: {
      sellerId: seller2.id,
      title: 'Beauty & Skincare Show',
      titleAr: 'عرض الجمال والعناية بالبشرة',
      description: 'Skincare tips and product deals',
      descriptionAr: 'نصائح للعناية بالبشرة وعروض على منتجات الجمال',
      status: 'ENDED',
      startedAt: new Date(Date.now() - 28 * 60 * 60 * 1000),
      endedAt: new Date(Date.now() - 26 * 60 * 60 * 1000),
      viewerCount: 0,
      peakViewers: 267,
    },
  });

  console.log('✅ 6 Live streams (2 LIVE, 2 SCHEDULED, 2 ENDED)');

  // ──────────────────────────────────────────────
  // DONE
  // ──────────────────────────────────────────────
  console.log('\n🎉 Seed completed successfully!\n');
  console.log('📝 Demo accounts:');
  console.log('┌─────────────┬──────────────────────────┬─────────────────┐');
  console.log('│ Role        │ Email                    │ Password        │');
  console.log('├─────────────┼──────────────────────────┼─────────────────┤');
  console.log(`│ Admin       │ ${ADMIN_EMAIL.padEnd(24)} │ Admin123!@#     │`);
  console.log('│ Seller 1    │ seller1@ses.sy            │ Seller123!@#    │');
  console.log('│ Seller 2    │ seller2@ses.sy            │ Seller123!@#    │');
  console.log('│ Customer 1  │ customer1@ses.sy          │ Customer123!    │');
  console.log('│ Customer 2  │ customer2@ses.sy          │ Customer123!    │');
  console.log('└─────────────┴──────────────────────────┴─────────────────┘');
  console.log('\n⚠️  Change passwords after first login!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
