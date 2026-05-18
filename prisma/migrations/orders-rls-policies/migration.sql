-- Enable Row Level Security on orders table
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Enable Row Level Security on collections table
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

-- Policy: Allow sales agents to create orders for surveys assigned to them
CREATE POLICY "Allow sales agents to create orders"
ON orders FOR INSERT TO authenticated
WITH CHECK (
  sales_agent_id IN (
    SELECT id FROM users
    WHERE email = (auth.jwt() ->> 'email')
    AND role = 'SALES'
  )
);

-- Policy: Allow sales agents to view their own orders
CREATE POLICY "Allow sales agents to view their own orders"
ON orders FOR SELECT TO authenticated
USING (
  sales_agent_id IN (
    SELECT id FROM users
    WHERE email = (auth.jwt() ->> 'email')
  )
);

-- Policy: Allow admins to view all orders
CREATE POLICY "Allow admins to view all orders"
ON orders FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE email = (auth.jwt() ->> 'email')
    AND role IN ('ADMIN', 'SUPER_ADMIN')
  )
);

-- Policy: Allow admins to update orders (approve, assign delivery, etc.)
CREATE POLICY "Allow admins to update orders"
ON orders FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE email = (auth.jwt() ->> 'email')
    AND role IN ('ADMIN', 'SUPER_ADMIN')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE email = (auth.jwt() ->> 'email')
    AND role IN ('ADMIN', 'SUPER_ADMIN')
  )
);

-- Policy: Allow delivery users to view orders assigned to them
CREATE POLICY "Allow delivery users to view assigned orders"
ON orders FOR SELECT TO authenticated
USING (
  delivery_assigned_to IN (
    SELECT id FROM users
    WHERE email = (auth.jwt() ->> 'email')
    AND role = 'DELIVERY'
  )
);

-- Policy: Allow delivery users to update their assigned orders (status, proof, etc.)
CREATE POLICY "Allow delivery users to update assigned orders"
ON orders FOR UPDATE TO authenticated
USING (
  delivery_assigned_to IN (
    SELECT id FROM users
    WHERE email = (auth.jwt() ->> 'email')
    AND role = 'DELIVERY'
  )
)
WITH CHECK (
  delivery_assigned_to IN (
    SELECT id FROM users
    WHERE email = (auth.jwt() ->> 'email')
    AND role = 'DELIVERY'
  )
);

-- Policy: Allow collectors to view orders assigned to them
CREATE POLICY "Allow collectors to view assigned orders"
ON orders FOR SELECT TO authenticated
USING (
  collector_assigned_to IN (
    SELECT id FROM users
    WHERE email = (auth.jwt() ->> 'email')
    AND role = 'COLLECTOR'
  )
);

-- Policy: Allow collectors to create collection records
CREATE POLICY "Allow collectors to create collections"
ON collections FOR INSERT TO authenticated
WITH CHECK (
  collector_id IN (
    SELECT id FROM users
    WHERE email = (auth.jwt() ->> 'email')
    AND role = 'COLLECTOR'
  )
);

-- Policy: Allow collectors to view their own collections
CREATE POLICY "Allow collectors to view their own collections"
ON collections FOR SELECT TO authenticated
USING (
  collector_id IN (
    SELECT id FROM users
    WHERE email = (auth.jwt() ->> 'email')
  )
);

-- Policy: Allow admins to view all collections
CREATE POLICY "Allow admins to view all collections"
ON collections FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE email = (auth.jwt() ->> 'email')
    AND role IN ('ADMIN', 'SUPER_ADMIN')
  )
);

-- Policy: Allow sales agents to view collections related to their orders
CREATE POLICY "Allow sales agents to view collections for their orders"
ON collections FOR SELECT TO authenticated
USING (
  order_id IN (
    SELECT id FROM orders
    WHERE sales_agent_id IN (
      SELECT id FROM users
      WHERE email = (auth.jwt() ->> 'email')
    )
  )
);
