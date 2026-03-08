export function parseDate(value?: string): Date | undefined {
  if (!value) {
    return undefined;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function parseScheduleDate(day: string, time: string): Date {
  const date = new Date(`${day}T${time}:00`);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid day/time format. Use day=YYYY-MM-DD and time=HH:mm");
  }
  return date;
}
