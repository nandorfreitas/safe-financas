-- Add new loan fields: principal_amount (valor atual sem juros) and installment_value (valor da prestação)
ALTER TABLE loans ADD COLUMN principal_amount REAL NOT NULL DEFAULT 0;
ALTER TABLE loans ADD COLUMN installment_value REAL NOT NULL DEFAULT 0;
