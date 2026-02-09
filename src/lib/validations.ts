import { z } from 'zod';

// ============================================
// COMMON SCHEMAS
// ============================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const idSchema = z.object({
  id: z.string().cuid(),
});

export const slugSchema = z.object({
  slug: z.string().min(1).max(255),
});

// ============================================
// AUTH SCHEMAS
// ============================================

export const registerSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
  name: z.string().min(2, 'الاسم مطلوب').max(100),
});

export const loginSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'رمز إعادة التعيين مطلوب'),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
});

// ============================================
// USER SCHEMAS
// ============================================

export const userStatusSchema = z.enum(['PENDING', 'ACTIVE', 'SUSPENDED', 'BANNED']);

export const updateUserStatusSchema = z.object({
  id: z.string().cuid(),
  status: userStatusSchema,
});

// ============================================
// SELLER SCHEMAS
// ============================================

export const sellerProfileSchema = z.object({
  storeName: z.string().min(2, 'اسم المتجر مطلوب').max(100),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, 'الرابط يجب أن يحتوي على أحرف صغيرة وأرقام وشرطات فقط'),
  bio: z.string().max(1000).optional(),
  phone: z.string().max(20).optional(),
});

export const sellerVerificationStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED']);

// ============================================
// CATEGORY SCHEMAS
// ============================================

