import React from 'react'
import { Routes,Route } from 'react-router-dom'
import Home from './pages/home'
import Login from './pages/login'
import EmailVerify from './pages/EmailVerify'
import ResetPasseord from './pages/resetPassword'
import { ToastContainer } from 'react-toastify';

const App = () => {
  return (
    <div>
<ToastContainer/>

      <Routes>
        <Route path='/' element={<Home/>}></Route>
         <Route path='/login' element={<Login/>}></Route>
         <Route path='/email-verify' element={<EmailVerify/>}></Route>
         <Route path='/reset-password' element={<ResetPasseord/>}></Route>


      </Routes>
    </div>
  )
}

export default App


