const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const inputPath = path.join(__dirname, '../src/assets/images/BACKGROUND.webp');
const outputPath = path.join(__dirname, '../src/assets/images/BACKGROUND-poster.webp');

async function optimizePoster() {
  try {
    // Kiểm tra file input có tồn tại không
    if (!fs.existsSync(inputPath)) {
      console.error('❌ Không tìm thấy file:', inputPath);
      process.exit(1);
    }

    console.log('🔄 Đang tối ưu ảnh poster...');
    console.log('📥 Input:', inputPath);
    console.log('📤 Output:', outputPath);

    // Resize và tối ưu ảnh
    await sharp(inputPath)
      .resize(1920, 1080, {
        fit: 'cover',
        position: 'center'
      })
      .webp({
        quality: 85,
        effort: 6
      })
      .toFile(outputPath);

    // Lấy thông tin file sau khi tối ưu
    const inputStats = fs.statSync(inputPath);
    const outputStats = fs.statSync(outputPath);
    const inputSizeKB = (inputStats.size / 1024).toFixed(2);
    const outputSizeKB = (outputStats.size / 1024).toFixed(2);
    const savedKB = (inputStats.size - outputStats.size) / 1024;
    const savedPercent = ((savedKB / inputStats.size) * 1024 * 100).toFixed(1);

    console.log('\n✅ Tối ưu thành công!');
    console.log('📊 Kích thước gốc:', inputSizeKB, 'KB (3556x2000px)');
    console.log('📊 Kích thước mới:', outputSizeKB, 'KB (1920x1080px)');
    console.log('💾 Đã tiết kiệm:', savedKB.toFixed(2), 'KB (' + savedPercent + '%)');
    console.log('\n📝 Vui lòng cập nhật code trong homepage.ts:');
    console.log('   videoPoster = \'assets/images/BACKGROUND-poster.webp\';');
  } catch (error) {
    console.error('❌ Lỗi khi tối ưu ảnh:', error.message);
    process.exit(1);
  }
}

optimizePoster();

