// app/path-to-your-page/page.tsx

export default function TestPage() {
  return (
    <div style={{ 
      padding: '20px', 
      margin: '20px', 
      border: '2px dashed #0070f3', 
      borderRadius: '8px',
      backgroundColor: '#f0f8ff',
      color: '#0070f3',
      fontWeight: 'bold',
      textAlign: 'center'
    }}>
      🎯 Đã dẫn đúng đường! Đây là trang: 
      <code style={{ 
        marginLeft: '10px', 
        padding: '2px 6px', 
        backgroundColor: '#eaeaea', 
        borderRadius: '4px',
        color: '#333' 
      }}>
        {/* Thay tên thư mục hoặc đường dẫn của trang vào đây để dễ nhận biết */}
        /ten-thu-muc-cua-trang
      </code>
    </div>
  );
}