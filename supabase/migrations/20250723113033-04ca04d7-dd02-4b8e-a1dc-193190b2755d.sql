-- إصلاح مشكلة OTP expiry الطويلة
-- تقليل مدة انتهاء صلاحية OTP إلى 10 دقائق بدلاً من القيمة الافتراضية
UPDATE auth.config 
SET 
    otp_exp = 600,  -- 10 دقائق بدلاً من القيمة الافتراضية (3600 ثانية)
    password_min_length = 8
WHERE 
    id = 'auth_config';