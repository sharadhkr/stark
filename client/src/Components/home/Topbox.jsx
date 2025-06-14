import React from 'react'
import slogo from '../../assets/top.jpg'

function Topbox() {
  return (
    <>
      <div className="relative w-full h-14 z-10 mb-4 flex items-end justify-end px-2">
        <div
          className="absolute flex items-center justify-center w-[58%] h-full    bg-gray-50 bg-contain bg-no-repeat bg-center rounded-2xl shadow-[0px_0px_20px_-12px_rgba(0,0,0,1)]"
          style={{ backgroundImage: `url(${slogo})` }}
        >
        </div>
      </div>
    </>
  )
}

export default Topbox