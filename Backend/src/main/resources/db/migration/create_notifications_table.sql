-- Notifications Table Schema
-- Run this SQL script manually in your PostgreSQL database
CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    user_account_number VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    icon VARCHAR(10)
);
-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_account ON notifications(user_account_number);
CREATE INDEX IF NOT EXISTS idx_timestamp ON notifications(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_is_read ON notifications(is_read);