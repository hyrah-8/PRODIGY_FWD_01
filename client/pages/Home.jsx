import React, { useContext } from 'react'
import Navebar from '../components/Navebar'
import Header from '../components/Header'


const home = () => {

  
  return (
    <div className='flex flex-col items-center justify-center min-h-screen
bg-[url("/bg_img.png")] bg-cover bg-center'>
      <Navebar/>
      <Header/>
    </div>
  )
}

export default home
