import { prisma } from '@/lib/prisma'
import RevenueChart from './RevenueChart'
import AISuggestList from './AISuggestList'

async function getStats() {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - 7)
  weekStart.setHours(0, 0, 0, 0)

  const [revenueToday, invoiceToday, nearExpiry, topProducts, wasteReasons] =
    await Promise.all([
      prisma.invoice.aggregate({
        where: {
          createdAt: { gte: todayStart },
          status: { in: ['PAID', 'DELIVERED'] },
        },
        _sum: { finalAmount: true },
      }),

      prisma.invoice.count({
        where: {
          createdAt: { gte: todayStart },
          status: { in: ['PAID', 'DELIVERED'] },
        },
      }),

      prisma.batch.count({
        where: { status: 'NEAR_EXPIRY', remaining: { gt: 0 } },
      }),

      prisma.invoiceItem.groupBy({
        by: ['productId'],
        where: {
          invoice: {
            createdAt: { gte: weekStart },
            status: { in: ['PAID', 'DELIVERED'] },
          },
        },
        _sum: { subtotal: true, quantity: true },
        orderBy: { _sum: { subtotal: 'desc' } },
        take: 5,
      }),

      prisma.wasteLog.groupBy({
        by: ['reason'],
        where: { createdAt: { gte: weekStart } },
        _sum: { quantity: true },
      }),
    ])

  // Resolve tên sản phẩm
  const productIds = topProducts.map(t => t.productId)
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true },
  })
  const pMap = Object.fromEntries(products.map(p => [p.id, p.name]))
  const maxRev = topProducts[0]?._sum.subtotal ?? 1

  const topList = topProducts.map((t, i) => ({
    rank: i + 1,
    name: pMap[t.productId] ?? '?',
    revenue: Math.round(t._sum.subtotal ?? 0),
    pct: Math.round(((t._sum.subtotal ?? 0) / maxRev) * 100),
  }))

  const totalWasteQty = wasteReasons.reduce(
    (s, w) => s + (w._sum.quantity ?? 0), 0
  )

  return {
    revenueToday: Math.round(revenueToday._sum.finalAmount ?? 0),
    invoiceToday,
    nearExpiry,
    topList,
    totalWasteQty: Math.round(totalWasteQty * 10) / 10,
    wasteReasons,
  }
}

function fmtVND(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'tr'
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'k'
  return n + 'đ'
}

const rankStyle = [
  'bg-yellow-100 text-yellow-800',
  'bg-gray-100 text-gray-600',
  'bg-orange-100 text-orange-700',
]

const wasteLabels: Record<string, string> = {
  EXPIRED: '🕐 Hết hạn',
  DAMAGED: '💥 Hỏng/dập',
  BIOLOGICAL: '🦠 Sinh học',
  OTHER: '❓ Khác',
}

export default async function BaoCaoPage() {
  const {
    revenueToday,
    invoiceToday,
    nearExpiry,
    topList,
    totalWasteQty,
    wasteReasons,
  } = await getStats()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-800">Báo cáo & Thống kê</h1>
        <p className="text-sm text-gray-400 mt-1">
          Dành cho quản lý — cập nhật theo thời gian thực
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Doanh thu hôm nay',
            value: fmtVND(revenueToday),
            icon: '💰',
            sub: 'đã thanh toán',
            warn: false,
          },
          {
            label: 'Hóa đơn hôm nay',
            value: String(invoiceToday),
            icon: '🧾',
            sub: 'hóa đơn',
            warn: false,
          },
          {
            label: 'Hao hụt tuần này',
            value: `${totalWasteQty} kg`,
            icon: '⚠️',
            sub: 'cần xem lại',
            warn: totalWasteQty > 0,
          },
          {
            label: 'Lô sắp hết hạn',
            value: String(nearExpiry),
            icon: '📦',
            sub: 'lô hàng',
            warn: nearExpiry > 0,
          },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">{c.icon}</span>
              <span className="text-xs text-gray-400">{c.label}</span>
            </div>
            <div className={`text-2xl font-semibold ${c.warn ? 'text-red-500' : 'text-gray-800'}`}>
              {c.value}
            </div>
            <div className="text-xs text-gray-400 mt-1">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Revenue chart + Top products */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RevenueChart />

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="text-sm font-medium text-gray-700 mb-4">
            🏆 Top sản phẩm bán chạy{' '}
            <span className="text-xs font-normal text-gray-400">(7 ngày)</span>
          </h3>
          {topList.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Chưa có dữ liệu</p>
          ) : (
            <div className="space-y-3">
              {topList.map(item => (
                <div key={item.rank} className="flex items-center gap-3">
                  <span
                    className={`w-6 h-6 rounded-full text-xs font-medium flex items-center justify-center flex-shrink-0 ${
                      rankStyle[item.rank - 1] ?? 'bg-gray-50 text-gray-500'
                    }`}
                  >
                    {item.rank}
                  </span>
                  <span className="text-sm text-gray-600 w-28 truncate">{item.name}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#1a4d2e] rounded-full"
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-14 text-right">
                    {fmtVND(item.revenue)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Waste + AI suggest */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Hao hụt */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="text-sm font-medium text-gray-700 mb-4">
            🗑️ Báo cáo hao hụt tuần này
          </h3>
          {wasteReasons.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              Không có hao hụt tuần này 🎉
            </p>
          ) : (
            <div className="space-y-3">
              {wasteReasons.map(w => {
                const qty = Math.round((w._sum.quantity ?? 0) * 10) / 10
                const total = Math.max(
                  wasteReasons.reduce((s, r) => s + (r._sum.quantity ?? 0), 0),
                  1
                )
                const pct = Math.round((qty / total) * 100)
                return (
                  <div key={w.reason} className="flex items-center gap-3">
                    <span className="text-sm w-32 text-gray-600 flex-shrink-0">
                      {wasteLabels[w.reason] ?? w.reason}
                    </span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-400 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-20 text-right flex-shrink-0">
                      {qty} kg ({pct}%)
                    </span>
                  </div>
                )
              })}
              <div className="pt-2 border-t border-gray-100 flex justify-between text-sm">
                <span className="text-gray-400">Tổng hao hụt</span>
                <span className="font-medium text-red-500">{totalWasteQty} kg</span>
              </div>
            </div>
          )}
        </div>

        {/* AI suggest */}
        <div className="bg-[#eaf3de] rounded-xl border border-[#c0dd97] p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-[#1a4d2e]">🤖 Gợi ý nhập hàng AI</h3>
            <span className="text-xs text-[#3b6d11] bg-white px-2 py-0.5 rounded-full border border-[#c0dd97]">
              Phân tích 30 ngày
            </span>
          </div>
          <p className="text-xs text-[#3b6d11] mb-3 leading-relaxed">
            Dựa trên lịch sử bán + tỷ lệ hao hụt thực tế. Đề xuất cho 3 ngày tới:
          </p>
          <AISuggestList />
        </div>
      </div>
    </div>
  )
}