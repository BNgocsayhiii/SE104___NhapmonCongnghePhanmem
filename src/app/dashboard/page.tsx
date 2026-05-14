export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Tổng quan</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Doanh thu hôm nay', value: '0 đ', color: 'green' },
          { label: 'Hóa đơn hôm nay', value: '0', color: 'blue' },
          { label: 'Sản phẩm sắp hết hạn', value: '0', color: 'yellow' },
          { label: 'Tổng tồn kho', value: '0', color: 'purple' },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-xl shadow p-6">
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="text-2xl font-bold mt-2">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}