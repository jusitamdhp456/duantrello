-- Migration for adding due_date to cards

ALTER TABLE cards
ADD COLUMN due_date timestamptz;
