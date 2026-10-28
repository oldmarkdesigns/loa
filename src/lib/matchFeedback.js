// Reasons offered as one-click chips when a renter sees a match on a listing card but
// doesn't go further with it (no contact/viewing). Mirrors MATCH_DISMISSAL_REASONS in
// convex/matchFeedback.js — the `value` here is exactly what gets sent to that mutation.
export const MATCH_DISMISSAL_REASONS = [
  { value: "too_expensive", label: "För dyrt" },
  { value: "wrong_location", label: "Fel läge" },
  { value: "wrong_size", label: "För litet" },
  { value: "wrong_move_in_date", label: "Fel inflyttningsdatum" }
];
