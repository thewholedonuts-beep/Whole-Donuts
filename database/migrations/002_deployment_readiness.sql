CREATE TABLE integration_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(50) NOT NULL CHECK (provider IN ('shopify', 'printful')),
  delivery_id VARCHAR(255) NOT NULL,
  topic VARCHAR(255) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'processed', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 1,
  error_message TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  UNIQUE (provider, delivery_id)
);

CREATE INDEX idx_integration_events_status_received
  ON integration_events (status, received_at);

CREATE INDEX idx_orders_printful_order
  ON orders (printful_order_id);
