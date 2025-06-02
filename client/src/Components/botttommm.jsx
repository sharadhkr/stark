import React from 'react'
import Logo from '../assets/slogooo.png'

function Botttommm() {
  return (
    <div className="w-full bg-gradient-to-br from-violet-100 to-violet-300 pb-28 relative z-10 overflow-hidden">
      {/* Background image with lower z-index */}
      <img
        className="absolute w-32 opacity-40 rotate-12 drop-shadow-sm -translate-x-1/2 left-1/2 top-4 z-0"
        src={Logo}
        alt="Background Logo"
      />

      {/* Divider */}
      <hr className="border-t border-gray-600 z-10 relative" />

      {/* Footer Text */}
      <div className="text-center text-sm text-gray-600 pt-8 font-semibold z-10 relative">
        © {new Date().getFullYear()} Stark strips. All rights reserved.
      </div>
      <div className="text-center text-sm text-gray-600 pt-1 font-semibold z-10 relative">
        +91-7724974347 | stark@gmail.coom
      </div>
    </div>
  )
}

export default Botttommm