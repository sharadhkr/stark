import React from 'react';

const TermsOfUse = () => {
  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Terms of Use</h1>
      <p className="text-gray-700 leading-relaxed mb-4">
        By accessing and using this website, you agree to comply with the following terms and conditions. All purchases are subject to availability and confirmation of payment. We reserve the right to update or modify these terms without prior notice.
      </p>

      <ul className="list-disc list-inside text-gray-700 space-y-2">
        <li>
          <a href="/CancellationReturn" className="text-blue-600 hover:underline">Cancellation & Return Policy</a>
        </li>
        <li>
          <a href="/ShippingDelivery" className="text-blue-600 hover:underline">Shipping & Delivery Policy</a>
        </li>
      </ul>
    </div>
  );
};

export default TermsOfUse;
