function calculateEffortScore({ clicks = 0, shares = 0, conversions = 0, usageCount = 0 }) {
  const numericClicks = Number(clicks) || 0;
  const numericShares = Number(shares) || 0;
  const numericConversions = Number(conversions) || 0;
  const numericUsage = Number(usageCount) || 0;

  // Public engagement is analytics only; rewards require a verified paid conversion.
  const preThresholdScore = numericConversions * 5;
  const postThresholdScore = numericConversions * 5;
  const rewardMultiplier = numericUsage >= 4 ? postThresholdScore : preThresholdScore;
  const discountEarned = Math.min(rewardMultiplier * 0.01, 0.3);

  return {
    effortScore: Number(rewardMultiplier.toFixed(2)),
    conversionScore: Number(postThresholdScore.toFixed(2)),
    discountEarned: Number(discountEarned.toFixed(2)),
  };
}

function determineTier(totalContribution = 0) {
  const contribution = Number(totalContribution) || 0;
  if (contribution >= 2500) {
    return {
      tier: 'gold',
      maxDiscount: 0.3,
      customizationLimit: null,
    };
  }

  if (contribution >= 500) {
    return {
      tier: 'silver',
      maxDiscount: 0.2,
      customizationLimit: 3,
    };
  }

  return {
    tier: 'bronze',
    maxDiscount: 0.1,
    customizationLimit: 1,
  };
}

function applyTierDiscountCap(discountEarned, totalContribution) {
  const tierDetails = determineTier(totalContribution);
  return {
    ...tierDetails,
    discountEarned: Number(Math.min(Number(discountEarned) || 0, tierDetails.maxDiscount).toFixed(2)),
  };
}

module.exports = {
  calculateEffortScore,
  determineTier,
  applyTierDiscountCap,
};
