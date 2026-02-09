import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'ahmadalwakai76@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123!@#';

async function main() {
  console.log('🌱 Starting database seed...');
  
  // Create admin user
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);
  
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      role: 'ADMIN',
      status: 'ACTIVE',
    },
    create: {
      email: ADMIN_EMAIL,
      name: 'Admin',
      password: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });
  
  console.log(`✅ Admin user created/updated: ${admin.email}`);
  
  // Create admin settings singleton
  const settings = await prisma.adminSettings.upsert({
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
      navConfig: {
        categories: [],
        showAll: true,
      },
      cookieConsentConfig: {
        analytics: false,
        marketing: false,
        functional: true,
      },
      searchConfig: {
        advancedEnabled: true,
        filtersEnabled: true,
        suggestionsEnabled: true,
      },
    },
  });
  
  console.log('✅ Admin settings created/updated');
  
  // Create welcome notification for admin
  const existingNotification = await prisma.notification.findFirst({
    where: { userId: admin.id, type: 'SYSTEM' },
  });
  if (!existingNotification) {
    await prisma.notification.create({
      data: {
        userId: admin.id,
        type: 'SYSTEM',
        title: 'مرحباً بك في لوحة تحكم SES',
        message: 'تم إعداد نظام الإدارة بنجاح. يمكنك الآن إدارة الموقع من هنا.',
        body: 'تم إعداد نظام الإدارة بنجاح. يمكنك الآن إدارة الموقع من هنا.',
        entityType: 'AdminSettings',
        entityId: 'singleton',
      },
    });
    console.log('✅ Admin welcome notification created');
  }
  
  // Create base categories
  const categories = [
    { name: 'Electronics', nameAr: 'إلكترونيات', slug: 'electronics', sortOrder: 1 },
    { name: 'Clothing', nameAr: 'ملابس', slug: 'clothing', sortOrder: 2 },
    { name: 'Home & Garden', nameAr: 'المنزل والحديقة', slug: 'home-garden', sortOrder: 3 },
    { name: 'Sports', nameAr: 'رياضة', slug: 'sports', sortOrder: 4 },
    { name: 'Books', nameAr: 'كتب', slug: 'books', sortOrder: 5 },
    { name: 'Toys', nameAr: 'ألعاب', slug: 'toys', sortOrder: 6 },
    { name: 'Health & Beauty', nameAr: 'صحة وجمال', slug: 'health-beauty', sortOrder: 7 },
    { name: 'Automotive', nameAr: 'سيارات', slug: 'automotive', sortOrder: 8 },
    { name: 'Food & Beverages', nameAr: 'طعام ومشروبات', slug: 'food-beverages', sortOrder: 9 },
    { name: 'Other', nameAr: 'أخرى', slug: 'other', sortOrder: 100 },
  ];
  
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { sortOrder: cat.sortOrder },
      create: {
        name: cat.name,
        nameAr: cat.nameAr,
        slug: cat.slug,
        sortOrder: cat.sortOrder,
        isActive: true,
      },
    });
  }
  
  console.log(`✅ ${categories.length} base categories created/updated`);
  
  // Create subcategories for Electronics
  const electronicsParent = await prisma.category.findUnique({
    where: { slug: 'electronics' },
  });
  
  if (electronicsParent) {
    const electronicsSubs = [
      { name: 'Phones', nameAr: 'هواتف', slug: 'phones', sortOrder: 1 },
      { name: 'Computers', nameAr: 'حواسيب', slug: 'computers', sortOrder: 2 },
      { name: 'Tablets', nameAr: 'أجهزة لوحية', slug: 'tablets', sortOrder: 3 },
      { name: 'Accessories', nameAr: 'إكسسوارات', slug: 'electronics-accessories', sortOrder: 4 },
      { name: 'TVs', nameAr: 'تلفزيونات', slug: 'tvs', sortOrder: 5 },
    ];
    
    for (const sub of electronicsSubs) {
      await prisma.category.upsert({
        where: { slug: sub.slug },
        update: { sortOrder: sub.sortOrder, parentId: electronicsParent.id },
        create: {
          name: sub.name,
          nameAr: sub.nameAr,
          slug: sub.slug,
          sortOrder: sub.sortOrder,
          parentId: electronicsParent.id,
          isActive: true,
        },
      });
    }
    
    console.log(`✅ ${electronicsSubs.length} electronics subcategories created/updated`);
  }
  
  // Create subcategories for Clothing
  const clothingParent = await prisma.category.findUnique({
    where: { slug: 'clothing' },
  });
  
  if (clothingParent) {
    const clothingSubs = [
      { name: "Men's Clothing", nameAr: 'ملابس رجالية', slug: 'mens-clothing', sortOrder: 1 },
      { name: "Women's Clothing", nameAr: 'ملابس نسائية', slug: 'womens-clothing', sortOrder: 2 },
      { name: "Kids' Clothing", nameAr: 'ملابس أطفال', slug: 'kids-clothing', sortOrder: 3 },
      { name: 'Shoes', nameAr: 'أحذية', slug: 'shoes', sortOrder: 4 },
      { name: 'Accessories', nameAr: 'إكسسوارات', slug: 'clothing-accessories', sortOrder: 5 },
    ];
    
    for (const sub of clothingSubs) {
      await prisma.category.upsert({
        where: { slug: sub.slug },
        update: { sortOrder: sub.sortOrder, parentId: clothingParent.id },
        create: {
          name: sub.name,
          nameAr: sub.nameAr,
          slug: sub.slug,
          sortOrder: sub.sortOrder,
          parentId: clothingParent.id,
          isActive: true,
        },
      });
    }
    
    console.log(`✅ ${clothingSubs.length} clothing subcategories created/updated`);
  }
  
  console.log('');
  console.log('🎉 Seed completed successfully!');
  console.log('');
  console.log('📝 Admin credentials:');
  console.log(`   Email: ${ADMIN_EMAIL}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);
  console.log('');
  console.log('⚠️  Change the admin password after first login!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
