-- Resource shop orders for /resources paid netdisk packs.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS resource_orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  product_id TEXT NOT NULL,
  resource_id UUID REFERENCES resources(id) ON DELETE SET NULL,
  product_title TEXT NOT NULL,
  product_category TEXT,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  currency TEXT NOT NULL DEFAULT 'CNY',
  payment_method TEXT NOT NULL CHECK (payment_method IN ('wechat', 'alipay')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'delivered', 'cancelled', 'refunded')),
  buyer_contact TEXT NOT NULL,
  buyer_note TEXT,
  admin_note TEXT,
  delivery_url TEXT,
  delivery_code TEXT,
  payment_provider TEXT,
  provider_trade_no TEXT,
  paid_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resource_orders_order_number ON resource_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_resource_orders_status ON resource_orders(status);
CREATE INDEX IF NOT EXISTS idx_resource_orders_created_at ON resource_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resource_orders_resource_id ON resource_orders(resource_id);

CREATE OR REPLACE FUNCTION update_resource_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_resource_orders_updated_at ON resource_orders;
CREATE TRIGGER trigger_resource_orders_updated_at
  BEFORE UPDATE ON resource_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_resource_orders_updated_at();

ALTER TABLE resource_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage resource orders" ON resource_orders;
CREATE POLICY "Service role can manage resource orders"
  ON resource_orders
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

COMMENT ON TABLE resource_orders IS '资源商店订单表 - 保存扫码支付与网盘交付状态';
