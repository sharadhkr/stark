import React from 'react'
import slogo from '../../assets/top.avif'

function Topbox() {
  return (
    <>
      <div className="relative w-full h-14 z-10 mb-4 flex items-end justify-end px-2">
        <div
          className="absolute flex items-center justify-center w-[58%] h-full opacity-75 bg-gray-50 bg-cover bg-center rounded-2xl shadow-[0px_0px_20px_-12px_rgba(0,0,0,1)]"
          style={{ backgroundImage: `url(${slogo})` }}
        >
          {/* You can put text or other content here if needed */}
        </div>
      </div>
    </>
  )
}

export default Topbox
