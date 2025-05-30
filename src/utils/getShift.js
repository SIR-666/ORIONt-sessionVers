export function getShift(shift, date) {
  if (!date || isNaN(new Date(date))) {
    console.error("Invalid date provided.");
    return null;
  }

  let startTime, endTime;
  switch (shift) {
    case "I":
      startTime = new Date(date);
      startTime.setHours(6, 0, 0, 0);
      endTime = new Date(date);
      endTime.setHours(14, 0, 0, 0);
      break;
    case "II":
      startTime = new Date(date);
      startTime.setHours(14, 0, 0, 0);
      endTime = new Date(date);
      endTime.setHours(22, 0, 0, 0);
      break;
    case "III":
      startTime = new Date(date);
      startTime.setHours(22, 0, 0, 0);
      endTime = new Date(date);
      endTime.setDate(endTime.getDate() + 1); // Move to the next day
      endTime.setHours(6, 0, 0, 0);
      break;
    default:
      console.warn("Invalid shift provided.");
      return null; // Handle invalid shift
  }

  return { startTime, endTime };
}
