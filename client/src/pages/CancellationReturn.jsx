import React from 'react';

const CancellationReturn = () => {
  return (
    <div className="p-4 max-w-3xl mx-auto text-gray-800">
      <h1 className="text-2xl font-semibold mb-4">Cancellation & Return Policy</h1>
      <p className="mb-3">
        At Starkk.shop, we strive to ensure you have the best shopping experience. If you are not entirely satisfied with your purchase, we're here to help.
      </p>
      <h2 className="text-lg font-semibold mt-4 mb-2">Cancellation</h2>
      <ul className="list-disc list-inside space-y-1">
        <li>You can cancel an order within 24 hours of placing it.</li>
        <li>Orders cannot be canceled once shipped.</li>
        <li>To cancel, go to "My Orders" and click on "Cancel Order".</li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">Returns</h2>
      <ul className="list-disc list-inside space-y-1">
        <li>Returns are accepted within 7 days of delivery.</li>
        <li>Products must be unused, in original packaging, and with tags.</li>
        <li>Return pickup will be arranged once request is approved.</li>
        <li>Refunds are processed within 5–7 business days after product inspection.</li>
      </ul>

      <p className="mt-6">For further assistance, please contact our support team.</p>
    </div>
  );
};

export default CancellationReturn;