export const categorySchema = z.object({
  name: z.string().min(1).max(100),
  nameAr: z.string().max(100).optional(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  parentId: z.string().cuid().nullable().optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const updateCategorySchema = categorySchema.partial();

// ============================================
// PRODUCT SCHEMAS
// ============================================

export const productConditionSchema = z.enum(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR']);
export const productStatusSchema = z.enum(['DRAFT', 'PENDING', 'ACTIVE', 'PAUSED', 'BLOCKED']);

export const createProductSchema = z.object({
  title: z.string().min(3, 'العنوان مطلوب').max(200),
  titleAr: z.string().max(200).optional(),
  slug: z.string().min(3).max(200).regex(/^[a-z0-9-]+$/),
  description: z.string().min(10, 'الوصف مطلوب').max(5000),
  descriptionAr: z.string().max(5000).optional(),
  condition: productConditionSchema.default('NEW'),
  price: z.number().positive('السعر يجب أن يكون أكبر من صفر'),
  currency: z.string().default('SYP'),
  quantity: z.number().int().min(0).default(0),
  categoryId: z.string().cuid().optional(),
  brand: z.string().max(100).optional(),
  tags: z.array(z.string()).default([]),
});

export const updateProductSchema = createProductSchema.partial();

// Wizard step schemas for multi-step product creation
export const wizardStep1Schema = z.object({
  title: z.string().min(3, 'العنوان مطلوب (3 أحرف على الأقل)').max(200, 'العنوان طويل جداً'),
  titleAr: z.string().max(200).optional(),
  categoryId: z.string().cuid('يجب اختيار فئة صالحة').optional(),
  brand: z.string().max(100).optional(),
});

export const wizardStep2Schema = z.object({
  description: z.string().min(10, 'الوصف مطلوب (10 أحرف على الأقل)').max(5000),
  descriptionAr: z.string().max(5000).optional(),
  condition: productConditionSchema.default('NEW'),
  tags: z.array(z.string()).max(10, 'أقصى عدد 10 علامات').default([]),
});

export const wizardStep3Schema = z.object({
  price: z.number().positive('السعر يجب أن يكون أكبر من صفر'),
  currency: z.string().default('SYP'),
  quantity: z.number().int().min(0, 'الكمية لا يمكن أن تكون سالبة').default(0),
});

export const wizardStep4Schema = z.object({
  slug: z.string()
    .min(3, 'الرابط مطلوب (3 أحرف على الأقل)')
    .max(200)
    .regex(/^[a-z0-9-]+$/, 'الرابط يجب أن يحتوي على أحرف صغيرة وأرقام وشرطات فقط'),
});

// Bulk edit schema for multiple products
export const bulkEditItemSchema = z.object({
  productId: z.string().cuid(),
  price: z.number().positive().optional(),
  quantity: z.number().int().min(0).optional(),
});

export const bulkEditSchema = z.object({
  items: z.array(bulkEditItemSchema).min(1, 'يجب تحديد منتج واحد على الأقل').max(50, 'أقصى 50 منتج في المرة الواحدة'),
});

// Seller profile update with lowStockThreshold
export const updateSellerSettingsSchema = z.object({
  lowStockThreshold: z.number().int().min(0).max(100).optional(),
});

export const productFilterSchema = z.object({
  q: z.string().optional(),
  categoryId: z.string().cuid().optional(),
  condition: productConditionSchema.optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  sellerId: z.string().cuid().optional(),
  status: productStatusSchema.optional(),
  sort: z.enum(['newest', 'oldest', 'price_asc', 'price_desc', 'rating', 'relevance']).default('relevance'),
}).merge(paginationSchema);

export const productModerationSchema = z.object({
  status: productStatusSchema.optional(),
  pinned: z.boolean().optional(),
  manualBoost: z.number().optional(),
  penaltyScore: z.number().optional(),
});

// ============================================
// PRODUCT IMAGE SCHEMAS
// ============================================

export const productImageSchema = z.object({
  url: z.string().url(),
  alt: z.string().max(255).optional(),
  sortOrder: z.number().int().default(0),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

export const attachImagesSchema = z.object({
  images: z.array(productImageSchema).min(1).max(10),
});

// ============================================
// ORDER SCHEMAS
// ============================================

export const orderStatusSchema = z.enum([
  'PENDING', 'CONFIRMED', 'PACKING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'DISPUTED', 'RESOLVED'
]);

export const deliveryModeSchema = z.enum(['ARRANGED', 'TRACKED']);

export const deliveryAddressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  governorate: z.string().min(1),
  postalCode: z.string().optional(),
  notes: z.string().optional(),
});

export const orderItemSchema = z.object({
  productId: z.string().cuid(),
  qty: z.number().int().positive(),
});

export const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1),
  deliveryMode: deliveryModeSchema.default('ARRANGED'),
  deliveryAddress: deliveryAddressSchema,
  phone: z.string().min(5).max(20),
  notes: z.string().max(500).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: orderStatusSchema,
});

// ============================================
// REVIEW SCHEMAS
// ============================================

export const reviewStatusSchema = z.enum(['PENDING', 'APPROVED', 'HIDDEN']);

export const createReviewSchema = z.object({
  orderId: z.string().cuid(),
  productId: z.string().cuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export const updateReviewStatusSchema = z.object({
  status: reviewStatusSchema,
});

// ============================================
// DISPUTE SCHEMAS
// ============================================

export const disputeStatusSchema = z.enum(['OPEN', 'IN_REVIEW', 'RESOLVED', 'CLOSED']);

export const openDisputeSchema = z.object({
  orderId: z.string().cuid(),
  reason: z.string().min(10).max(2000),
});

export const disputeMessageSchema = z.object({
  disputeId: z.string().cuid(),
  message: z.string().min(1).max(2000),
});

export const resolveDisputeSchema = z.object({
  status: z.enum(['RESOLVED', 'CLOSED']),
  outcome: z.string().min(1).max(2000),
});

// ============================================
// REPORT SCHEMAS
// ============================================

export const targetTypeSchema = z.enum(['USER', 'PRODUCT', 'REVIEW', 'SELLER']);
export const reportStatusSchema = z.enum(['PENDING', 'REVIEWED', 'CLOSED']);

export const createReportSchema = z.object({
  targetType: targetTypeSchema,
  targetId: z.string().cuid(),
  reason: z.string().min(10).max(2000),
});

export const updateReportStatusSchema = z.object({
  status: reportStatusSchema,
});

// ============================================
// ADMIN SETTINGS SCHEMAS
// ============================================

export const rankingWeightsSchema = z.object({
  w_recency: z.number().min(0).max(1),
  w_rating: z.number().min(0).max(1),
  w_orders: z.number().min(0).max(1),
  w_stock: z.number().min(0).max(1),
  w_sellerRep: z.number().min(0).max(1),
});

export const featureFlagsSchema = z.object({
  maxUploadSizeMb: z.number().positive().optional(),
  allowedMimes: z.array(z.string()).optional(),
});

export const updateAdminSettingsSchema = z.object({
  freeMode: z.boolean().optional(),
  globalCommissionRate: z.number().min(0).max(1).optional(),
  rankingWeights: rankingWeightsSchema.partial().optional(),
  seoTemplates: z.record(z.string()).optional(),
  featureFlags: featureFlagsSchema.partial().optional(),
});

// ============================================
// UPLOAD SCHEMAS
// ============================================

export const signUploadSchema = z.object({
  filename: z.string().min(1).max(255),
  mime: z.string().regex(/^image\/(jpeg|png|webp)$/),
  size: z.number().int().positive(),
});

export const confirmUploadSchema = z.object({
  key: z.string().min(1),
});

// ============================================
// AI SCHEMAS
// ============================================

export const moderateListingSchema = z.object({
  title: z.string(),
  description: z.string(),
  category: z.string().optional(),
});

export const optimizeListingSchema = z.object({
  title: z.string(),
  description: z.string(),
  category: z.string().optional(),
});

export const smartSearchSchema = z.object({
  query: z.string().min(1).max(500),
  language: z.enum(['ar', 'en']).default('ar'),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type SellerProfileInput = z.infer<typeof sellerProfileSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductFilterInput = z.infer<typeof productFilterSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type OpenDisputeInput = z.infer<typeof openDisputeSchema>;
export type DisputeMessageInput = z.infer<typeof disputeMessageSchema>;
export type UpdateAdminSettingsInput = z.infer<typeof updateAdminSettingsSchema>;
export type SignUploadInput = z.infer<typeof signUploadSchema>;
export type ConfirmUploadInput = z.infer<typeof confirmUploadSchema>;
export type WizardStep1Input = z.infer<typeof wizardStep1Schema>;
export type WizardStep2Input = z.infer<typeof wizardStep2Schema>;
export type WizardStep3Input = z.infer<typeof wizardStep3Schema>;
export type WizardStep4Input = z.infer<typeof wizardStep4Schema>;
export type BulkEditInput = z.infer<typeof bulkEditSchema>;
export type UpdateSellerSettingsInput = z.infer<typeof updateSellerSettingsSchema>;
