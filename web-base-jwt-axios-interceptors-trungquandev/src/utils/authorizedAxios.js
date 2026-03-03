import axios from 'axios'
import { toast } from 'react-toastify'
import { handleLogoutAPI, refreshTokenAPI } from '~/api'

// Khởi tạo một đối tượng Axios (authorizedAxiosInstance) mục đích để custom và cấu hình chung cho dự án.

let authorizedAxiosInstance = axios.create()
// Thời gia chờ tối đa của một request: để 10 phút
authorizedAxiosInstance.defaults.timeout = 10 * 60 * 1000

// withCredentials: Sẽ cho phép axios tự động đính kèm và gửi cookie trong mỗi request lên BE (phục vụ trường hợp nếu chúng ta lưu JWT tokens (refresh & access) theo cơ chế httpOnly Cookie)
authorizedAxiosInstance.defaults.withCredentials = true

/**
 * Cấu hình Interceptors (Bộ đánh chặn vào giữa mọi Request & Response)
 */
// Add a request interceptor: Can thiệp vào giữa những cái request API
authorizedAxiosInstance.interceptors.request.use((config) => {
  // Lấy accessToken từ localstorage và dính kèm vào header.
  const accessToken = localStorage.getItem('accessToken')
  if (accessToken) {
    // Cần thêm "Baerer" vì chúng ta nêm tuân thủ theo tiêu chuẩn OAuth 2.0 trong việc xác định loại token đang sử dụng
    // Baerer là định nghĩa loại token dành dành cho việc xác thực và ủy quyền, tham khảo các loại token khác như: Basic token, Digest token, OAuth token,...vv
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
}, (error) => {
  // Do something with request error
  return Promise.reject(error)
})

// Khởi tạo một cái promise cho việc gọi api refresh_token
// Mục đích tạo Promise này để khi nhận yêu cầu refreshToken đầu tiên thì hold lại việc gọi API refresh_token cho tới khi xong xuôi thì mới retry lại những api bị lỗi trước đó thay vì cứ thế gọi lại refreshTokenAPI liên tục với mỗi request lỗi.
let refreshTokenPromise = null

// Add a response interceptor: Can thiệp vào giữa những cái response nhận về từ API
authorizedAxiosInstance.interceptors.response.use((response) => {
  // Any status code that lie within the range of 2xx cause this function to trigger
  /* Mọi mã http status code nằm trong khoảng 200 - 299 sẽ là success và rơi vào đây */
  // Do something with response data
  return response
}, (error) => {
  // Any status codes that falls outside the range of 2xx cause this function to trigger
  /* Mọi mã http status code nằm ngoài khoảng 200 - 299 sẽ là error và rơi vào đây */
  // Do something with response error

  /** Khu vực Quan trọng: Xử lý Refresh Token tự động */
  // Nếu như nhận mã 401 từ BE, thì gọi api logout luôn
  if (error.response?.status === 401) {
    handleLogoutAPI().then(() => {
      // Nếu trường hợp dùng cookie thì nhớ xóa userInfo trong localstorege
      // localStorage.removeItem('userInfo')

      // Cuối cùng điều hướng tới trang Login sau khi logout thành công
      location.href = '/login'
    })
  }
  // Nếu như nhận mã 410 từ BE, thì sẽ gọi api refresh token để làm mới lại accessToken
  // Đầu tiên lấy được các requst API đang bị lỗi thông qua error.config
  const originalRequest = error.config
  // console.log('originalRequest: ', originalRequest)
  if (error.response?.status === 410 && originalRequest) {
    if (!refreshTokenPromise) {
      // Lấy refreshToken từ localstorage (cho trường hợp localstorage)
      const refreshToken = localStorage.getItem('refreshToken')
      // Gọi API refreshToken
      refreshTokenPromise = refreshTokenAPI(refreshToken)
        .then((res) => {
          // Lấy và gán lại accessToken vào localstorage (cho trường hợp localstorage)
          const { accessToken } = res.data
          localStorage.setItem('accessToken', accessToken)
          authorizedAxiosInstance.defaults.headers.Authorization = `Bearer ${accessToken}`

          // Đồng thời lưu ý là accessToken cũng đã được update lại ở Cookie rồi nhé (cho trường hợp cookie)
          //...
        })
        .catch((error) => {
          // Nếu nhận được bất kỳ lỗi nào từ api refresh token thì cứ logout luôn
          handleLogoutAPI().then(() => {
            // Nếu trường hợp dùng cookie thì nhớ xóa userInfo trong localstorege
            // localStorage.removeItem('userInfo')

            // Cuối cùng điều hướng tới trang Login sau khi logout thành công
            location.href = '/login'
          })
          return Promise.reject(error)
        })
        .finally(() => {
          // Dù API refresh_token có thành công hay lỗi thì vẫn luôn gán lại cái refreshTokenPromise về null như ban đầu
          refreshTokenPromise = null
        })
    }
    
    // Cuối cùng mới return cái refreshTokenPromise trong trường hợp success ở đây
    return refreshTokenPromise.then(() => {
      // Quan trọng: return lại axios instance để chúng ta kết hợp cái originalConfig để gọi lại những api ban đầu bị lỗi
      return authorizedAxiosInstance(originalRequest)
    })
    
  }

  // Xử lý tập trung phần hiển thị thông báo lỗi trả về từ mọi API ở đây (viết code 1 lần: Clean Code)
  // console.log(error) ra là sẽ thấy cấu trúc data dẫn tới message lỗi như dưới đây
  // Dùng toastify để hiển thị bất kể mọi mã lỗi lên màn hình - Ngoài trừ mã 410 - GONE phục vụ việc tự động refresh lại token.
  if (error.response?.status !== 410) {
    toast.error(error.response?.data?.message || error?.message) 
  }

  return Promise.reject(error)
})

export default authorizedAxiosInstance

