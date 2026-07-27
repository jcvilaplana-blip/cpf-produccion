-- Function to update profile rating when a new rating is added
CREATE OR REPLACE FUNCTION update_profile_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET 
    rating = (
      SELECT AVG(rating)::DECIMAL(3,2)
      FROM ratings
      WHERE rated_user_id = NEW.rated_user_id
    ),
    total_ratings = (
      SELECT COUNT(*)
      FROM ratings
      WHERE rated_user_id = NEW.rated_user_id
    )
  WHERE id = NEW.rated_user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update profile rating after insert
CREATE TRIGGER update_profile_rating_after_insert
AFTER INSERT ON ratings
FOR EACH ROW
EXECUTE FUNCTION update_profile_rating();

-- Trigger to update profile rating after update
CREATE TRIGGER update_profile_rating_after_update
AFTER UPDATE ON ratings
FOR EACH ROW
EXECUTE FUNCTION update_profile_rating();

-- Trigger to update profile rating after delete
CREATE TRIGGER update_profile_rating_after_delete
AFTER DELETE ON ratings
FOR EACH ROW
EXECUTE FUNCTION update_profile_rating();
