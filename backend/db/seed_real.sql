-- =====================================================
-- REALISTIC SEED DATA – Bank MVP
-- 10 real users, 10 accounts (ONE per user)
-- Account numbers: 10-digit, start with 482 (bank prefix)
-- Password for all: Test123!
-- =====================================================

-- Clear existing data
TRUNCATE transactions, accounts, users, otp_codes, funding_sources, ris_notices RESTART IDENTITY CASCADE;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS funding_sources (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bank_name VARCHAR(100) NOT NULL,
    account_last4 VARCHAR(4) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ris_notices (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount_due DECIMAL(12,2) NOT NULL CHECK (amount_due >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'uncleared',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DO $$
DECLARE
    common_hash TEXT := crypt('Mann&Velvet20', gen_salt('bf', 10));
BEGIN
    INSERT INTO users (email, full_name, password_hash, is_verified, created_at) VALUES
    ('mannst@hotmail.com',      'Stephen Mann',       common_hash, true, NOW() - INTERVAL '90 days'),
    ('velvetmnn99@gmail.com',         'Velvet Mann',        common_hash, true, NOW() - INTERVAL '88 days'),
    ('sophia.rodriguez@example.com', 'Sophia Rodriguez',   common_hash, true, NOW() - INTERVAL '85 days'),
    ('james.oliver@example.com',     'James Oliver',       common_hash, true, NOW() - INTERVAL '82 days'),
    ('olivia.kim@example.com',       'Olivia Kim',         common_hash, true, NOW() - INTERVAL '80 days'),
    ('liam.martinez@example.com',    'Liam Martinez',      common_hash, true, NOW() - INTERVAL '77 days'),
    ('ava.johnson@example.com',      'Ava Johnson',        common_hash, true, NOW() - INTERVAL '75 days'),
    ('noah.brown@example.com',       'Noah Brown',         common_hash, true, NOW() - INTERVAL '72 days'),
    ('mia.davis@example.com',        'Mia Davis',          common_hash, true, NOW() - INTERVAL '70 days'),
    ('ethan.wilson@example.com',     'Ethan Wilson',       common_hash, true, NOW() - INTERVAL '68 days');
END $$;

-- =====================================================
-- Create ONE account per user (10 accounts total)
-- Account numbers all start with 482 (bank prefix)
-- =====================================================
DO $$
DECLARE
    user_rec RECORD;
    -- Only the first 10 realistic account numbers (all starting with 482)
    acc_numbers TEXT[] := ARRAY[
        '4822389013', '4822345678', '4820153456', '4828901034',
        '4825678901', '4821234567', '4827890993', '4824567890',
        '4820726456', '4826789012'
    ];
    acc_index INTEGER := 1;
    start_balance DECIMAL;
BEGIN
    FOR user_rec IN SELECT id FROM users ORDER BY id LOOP
        start_balance := round((random() * 50000 + 500)::numeric, 2);
        INSERT INTO accounts (user_id, account_number, balance, created_at)
        VALUES (
            user_rec.id,
            acc_numbers[acc_index],
            start_balance,
            NOW() - (random() * INTERVAL '90 days')
        );
        acc_index := acc_index + 1;
    END LOOP;
END $$;

-- Set Velvet as a joint user on Stephen's account
DO $$
DECLARE
    stephen_id INTEGER;
    velvet_id INTEGER;
BEGIN
    SELECT id INTO stephen_id FROM users WHERE email = 'mannst@hotmail.com';
    SELECT id INTO velvet_id FROM users WHERE email = 'velvetmnn99@gmail.com';
    
    UPDATE accounts SET joint_user_id = velvet_id WHERE user_id = stephen_id;
    
    -- Insert a sample uncleared RIS notice for Stephen
    INSERT INTO ris_notices (user_id, amount_due, status)
    VALUES (stephen_id, 450.00, 'uncleared');
END $$;

-- =====================================================
-- Generate 250+ transactions (deposits, withdrawals, transfers)
-- Using all 10 accounts
-- =====================================================
DO $$
DECLARE
    all_acc TEXT[] := ARRAY(SELECT account_number FROM accounts);
    tx_date TIMESTAMP;
    from_acc TEXT;
    to_acc TEXT;
    amount DECIMAL;
    t_type VARCHAR(20);
    desc_text TEXT;
    date_cursor DATE;
    tx_counter INTEGER := 0;
    target_tx INTEGER := 270;
BEGIN
    FOR date_cursor IN SELECT generate_series(CURRENT_DATE - INTERVAL '90 days', CURRENT_DATE, '1 day'::interval)::DATE
    LOOP
        FOR day_tx IN 1..floor(random() * 4 + 2) LOOP
            tx_counter := tx_counter + 1;
            EXIT WHEN tx_counter > target_tx;
            
            tx_date := date_cursor + (random() * INTERVAL '1 day');
            
            t_type := CASE floor(random() * 10)
                WHEN 0 THEN 'withdrawal'
                WHEN 1 THEN 'withdrawal'
                WHEN 2 THEN 'withdrawal'
                WHEN 3 THEN 'withdrawal'
                WHEN 4 THEN 'deposit'
                WHEN 5 THEN 'deposit'
                WHEN 6 THEN 'deposit'
                WHEN 7 THEN 'deposit'
                ELSE 'transfer'
            END;
            
            IF t_type = 'transfer' THEN
                from_acc := all_acc[1 + floor(random() * array_length(all_acc, 1))];
                LOOP
                    to_acc := all_acc[1 + floor(random() * array_length(all_acc, 1))];
                    EXIT WHEN from_acc != to_acc;
                END LOOP;
                amount := round((random() * 1500 + 10)::numeric, 2);
                desc_text := 'Transfer to ' || to_acc;
            ELSE
                from_acc := all_acc[1 + floor(random() * array_length(all_acc, 1))];
                to_acc := from_acc;
                IF t_type = 'withdrawal' THEN
                    amount := round((random() * 800 + 5)::numeric, 2);
                    desc_text := CASE floor(random() * 10)
                        WHEN 0 THEN 'ATM withdrawal'
                        WHEN 1 THEN 'POS purchase'
                        WHEN 2 THEN 'Online shopping'
                        WHEN 3 THEN 'Restaurant payment'
                        WHEN 4 THEN 'Grocery store'
                        WHEN 5 THEN 'Gas station'
                        WHEN 6 THEN 'Pharmacy'
                        WHEN 7 THEN 'Subscription service'
                        ELSE 'Cash withdrawal'
                    END;
                ELSE
                    amount := round((random() * 3000 + 50)::numeric, 2);
                    desc_text := CASE floor(random() * 8)
                        WHEN 0 THEN 'Salary deposit'
                        WHEN 1 THEN 'Freelance payment'
                        WHEN 2 THEN 'Transfer from savings'
                        WHEN 3 THEN 'Refund'
                        WHEN 4 THEN 'Gift received'
                        WHEN 5 THEN 'Dividend payment'
                        WHEN 6 THEN 'Tax refund'
                        ELSE 'Cash deposit'
                    END;
                END IF;
            END IF;
            
            INSERT INTO transactions (from_account, to_account, amount, type, description, created_at)
            VALUES (from_acc, to_acc, amount, t_type, desc_text, tx_date);
        END LOOP;
    END LOOP;
END $$;

-- Recalculate balances
UPDATE accounts SET balance = 0;

WITH account_totals AS (
    SELECT 
        a.account_number,
        COALESCE(SUM(
            CASE 
                WHEN t.to_account = a.account_number THEN t.amount
                WHEN t.from_account = a.account_number THEN -t.amount
                ELSE 0
            END
        ), 0) AS total
    FROM accounts a
    LEFT JOIN transactions t ON t.to_account = a.account_number OR t.from_account = a.account_number
    GROUP BY a.account_number
)
UPDATE accounts SET balance = account_totals.total
FROM account_totals
WHERE accounts.account_number = account_totals.account_number;

-- Verification
DO $$
DECLARE
    user_cnt INTEGER;
    acc_cnt INTEGER;
    tx_cnt INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_cnt FROM users;
    SELECT COUNT(*) INTO acc_cnt FROM accounts;
    SELECT COUNT(*) INTO tx_cnt FROM transactions;
    RAISE NOTICE 'Seeded: % users, % accounts, % transactions', user_cnt, acc_cnt, tx_cnt;
END $$;

-- Show each user with their single account
SELECT u.email, a.account_number, to_char(a.balance, '999,999,999.99') AS balance
FROM users u
JOIN accounts a ON a.user_id = u.id
ORDER BY u.id;

-- Recent transactions
SELECT created_at, type, from_account, to_account, amount, description
FROM transactions
ORDER BY created_at DESC
LIMIT 10;