import { z } from 'zod'

const phoneSchema = z
  .string()
  .trim()
  .regex(/^0\d{9}$/, 'Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0')

const optionalEmailSchema = z
  .string()
  .trim()
  .email('Email không hợp lệ')
  .optional()
  .or(z.literal(''))
  .transform(value => value || undefined)

export const roleSchema = z.enum(['MANAGER', 'STAFF_SALES', 'STAFF_WAREHOUSE'])

export const userCreateSchema = z.object({
  username: z.string().trim().min(1, 'Tên đăng nhập không được để trống'),
  fullName: z.string().trim().min(1, 'Họ tên không được để trống'),
  phone: phoneSchema.optional().or(z.literal('')).transform(value => value || undefined),
  email: optionalEmailSchema,
  role: roleSchema.default('STAFF_SALES'),
  password: z
    .string()
    .min(8, 'Mật khẩu tối thiểu 8 ký tự')
    .regex(/[A-Za-z]/, 'Mật khẩu cần có ít nhất 1 chữ cái')
    .regex(/\d/, 'Mật khẩu cần có ít nhất 1 chữ số'),
})

export const userUpdateSchema = z.object({
  id: z.string().min(1, 'Thiếu tài khoản cần cập nhật'),
  fullName: z.string().trim().min(1, 'Họ tên không được để trống'),
  phone: phoneSchema.optional().or(z.literal('')).transform(value => value || undefined),
  email: optionalEmailSchema,
  role: roleSchema.optional(),
  password: z
    .string()
    .min(8, 'Mật khẩu tối thiểu 8 ký tự')
    .regex(/[A-Za-z]/, 'Mật khẩu cần có ít nhất 1 chữ cái')
    .regex(/\d/, 'Mật khẩu cần có ít nhất 1 chữ số')
    .optional()
    .or(z.literal(''))
    .transform(value => value || undefined),
})

export const userStatusSchema = z.object({
  id: z.string().min(1, 'Thiếu tài khoản cần cập nhật'),
  status: z.enum(['ACTIVE', 'INACTIVE']),
})

export const supplierSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, 'Tên nhà cung cấp không được để trống'),
  contactName: z.string().trim().optional().or(z.literal('')).transform(value => value || undefined),
  email: optionalEmailSchema,
  phone: phoneSchema,
  address: z.string().trim().optional().or(z.literal('')).transform(value => value || undefined),
})

export const customerSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, 'Tên khách hàng không được để trống'),
  phone: phoneSchema,
  email: optionalEmailSchema,
  address: z.string().trim().optional().or(z.literal('')).transform(value => value || undefined),
})

export const productSchema = z.object({
  id: z.string().optional(),
  sku: z.string().trim().min(1, 'SKU không được để trống'),
  name: z.string().trim().min(1, 'Tên loại quả không được để trống'),
  description: z.string().trim().optional().or(z.literal('')).transform(value => value || undefined),
  imageUrl: z.string().trim().url('URL ảnh không hợp lệ').optional().or(z.literal('')).transform(value => value || undefined),
  unit: z.string().trim().min(1, 'Đơn vị tính không được để trống'),
  currentPrice: z.coerce.number().positive('Giá bán phải lớn hơn 0'),
  evaporationRate: z.coerce.number().min(0, 'Tỷ lệ bay hơi không được âm'),
  shelfLifeDays: z.coerce.number().int().positive('Thời gian tươi phải lớn hơn 0'),
  categoryId: z.string().min(1, 'Thiếu danh mục sản phẩm'),
  status: z.enum(['ACTIVE', 'DISCONTINUED']).optional(),
})

export const invoiceItemSchema = z.object({
  productId: z.string().min(1, 'Thiếu sản phẩm'),
  batchId: z.string().optional(),
  quantity: z.coerce.number().positive('Số lượng bán phải lớn hơn 0'),
})

export const invoiceCreateSchema = z.object({
  customerId: z.string().optional(),
  customer: customerSchema.partial({ id: true }).optional(),
  items: z.array(invoiceItemSchema).min(1, 'Hóa đơn cần có ít nhất 1 sản phẩm'),
  discountPercent: z.coerce.number().min(0).max(100).default(0),
  pointsUsed: z.coerce.number().int().min(0).default(0),
  shippingFee: z.coerce.number().min(0).default(0),
  paymentMethod: z.enum(['CASH', 'QR', 'CARD', 'COD', 'BANK_TRANSFER']).default('CASH'),
  channel: z.enum(['POS', 'ONLINE']).default('POS'),
  shippingAddress: z.string().trim().optional().or(z.literal('')).transform(value => value || undefined),
})

export const warehouseImportSchema = z.object({
  supplierId: z.string().min(1, 'Thiếu nhà cung cấp'),
  productId: z.string().min(1, 'Thiếu sản phẩm').optional(),
  quantity: z.coerce.number().positive('Số lượng nhập phải lớn hơn 0').optional(),
  importPrice: z.coerce.number().positive('Giá nhập phải lớn hơn 0').optional(),
  packagedAt: z.coerce.date().optional(),
  lines: z.array(z.object({
    productId: z.string().min(1, 'Thiếu sản phẩm'),
    quantity: z.coerce.number().positive('Số lượng nhập phải lớn hơn 0'),
    importPrice: z.coerce.number().positive('Giá nhập phải lớn hơn 0'),
    packagedAt: z.coerce.date(),
  })).optional(),
  note: z.string().trim().optional().or(z.literal('')).transform(value => value || undefined),
}).refine(value => (value.lines && value.lines.length > 0) || (value.productId && value.quantity && value.importPrice && value.packagedAt), {
  message: 'Phiếu nhập cần có ít nhất 1 dòng sản phẩm',
})

export const stockAdjustmentSchema = z.object({
  batchId: z.string().min(1, 'Thiếu lô hàng'),
  after: z.coerce.number().min(0, 'Tồn thực tế không được âm'),
  reason: z.string().trim().min(1, 'Vui lòng nhập lý do điều chỉnh'),
})

export const wasteCreateSchema = z.object({
  batchId: z.string().min(1, 'Thiếu lô hàng'),
  quantity: z.coerce.number().positive('Số lượng hủy phải lớn hơn 0'),
  reason: z.enum(['EXPIRED', 'DAMAGED', 'BIOLOGICAL', 'PROMOTION', 'OTHER']),
  note: z.string().trim().optional().or(z.literal('')).transform(value => value || undefined),
}).refine(value => value.reason !== 'OTHER' || Boolean(value.note), {
  message: 'Vui lòng ghi rõ lý do khác',
  path: ['note'],
})

export function formatZodError(error: z.ZodError) {
  return error.issues.map(issue => issue.message).join(', ')
}
