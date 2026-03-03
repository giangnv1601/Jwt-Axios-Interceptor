import authorizedAxiosInstance from "~/utils/authorizedAxios"
import { API_ROOT } from '~/utils/constants'

export const handleLogoutAPI = async () => {
  // Với trường hợp 01: Dùng localstorage --> chỉ xóa thông tin user trong localstorage phía FE
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('userInfo')
  
  // Với trường hợp 02: Dùng httpOnly cookie --> Gọi API để xử lý remove Cookies
  return await authorizedAxiosInstance.delete(`${API_ROOT}/v1/users/logout`)
}

export const refreshTokenAPI = async (refreshToken) => {
  return await authorizedAxiosInstance.put(`${API_ROOT}/v1/users/refresh_token`, { refreshToken })
}
