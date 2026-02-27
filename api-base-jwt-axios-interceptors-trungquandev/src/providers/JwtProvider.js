import JWT from 'jsonwebtoken'

/**
 * Funtion tạo mới một token - Cần 3 tham số đầu vào
 * userInfo: Những thông tin muốn đính kèm vào token
 * secretSignature: Chứ ký bí mật (dạng một chuỗi string ngẫu nhiên) trên docs thì để tên là privateKey tùy đều được
 * tokenLife: Thời gian tồn tại của token
 */
const generateToken = async (userInfo, secretSignature, tokenLife) => {
  try {
    // Hàm sign của thư viện Jwt - Thuật toán mặc định là HS256, cứ cho vào code để nhớ kiến thức
    return JWT.sign(userInfo, secretSignature, { algorithm: 'HS256', expiresIn: tokenLife })
  } catch (error) {
    throw new Error(error)
  }
}

/**
 * Funtion kiểm tra một token có hợp lệ hay không
 * Hợp lệ ở đây hiểu đơn giản là cái token được tạo ra có đúng với cái chữ lý bí mật secretSignature trong dự án hay không
 */
const verifyToken = async () => {
  try {
    // Hàm verify của thư viện Jwt
    return JWT.verify(token, secretSignature)
  } catch (error) {
    throw new Error(error)
  }
}

export const JwtProvider = {
  generateToken,
  verifyToken,
}
