CREATE TABLE items (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE OR REPLACE FUNCTION notify_item_insert()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('item_added', row_to_json(NEW)::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER item_insert_trigger
AFTER INSERT ON items
FOR EACH ROW
EXECUTE FUNCTION notify_item_insert();