import { StatusCodes } from "http-status-codes"
import { JwtProvider, ACCESS_TOKEN_SECRET_SIGNATURE } from "~/providers/JwtProvider"

// Middleware này sẽ đảm nhiệm việc quan trọng: Lấy và xác thực cái JWT accessToken nhận được từ phía FE có hợp lệ hay không
// Chỉ sử dụng một trong 2 cách lấy token thôi nhé.
const isAuthorized = async (req, res, next) => {
  // Cách 1: Lấy accessToken nằm tỏng request cookies phía Client - withCredentials trong file authorizeAxios và credentials trong CORS
  const accessTokenFromCookie = req.cookies?.accessToken
  if (!accessTokenFromCookie) {
    res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized! (token not found)' })
    return
  }
  // console.log('accessTokenFromCookie: ', accessTokenFromCookie)
  // console.log('------------------------------')

  // Cách 2: Lấy accessToken trong trường hợp phía FE lưu localstorage và gửi lên thông qua header authorization
  const accessTokenFromHeader = req.headers?.authorization
  if (!accessTokenFromHeader) {
    res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized! (token not found)' })
    return
  }
  // console.log('accessTokenFromHeader: ', accessTokenFromHeader)
  // console.log('------------------------------')
  // console.log('accessTokenFromHeader.split: ', accessTokenFromHeader.split(' ')[1])
  // console.log('------------------------------')

  try {
    // Bước 1: Thực hiện giải mã token xem có có hợp lệ hay không
    const accessTokenDecoded = await JwtProvider.verifyToken(
      // accessTokenFromCookie, // Dùng token theo cách 1 ở trên
      accessTokenFromHeader.split(' ')[1], // Dùng token theo cách 2 ở trên
      ACCESS_TOKEN_SECRET_SIGNATURE
    )

    // Bước 2: Quan trọng: Nếu như cái token hợp lệ, thì sẽ cần phải lưu thông tin giải mã được vào cái req.jwtDecoded, để sử dụng cho các tầng cần xử lý ở phía sau
    req.jwtDecoded = accessTokenDecoded
    // console.log('accessTokenDecoded: ', accessTokenDecoded)

    // Bước 3: Cho phép cái request đi tiếp 
    next()
  } catch (error) {
    // console.log('Error in authMiddleware: ', error)

    // Trường hợp lỗi 01: Nếu cái accessToken nó bị hết hạn (expired) thì mình cần trả về một cái mã lỗi GONE - 410 chp phía FE biết để gọi api refreshToken
    if (error.message?.includes('jwt expired')) {
      res.status(StatusCodes.GONE).json({ message: 'Need to refresh token!' })
      return
    }
    // Trường hợp lỗi 02: Nếu như cái accessToken nó không hợp lệ do bất kỳ điều gì khác trường hợp hết hạn thì chúng ta cứ thẳng tay trả về mã 401 cho phía FE xử lý Logout / hoặc gọi API Logout tùy trường hợp
    res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized! Please login.' })
  }

}

export const authMiddleware = {
  isAuthorized
}

