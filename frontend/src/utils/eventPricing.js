export const ASSOCIATE_ACADEMY_PRICE_CHANGE_AT = new Date("2026-07-01T18:00:00+05:30");
export const ASSOCIATE_ACADEMY_BOOKING_CLOSE_AT = new Date("2026-07-04T00:00:00+05:30");
export const ASSOCIATE_ACADEMY_EARLY_PRICE = 600;
export const ASSOCIATE_ACADEMY_REGULAR_PRICE = 900;

const ASSOCIATE_ACADEMY_TITLE = "ASSOCIATE ACADEMY";

export const isAssociateAcademy = (eventOrTitle) => {
  const title =
    typeof eventOrTitle === "string" ? eventOrTitle : eventOrTitle?.title;

  return String(title || "").trim().toUpperCase() === ASSOCIATE_ACADEMY_TITLE;
};

export const getEffectiveTicketPrice = (event, now = new Date()) => {
  if (!isAssociateAcademy(event)) {
    return Number(event?.ticket_price || 0);
  }

  return now >= ASSOCIATE_ACADEMY_PRICE_CHANGE_AT
    ? ASSOCIATE_ACADEMY_REGULAR_PRICE
    : ASSOCIATE_ACADEMY_EARLY_PRICE;
};

export const isEventBookingOpen = (event, now = new Date()) => {
  if (!isAssociateAcademy(event)) {
    return event?.bookingOpen !== false;
  }

  return now < ASSOCIATE_ACADEMY_BOOKING_CLOSE_AT;
};
