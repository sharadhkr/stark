import React from 'react';

const FAQs = () => {
  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Frequently Asked Questions (FAQs)</h1>
      <div className="space-y-4">
        <details className="border p-4 rounded-xl shadow-sm">
          <summary className="font-medium cursor-pointer">How do I place an order?</summary>
          <p className="mt-2 text-gray-600">Browse the products, add to cart, and proceed to checkout with payment details.</p>
        </details>
        <details className="border p-4 rounded-xl shadow-sm">
          <summary className="font-medium cursor-pointer">How can I track my order?</summary>
          <p className="mt-2 text-gray-600">You can track your order in the 'My Orders' section once it has been shipped.</p>
        </details>
        <details className="border p-4 rounded-xl shadow-sm">
          <summary className="font-medium cursor-pointer">What if I receive a damaged product?</summary>
          <p className="mt-2 text-gray-600">You can raise a return or replacement request within 7 days of delivery.</p>
        </details>
      </div>
    </div>
  );
};

export default FAQs;