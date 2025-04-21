import React from 'react';

function Bottom() {
  return (
    <div className="w-full bg-gradient-to-br from-blue-200 to-blue-200  pb-25">
      <hr className="border-t  border-gray-600" />
      <div className=" text-center text-sm text-gray-700 py-4">
        &copy; {new Date().getFullYear()} Stark strips. All rights reserved.
      </div>
    </div>
  );
}

export default Bottom;
