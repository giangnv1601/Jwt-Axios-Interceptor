import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import Login from '~/pages/Login'
import Dashboard from '~/pages/Dashboard'

/**
 * Giải pháp Clean Code trong việc xác định các route nào cần đăng nhập tài khoản xong thì mới cho truy cập
 * Sử dụng <Outlet /> của react-router-dom để hiển thị các Child Route (xem cách sử dụng trong App() bên dưới)
 * https://reactrouter.com/en/main/components/outlet
 * Một bài hướng dẫn khá đầy dủ:
 * https://www.robinwieruch.de/react-router-private-routes/
 */
const ProtectedRoutes = () => {
  const user = JSON.parse(localStorage.getItem('userInfo'))
  console.log('ProtectedRoute user: ', user)  
  if (!user) return <Navigate to="/login" replace={true} />
  return <Outlet />
}

const UnthorizedRoutes = () => {
  const user = JSON.parse(localStorage.getItem('userInfo'))
  if (user) return <Navigate to="/dashboard" replace={true} />
  return <Outlet />
}

function App() {
  return (
    <Routes>
      <Route path='/' element={
        <Navigate to="/login" replace={true} />
      } />
      
      <Route element={<UnthorizedRoutes />}>
        {/* <Outlet /> của react-router-dom sẽ chạy vào các child route trong này */}
        <Route path='/login' element={<Login />} />
        {/* Sau này sẽ còn nhiều Route nữa ở đây ...vv */}
      </Route>

      <Route element={<ProtectedRoutes />}>
        {/* <Outlet /> của react-router-dom sẽ chạy vào các child route trong này */}
        <Route path='/dashboard' element={<Dashboard />} />
        {/* Sau này sẽ còn nhiều Route nữa ở đây ...vv */}
      </Route>
    </Routes>
  )
}

export default App
