import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'ahmadalwakai76@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123!@#';

// Placeholder product images from picsum (royalty-free)
const img = (id: number) => `https://picsum.photos/seed/ses${id}/600/600`;

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
      searchConfig: { advancedEnabled: true, filtersEnabled: true, suggestionsEnabled: true },
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
  // 4. SELLER ACCOUNTS (2 sellers)
  // ──────────────────────────────────────────────
  const sellerPassword = await bcrypt.hash('Seller123!@#', 12);

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
    update: { verificationStatus: 'APPROVED' },
    create: {
      userId: seller1User.id,
      storeName: 'نور الشام للإلكترونيات',
      slug: 'nour-alsham-electronics',
      bio: 'متجر متخصص في الإلكترونيات والأجهزة الذكية. نوفر أحدث المنتجات بأفضل الأسعار مع ضمان وتوصيل لكل سوريا.',
      phone: '+963911234567',
      verificationStatus: 'APPROVED',
      ratingAvg: 4.7,
      ratingCount: 48,
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
    update: { verificationStatus: 'APPROVED' },
    create: {
      userId: seller2User.id,
      storeName: 'بيت الأناقة',
      slug: 'bait-alanaqah',
      bio: 'أزياء عصرية ومجوهرات فاخرة. تشكيلة واسعة من الماركات العالمية والمحلية بأسعار منافسة.',
      phone: '+963933456789',
      verificationStatus: 'APPROVED',
      ratingAvg: 4.5,
      ratingCount: 32,
    },
  });

  console.log('✅ 2 sellers: نور الشام (seller1@ses.sy) + بيت الأناقة (seller2@ses.sy)');

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
  // 6. PRODUCTS (20 products across categories)
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

    // Create product image if it doesn't exist
    const existingImage = await prisma.productImage.findFirst({
      where: { productId: product.id },
    });
    if (!existingImage) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: img(p.imgSeed),
          alt: p.titleAr,
          sortOrder: 0,
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
