import React, { useState, useEffect } from 'react';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css'; // main style file
import 'react-date-range/dist/theme/default.css'; // theme css file
import { addDays, format, parseISO } from 'date-fns';

const DateRangePicker = ({ startDate, endDate, onChange }) => {
  const [state, setState] = useState([
    {
      startDate: startDate ? parseISO(startDate) : new Date(),
      endDate: endDate ? parseISO(endDate) : addDays(new Date(), 7),
      key: 'selection'
    }
  ]);

  useEffect(() => {
    if (startDate && endDate) {
      setState([
        {
          startDate: parseISO(startDate),
          endDate: parseISO(endDate),
          key: 'selection'
        }
      ]);
    }
  }, [startDate, endDate]);

  const handleSelect = (item) => {
    setState([item.selection]);
    if (onChange) {
      onChange({
        startDate: format(item.selection.startDate, 'yyyy-MM-dd'),
        endDate: format(item.selection.endDate, 'yyyy-MM-dd')
      });
    }
  };

  return (
    <div className="calendar-wrapper rounded-3xl overflow-hidden shadow-2xl [&_.rdrDateRangeWrapper]:w-full [&_.rdrMonthAndYearWrapper]:pt-6 [&_.rdrMonthAndYearWrapper]:pb-4">
      <style>{`
        .rdrCalendarWrapper {
          width: 100%;
          background: transparent;
        }
        .rdrMonth {
          width: 100%;
        }
        .rdrDayToday .rdrDayNumber span:after {
          background: var(--primary);
        }
        .rdrSelected, .rdrInRange, .rdrStartEdge, .rdrEndEdge {
          background: var(--primary) !important;
          opacity: 0.8;
        }
        .rdrDayHovered {
           border: 1px solid var(--primary);
        }
      `}</style>
      <DateRange
        editableDateInputs={true}
        onChange={handleSelect}
        moveRangeOnFirstSelection={false}
        ranges={state}
        months={window.innerWidth > 768 ? 2 : 1}
        direction={window.innerWidth > 768 ? "horizontal" : "vertical"}
        className="w-full bg-white text-black"
        minDate={new Date()}
      />
    </div>
  );
};

export default DateRangePicker;
