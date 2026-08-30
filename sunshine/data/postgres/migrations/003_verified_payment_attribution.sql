ALTER TABLE referral_events
  ADD COLUMN IF NOT EXISTS verified_payment BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE referral_events
  ADD COLUMN IF NOT EXISTS integration_event_id UUID REFERENCES integration_events(id);

CREATE UNIQUE INDEX referral_events_verified_conversion_order_unique
  ON referral_events (code_id, order_id)
  WHERE event_type = 'conversion' AND order_id IS NOT NULL AND verified_payment;

-- Pre-migration conversion and contribution data lacks immutable payment provenance.
-- Reset it so only subsequently verified Shopify events can award financial benefits.
UPDATE referral_codes rc
SET usage_count = COALESCE((
      SELECT COUNT(*)
      FROM referral_events re
      WHERE re.code_id = rc.id
        AND re.event_type = 'conversion'
        AND re.verified_payment
    ), 0),
    conversion_count = COALESCE((
      SELECT COUNT(*)
      FROM referral_events re
      WHERE re.code_id = rc.id
        AND re.event_type = 'conversion'
        AND re.verified_payment
    ), 0),
    updated_at = NOW();

UPDATE sponsors
SET total_contribution = 0,
    effort_score = 0,
    discount_earned = 0,
    tier = 'bronze',
    customization_limit = 1,
    updated_at = NOW();
