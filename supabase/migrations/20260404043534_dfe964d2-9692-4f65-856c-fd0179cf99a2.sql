
-- Promo codes table
CREATE TABLE public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  plan_type text NOT NULL DEFAULT 'premium',
  max_uses int DEFAULT NULL,
  current_uses int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Track which users redeemed promo codes
CREATE TABLE public.premium_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  promo_code_id uuid REFERENCES public.promo_codes(id) ON DELETE SET NULL,
  plan_type text NOT NULL DEFAULT 'premium',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- RLS for promo_codes
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active promo codes" ON public.promo_codes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage promo codes" ON public.promo_codes FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));

-- RLS for premium_subscriptions
ALTER TABLE public.premium_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subscription" ON public.premium_subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subscription" ON public.premium_subscriptions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all subscriptions" ON public.premium_subscriptions FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Insert default promo code
INSERT INTO public.promo_codes (code, plan_type, is_active) VALUES ('areeba087', 'sales_navigator', true);
INSERT INTO public.promo_codes (code, plan_type, is_active) VALUES ('BLOOM2026', 'premium', true);

-- Function to redeem promo code (handles validation, increments usage, assigns bloom_member role)
CREATE OR REPLACE FUNCTION public.redeem_promo_code(p_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_promo promo_codes%ROWTYPE;
  v_user_id uuid := auth.uid();
BEGIN
  -- Check if user already has premium
  IF EXISTS (SELECT 1 FROM premium_subscriptions WHERE user_id = v_user_id AND is_active = true) THEN
    RETURN json_build_object('success', false, 'message', 'You already have an active premium subscription');
  END IF;

  -- Find promo code
  SELECT * INTO v_promo FROM promo_codes WHERE LOWER(code) = LOWER(p_code) AND is_active = true;
  IF v_promo.id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Invalid or expired promo code');
  END IF;

  -- Check max uses
  IF v_promo.max_uses IS NOT NULL AND v_promo.current_uses >= v_promo.max_uses THEN
    RETURN json_build_object('success', false, 'message', 'This promo code has reached its usage limit');
  END IF;

  -- Redeem: create subscription
  INSERT INTO premium_subscriptions (user_id, promo_code_id, plan_type) VALUES (v_user_id, v_promo.id, v_promo.plan_type);

  -- Increment usage
  UPDATE promo_codes SET current_uses = current_uses + 1 WHERE id = v_promo.id;

  -- Grant bloom_member role for unrestricted messaging
  INSERT INTO user_roles (user_id, role) VALUES (v_user_id, 'bloom_member') ON CONFLICT (user_id, role) DO NOTHING;

  RETURN json_build_object('success', true, 'message', 'Premium activated successfully!', 'plan_type', v_promo.plan_type);
END;
$$;
