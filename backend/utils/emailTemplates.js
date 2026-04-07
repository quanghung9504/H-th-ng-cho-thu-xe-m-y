const getHeader = () => `
  <div style="background: #050508; padding: 40px 20px; text-align: center; border-bottom: 1px solid #1a1a2e;">
    <h1 style="color: #00f0ff; margin: 0; font-size: 28px; font-family: 'Outfit', sans-serif; letter-spacing: 2px;">RIDE <span style="color: #ffffff;">FREEDOM</span></h1>
    <p style="color: #64748b; margin-top: 10px; font-size: 14px;">Bản lĩnh trên mọi cung đường</p>
  </div>
`;

const getFooter = () => `
  <div style="background: #050508; padding: 40px 20px; text-align: center; border-top: 1px solid #1a1a2e; color: #64748b; font-size: 12px;">
    <p>© 2026 Ride Freedom Motorbike Rental. All rights reserved.</p>
    <p>Địa chỉ: 123 Đường Số 1, Quận 1, TP. Hồ Chí Minh</p>
    <div style="margin-top: 20px;">
      <a href="#" style="color: #00f0ff; text-decoration: none; margin: 0 10px;">Chính sách bảo mật</a>
      <a href="#" style="color: #00f0ff; text-decoration: none; margin: 0 10px;">Điều khoản dịch vụ</a>
    </div>
  </div>
`;

exports.otpTemplate = (userName, otp) => `
  <div style="background-color: #0a0a0f; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; color: #e2e8f0; border: 1px solid #1e293b;">
    ${getHeader()}
    <div style="padding: 50px 40px;">
      <h2 style="color: #ffffff; font-size: 22px; margin-bottom: 20px;">Xác thực tài khoản của bạn</h2>
      <p style="line-height: 1.6;">Chào <strong>${userName}</strong>,</p>
      <p style="line-height: 1.6;">Cảm ơn bạn đã lựa chọn Ride Freedom. Để hoàn tất quy trình, vui lòng sử dụng mã OTP dưới đây để xác thực:</p>
      
      <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 30px; text-align: center; border-radius: 12px; margin: 40px 0; border: 1px solid #334155;">
        <span style="font-size: 42px; font-weight: 800; color: #00f0ff; letter-spacing: 12px; font-family: monospace;">${otp}</span>
      </div>
      
      <p style="font-size: 13px; color: #64748b; text-align: center;">Mã này sẽ hết hạn sau 10 phút. Tuyệt đối không chia sẻ mã này với bất kỳ ai.</p>
    </div>
    ${getFooter()}
  </div>
`;

exports.orderConfirmationTemplate = (userName, order) => `
  <div style="background-color: #0a0a0f; font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; color: #e2e8f0; border: 1px solid #1e293b;">
    ${getHeader()}
    <div style="padding: 40px;">
      <h2 style="color: #00e676; font-size: 20px;">ĐẶT XE THÀNH CÔNG!</h2>
      <p>Cảm ơn ${userName}, đơn hàng <strong>${order.orderCode}</strong> đang được xử lý.</p>
      
      <div style="background: #0f172a; padding: 25px; border-radius: 12px; margin: 30px 0; border: 1px solid #1e293b;">
        <h3 style="color: #ffffff; font-size: 16px; margin-top: 0; border-bottom: 1px solid #1e293b; padding-bottom: 15px;">Chi tiết hành trình</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Mẫu xe</td>
            <td style="padding: 8px 0; text-align: right; color: #ffffff; font-weight: bold;">${order.vehicleName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Thời gian</td>
            <td style="padding: 8px 0; text-align: right; color: #ffffff;">${new Date(order.startDate).toLocaleDateString('vi-VN')} - ${new Date(order.endDate).toLocaleDateString('vi-VN')}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Tổng cộng</td>
            <td style="padding: 8px 0; text-align: right; color: #00f0ff; font-weight: 800; font-size: 18px;">${order.totalAmount.toLocaleString()} VNĐ</td>
          </tr>
        </table>
      </div>
      
      <p style="font-size: 13px; color: #64748b;">Vui lòng chuẩn bị CCCD/GPLX bản gốc để đối chiếu khi nhận xe.</p>
      <div style="text-align: center; margin-top: 30px;">
        <a href="${process.env.CLIENT_URL}/my-orders" style="background: #00f0ff; color: #050508; padding: 12px 30px; border-radius: 30px; text-decoration: none; font-weight: bold; font-size: 14px;">Theo dõi đơn hàng</a>
      </div>
    </div>
    ${getFooter()}
  </div>
`;

exports.kycResultTemplate = (userName, status, reason) => `
  <div style="background-color: #0a0a0f; font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; color: #e2e8f0; border: 1px solid #1e293b;">
    ${getHeader()}
    <div style="padding: 40px;">
      <h2 style="color: ${status === 'VERIFIED' ? '#00e676' : '#ff5252'}; font-size: 20px;">
        KẾT QUẢ XÁC MINH DANH TÍNH
      </h2>
      <p>Chào ${userName},</p>
      <p>Hồ sơ định danh của bạn đã được Admin xem xét:</p>
      
      <div style="background: #0f172a; padding: 30px; border-radius: 12px; margin: 30px 0; border: 1px solid #1e293b; text-align: center;">
        <span style="font-size: 18px; font-weight: bold; color: ${status === 'VERIFIED' ? '#00e676' : '#ff5252'};">
          ${status === 'VERIFIED' ? 'CHÚC MỪNG! HỒ SƠ ĐÃ ĐƯỢC DUYỆT' : 'YÊU CẦU BỊ TỪ CHỐI'}
        </span>
        ${reason ? `<p style="color: #ff5252; font-size: 14px; margin-top: 15px;">Lý do: ${reason}</p>` : ''}
      </div>
      
      <p style="line-height: 1.6;">
        ${status === 'VERIFIED' 
          ? 'Hiện tại bạn đã có thể tham gia săn cọc và thuê xe trên toàn hệ thống Ride Freedom.' 
          : 'Vui lòng kiểm tra lại ảnh chụp CCCD/GPLX rõ nét và thực hiện gửi lại hồ sơ.'}
      </p>
    </div>
    ${getFooter()}
  </div>
`;
