const ASSOCIATE_ACADEMY_TITLE = "ASSOCIATE ACADEMY";
const ASSOCIATE_ACADEMY_PRICE_CHANGE_AT = new Date("2026-07-01T18:00:00+05:30");
const ASSOCIATE_ACADEMY_BOOKING_CLOSE_AT = new Date("2026-07-04T00:00:00+05:30");
const ASSOCIATE_ACADEMY_EARLY_PRICE = 600;
const ASSOCIATE_ACADEMY_REGULAR_PRICE = 900;

const isAssociateAcademy = (event) =>
  String(event?.title || "").trim().toUpperCase() === ASSOCIATE_ACADEMY_TITLE;

const getEffectiveTicketPrice = (event, now = new Date()) => {
  if (!isAssociateAcademy(event)) {
    return event?.ticket_price;
  }

  return now >= ASSOCIATE_ACADEMY_PRICE_CHANGE_AT
    ? ASSOCIATE_ACADEMY_REGULAR_PRICE
    : ASSOCIATE_ACADEMY_EARLY_PRICE;
};

const isBookingOpen = (event, now = new Date()) => {
  if (!isAssociateAcademy(event)) {
    return true;
  }

  return now < ASSOCIATE_ACADEMY_BOOKING_CLOSE_AT;
};

const addEffectiveTicketPrice = (event, now = new Date()) => {
  const eventData = event?.toObject ? event.toObject() : event;

  return {
    ...eventData,
    ticket_price: getEffectiveTicketPrice(eventData, now),
    bookingOpen: isBookingOpen(eventData, now)
  };
};

module.exports = {
  ASSOCIATE_ACADEMY_BOOKING_CLOSE_AT,
  ASSOCIATE_ACADEMY_EARLY_PRICE,
  ASSOCIATE_ACADEMY_PRICE_CHANGE_AT,
  ASSOCIATE_ACADEMY_REGULAR_PRICE,
  isBookingOpen,
  getEffectiveTicketPrice,
  addEffectiveTicketPrice
};
