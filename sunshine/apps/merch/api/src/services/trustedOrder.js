function normalizeOrderItems(items) {
  if (!Array.isArray(items) || !items.length) {
    throw new Error('At least one order item is required.');
  }

  return items.map((item) => {
    const quantity = Number(item.quantity);
    if (!item.productId || !Number.isInteger(quantity) || quantity < 1) {
      throw new Error('Each order item requires a productId and a positive whole-number quantity.');
    }

    return {
      productId: String(item.productId),
      quantity,
      customization: item.customization || null,
    };
  });
}

function isVerifiedPaidShopifyOrder(topic, payload) {
  return (
    ['orders/create', 'orders/updated'].includes(topic) &&
    payload &&
    payload.id !== undefined &&
    payload.id !== null &&
    payload.financial_status === 'paid'
  );
}

function newSponsorFinancialDefaults() {
  return {
    totalContribution: 0,
    tier: 'bronze',
    customizationLimit: 1,
    discountEarned: 0,
  };
}

module.exports = {
  normalizeOrderItems,
  isVerifiedPaidShopifyOrder,
  newSponsorFinancialDefaults,
};
