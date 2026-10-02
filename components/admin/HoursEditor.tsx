"use client";

import { DAYS, DAY_LABELS, defaultHours, type DayHours, type Hours } from "@/lib/cards/hours";

type Props = { idPrefix: string; value: Hours | null; onChange: (value: Hours | null) => void };

export function HoursEditor({ idPrefix, value, onChange }: Props) {
  if (!value) {
    return (
      <button type="button" className="btn btn-sm self-start" onClick={() => onChange(defaultHours())}>
        Agregar horario
      </button>
    );
  }

  const setDay = (day: (typeof DAYS)[number], patch: Partial<DayHours>) =>
    onChange({ ...value, [day]: { ...value[day], ...patch } });

  const copyMondayToWeek = () => {
    const monday = value.mon;
    onChange({ ...value, tue: { ...monday }, wed: { ...monday }, thu: { ...monday }, fri: { ...monday } });
  };

  const time = "field !min-h-9 !w-[6.6rem] !px-2 !py-1 tabular-nums";
  return (
    <div className="flex flex-col gap-2">
      {DAYS.map((day) => {
        const d = value[day];
        const split = d.open2 !== undefined && d.open2 !== null && (d.open2 !== "" || d.close2 !== "");
        return (
          <div key={day} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border border-line px-3 py-2">
            <span className="w-24 text-sm font-medium">{DAY_LABELS[day]}</span>
            <label className="flex items-center gap-1.5 text-xs">
              <input type="checkbox" checked={d.closed} onChange={(e) => setDay(day, { closed: e.target.checked })} />
              Cerrado
            </label>
            {!d.closed ? (
              <>
                <input aria-label={`${DAY_LABELS[day]} abre`} id={`${idPrefix}-${day}-open`} type="time" value={d.open} onChange={(e) => setDay(day, { open: e.target.value })} className={time} />
                <span aria-hidden="true" className="text-muted">a</span>
                <input aria-label={`${DAY_LABELS[day]} cierra`} type="time" value={d.close} onChange={(e) => setDay(day, { close: e.target.value })} className={time} />
                {split ? (
                  <>
                    <span aria-hidden="true" className="text-muted">y</span>
                    <input aria-label={`${DAY_LABELS[day]} abre (turno 2)`} type="time" value={d.open2 ?? ""} onChange={(e) => setDay(day, { open2: e.target.value })} className={time} />
                    <span aria-hidden="true" className="text-muted">a</span>
                    <input aria-label={`${DAY_LABELS[day]} cierra (turno 2)`} type="time" value={d.close2 ?? ""} onChange={(e) => setDay(day, { close2: e.target.value })} className={time} />
                    <button type="button" className="text-xs text-muted underline" onClick={() => setDay(day, { open2: undefined, close2: undefined })}>
                      Quitar turno
                    </button>
                  </>
                ) : (
                  <button type="button" className="text-xs text-muted underline" onClick={() => setDay(day, { open2: "16:00", close2: "20:00" })}>
                    Turno partido
                  </button>
                )}
              </>
            ) : null}
          </div>
        );
      })}
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-sm" onClick={copyMondayToWeek}>
          Copiar lunes a martes-viernes
        </button>
        <button type="button" className="btn btn-sm" onClick={() => onChange(null)}>
          Quitar horario
        </button>
      </div>
    </div>
  );
}
