export function canEditData(inputDateStr, role) {
  const inputDate = new Date(inputDateStr);
  const today = new Date();

  const inputMonth = inputDate.getMonth(); // 0-indexed
  const inputYear = inputDate.getFullYear();

  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const currentDay = today.getDate();

  const sameMonth = inputMonth === currentMonth && inputYear === currentYear;

  if (role === "Prf") {
    return true;
  }

  if (sameMonth) {
    return true;
  }

  const isPreviousMonth =
    (inputYear === currentYear && inputMonth === currentMonth - 1) ||
    (inputYear === currentYear - 1 && currentMonth === 0 && inputMonth === 11); // handle Jan -> Dec

  if (isPreviousMonth && currentDay <= 5) {
    return true;
  }

  return false;
}
