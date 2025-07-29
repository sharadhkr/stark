import React from 'react';

const ShippingDelivery = () => {
  return (
    <div className="p-4 max-w-3xl mx-auto text-gray-800">
      <h1 className="text-2xl font-semibold mb-4">Shipping & Delivery</h1>
      <p className="mb-3">
        Starkk.shop is committed to delivering your products on time and in perfect condition.
      </p>

      <h2 className="text-lg font-semibold mt-4 mb-2">Shipping Partners</h2>
      <p className="mb-3">We work with trusted logistics partners like Delhivery, Ekart, Bluedart, and others to deliver across India.</p>

      <h2 className="text-lg font-semibold mt-4 mb-2">Shipping Timelines</h2>
      <ul className="list-disc list-inside space-y-1">
        <li>Metro cities: 2–4 business days</li>
        <li>Other locations: 5–7 business days</li>
        <li>Delivery timelines may vary during holidays or special events.</li>
      </ul>

      <h2 className="text-lg font-semibold mt-4 mb-2">Shipping Charges</h2>
      <ul className="list-disc list-inside space-y-1">
        <li>Free shipping on all prepaid orders above ₹499.</li>
        <li>Cash on Delivery (COD) charges may apply.</li>
      </ul>

      <p className="mt-6">You can track your order from your dashboard. For any delays or issues, feel free to reach out to us.</p>
    </div>
  );
};

export default ShippingDelivery;
