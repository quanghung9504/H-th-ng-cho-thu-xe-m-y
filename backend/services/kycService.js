const Tesseract = require('tesseract.js');

/**
 * Phân tích ảnh CCCD/GPLX bằng OCR
 * @param {string} imageUrl URL của ảnh từ Cloudinary
 * @returns {Object} { isValid, type, reason }
 */
const analyzeIdentity = async (imageUrl) => {
  try {
    console.log('[KYC-AI] Starting analysis for:', imageUrl);
    
    // Sử dụng tiếng Việt (vie) và tiếng Anh (eng) để quét
    const { data: { text } } = await Tesseract.recognize(
      imageUrl,
      'vie+eng',
      { 
        logger: m => console.log(`[KYC-AI] Progress: ${Math.round(m.progress * 100)}%`) 
      }
    );

    const cleanText = text.toUpperCase();
    console.log('[KYC-AI] Detected Text Snippet:', cleanText.substring(0, 200).replace(/\n/g, ' '));

    // 1. Phân loại và Kiểm tra CCCD (Căn cước công dân)
    const isCCCD = cleanText.includes('CĂN CƯỚC') || 
                   cleanText.includes('CONG DAN') || 
                   cleanText.includes('IDENTITY') || 
                   cleanText.includes('SOCIALIST');

    // 2. Phân loại và Kiểm tra GPLX (Giấy phép lái xe)
    const isGPLX = cleanText.includes('GIẤY PHÉP') || 
                   cleanText.includes('LAI XE') || 
                   cleanText.includes('DRIVING');

    if (isCCCD) {
      return {
        isValid: true,
        type: 'CCCD',
        reason: 'Nhận diện thành công Căn cước công dân.'
      };
    }

    if (isGPLX) {
      return {
        isValid: true,
        type: 'GPLX',
        reason: 'Nhận diện thành công Giấy phép lái xe.'
      };
    }

    // 3. Trường hợp không nhận diện được
    return {
      isValid: false,
      type: 'UNKNOWN',
      reason: 'Ảnh mờ hoặc không phải giấy tờ (CCCD/GPLX) hợp lệ.'
    };

  } catch (error) {
    console.error('[KYC-AI] Error during analysis:', error);
    return {
      isValid: false,
      type: 'ERROR',
      reason: 'Lỗi hệ thống khi xử lý AI. Vui lòng thử lại.'
    };
  }
};

module.exports = { analyzeIdentity };
