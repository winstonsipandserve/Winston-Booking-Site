ALTER TABLE resource_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY deny_all_anon ON resource_types FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY deny_all_authenticated ON resource_types FOR ALL TO authenticated USING (false) WITH CHECK (false);

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY deny_all_anon ON resources FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY deny_all_authenticated ON resources FOR ALL TO authenticated USING (false) WITH CHECK (false);

ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY deny_all_anon ON pricing_rules FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY deny_all_authenticated ON pricing_rules FOR ALL TO authenticated USING (false) WITH CHECK (false);

ALTER TABLE guest_fee_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY deny_all_anon ON guest_fee_rules FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY deny_all_authenticated ON guest_fee_rules FOR ALL TO authenticated USING (false) WITH CHECK (false);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY deny_all_anon ON customers FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY deny_all_authenticated ON customers FOR ALL TO authenticated USING (false) WITH CHECK (false);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY deny_all_anon ON admin_users FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY deny_all_authenticated ON admin_users FOR ALL TO authenticated USING (false) WITH CHECK (false);

ALTER TABLE membership_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY deny_all_anon ON membership_applications FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY deny_all_authenticated ON membership_applications FOR ALL TO authenticated USING (false) WITH CHECK (false);

ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY deny_all_anon ON memberships FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY deny_all_authenticated ON memberships FOR ALL TO authenticated USING (false) WITH CHECK (false);

ALTER TABLE membership_credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY deny_all_anon ON membership_credit_transactions FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY deny_all_authenticated ON membership_credit_transactions FOR ALL TO authenticated USING (false) WITH CHECK (false);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY deny_all_anon ON bookings FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY deny_all_authenticated ON bookings FOR ALL TO authenticated USING (false) WITH CHECK (false);

ALTER TABLE booking_reschedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY deny_all_anon ON booking_reschedules FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY deny_all_authenticated ON booking_reschedules FOR ALL TO authenticated USING (false) WITH CHECK (false);

ALTER TABLE add_on_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY deny_all_anon ON add_on_services FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY deny_all_authenticated ON add_on_services FOR ALL TO authenticated USING (false) WITH CHECK (false);

ALTER TABLE add_on_pricing_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY deny_all_anon ON add_on_pricing_rules FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY deny_all_authenticated ON add_on_pricing_rules FOR ALL TO authenticated USING (false) WITH CHECK (false);

ALTER TABLE booking_add_ons ENABLE ROW LEVEL SECURITY;
CREATE POLICY deny_all_anon ON booking_add_ons FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY deny_all_authenticated ON booking_add_ons FOR ALL TO authenticated USING (false) WITH CHECK (false);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY deny_all_anon ON payments FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY deny_all_authenticated ON payments FOR ALL TO authenticated USING (false) WITH CHECK (false);

ALTER TABLE bulletins ENABLE ROW LEVEL SECURITY;
CREATE POLICY deny_all_anon ON bulletins FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY deny_all_authenticated ON bulletins FOR ALL TO authenticated USING (false) WITH CHECK (false);
