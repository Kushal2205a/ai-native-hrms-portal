export type InterviewSlot = {
  startsAt: string;
  endsAt: string;
  label: string;
};

type BusySlot = {
  startsAt: string;
  endsAt: string;
};

const SLOT_DURATION_MINUTES = 30;
const DAYS_AHEAD = 7;

const WORK_START_HOUR = 9;
const WORK_END_HOUR = 17;

const LUNCH_START_HOUR = 12;
const LUNCH_END_HOUR = 13;



function formatSlotLabel(date: Date) {
  return date.toLocaleString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function overlaps(slotStart: Date, slotEnd: Date, busyStart: Date, busyEnd: Date) {
  return slotStart < busyEnd && slotEnd > busyStart;
}

function isLunchSlot(slotStart: Date, slotEnd: Date) {
  const lunchStart = new Date(slotStart);
  lunchStart.setHours(LUNCH_START_HOUR, 0, 0, 0);

  const lunchEnd = new Date(slotStart);
  lunchEnd.setHours(LUNCH_END_HOUR, 0, 0, 0);

  return overlaps(slotStart, slotEnd, lunchStart, lunchEnd);
}

export function generateInterviewSlots(busySlots: BusySlot[] = []): InterviewSlot[] {
  const slots: InterviewSlot[] = [];
  const now = new Date();

  for (let dayOffset = 0; dayOffset < DAYS_AHEAD; dayOffset += 1) {
    const day = new Date(now);
    day.setDate(now.getDate() + dayOffset);

    const cursor = new Date(day);
    cursor.setHours(WORK_START_HOUR, 0, 0, 0);

    const dayEnd = new Date(day);
    dayEnd.setHours(WORK_END_HOUR, 0, 0, 0);

    while (cursor < dayEnd) {
      const slotStart = new Date(cursor);
      const slotEnd = new Date(cursor);
      slotEnd.setMinutes(slotEnd.getMinutes() + SLOT_DURATION_MINUTES);

      const isPast = slotStart <= now;
      const hitsLunch = isLunchSlot(slotStart, slotEnd);

      const hitsBusySlot = busySlots.some((busy) =>
        overlaps(
          slotStart,
          slotEnd,
          new Date(busy.startsAt),
          new Date(busy.endsAt)
        )
      );

      if (!isPast && !hitsLunch && !hitsBusySlot) {
        slots.push({
          startsAt: slotStart.toISOString(),
          endsAt: slotEnd.toISOString(),
          label: formatSlotLabel(slotStart),
        });
      }

      cursor.setMinutes(cursor.getMinutes() + SLOT_DURATION_MINUTES);
    }
  }

  return slots;
}