"use client";

import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useT } from "@/components/providers/i18n-provider";
import type { WorkScheduleEntry } from "@/lib/api/types";

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

type Day = (typeof DAYS)[number];
export type DayHours = { open: string; close: string; closed: boolean };
export type WorkingHours = Record<Day, DayHours>;

const DAY_CODE: Record<Day, WorkScheduleEntry["day"]> = {
  monday: "Mo",
  tuesday: "Tu",
  wednesday: "We",
  thursday: "Th",
  friday: "Fr",
  saturday: "Sa",
  sunday: "Su",
};
const CODE_DAY = Object.fromEntries(
  Object.entries(DAY_CODE).map(([k, v]) => [v, k]),
) as Record<WorkScheduleEntry["day"], Day>;

export function defaultWorkingHours(): WorkingHours {
  return DAYS.reduce((acc, day) => {
    acc[day] = {
      open: "09:00",
      close: "18:00",
      closed: day === "saturday" || day === "sunday",
    };
    return acc;
  }, {} as WorkingHours);
}

/** Editor state → backend work_schedule (only open days). */
export function toWorkSchedule(hours: WorkingHours): WorkScheduleEntry[] {
  return DAYS.map((day) => ({
    day: DAY_CODE[day],
    start: hours[day].open,
    end: hours[day].close,
    isHoliday: hours[day].closed,
  }));
}

/** Backend work_schedule → editor state. */
export function fromWorkSchedule(
  entries: WorkScheduleEntry[] | null | undefined,
): WorkingHours {
  const base = defaultWorkingHours();
  for (const e of entries ?? []) {
    const day = CODE_DAY[e.day];
    if (day) base[day] = { open: e.start, close: e.end, closed: e.isHoliday };
  }
  return base;
}

export function WorkingHoursEditor({
  value,
  onChange,
}: {
  value: WorkingHours;
  onChange: (next: WorkingHours) => void;
}) {
  const { t } = useT();

  const update = (day: Day, patch: Partial<DayHours>) =>
    onChange({ ...value, [day]: { ...value[day], ...patch } });

  return (
    <div className="divide-y divide-border overflow-hidden rounded-lg border border-border">
      {DAYS.map((day) => {
        const d = value[day];
        return (
          <div key={day} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
            <span className="w-28 shrink-0 text-sm font-medium">
              {t(`weekdays.${day}`)}
            </span>

            {d.closed ? (
              <span className="text-sm text-muted-foreground">
                {t("seller.profile.dayOff")}
              </span>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  value={d.open}
                  onChange={(e) => update(day, { open: e.target.value })}
                  className="w-[7.5rem] tabular"
                />
                <span className="text-muted-foreground">—</span>
                <Input
                  type="time"
                  value={d.close}
                  onChange={(e) => update(day, { close: e.target.value })}
                  className="w-[7.5rem] tabular"
                />
              </div>
            )}

            <label className="ml-auto flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
              <Checkbox
                checked={d.closed}
                onCheckedChange={(v) => update(day, { closed: v === true })}
              />
              {t("seller.profile.dayOff")}
            </label>
          </div>
        );
      })}
    </div>
  );
}
