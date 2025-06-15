export function filterEventsByPeriod(allEvents, timeFrame) {
  const now = new Date();
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime();

  return (allEvents || []).filter((event) => {
    if (!event?.timestamp || !event.gameId) return false;
    const eventTime = new Date(event.timestamp).getTime();
    if (isNaN(eventTime)) return false;

    if (timeFrame === "today") {
      return eventTime >= todayStart;
    }
    return true;
  });
}
