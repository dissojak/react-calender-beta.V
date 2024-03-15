import * as React from 'react';
import dayjs from 'dayjs';
import Badge from '@mui/material/Badge';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { DayCalendarSkeleton } from '@mui/x-date-pickers/DayCalendarSkeleton';

//this is the documentation for the codes 
//https://mui.com/x/react-date-pickers/date-calendar/

// Dummy function to mimic fetch with abort controller
function fakeFetch(date, { signal }) {
  // Replace this with your actual fetch request to the backend
  // For demonstration purposes, we'll just return a fixed set of highlighted days
  const daysToHighlight = [
    '2024-04-13',
    '2024-03-06',
    '2024-03-02',
    '2024-03-15',
  ]; // Dummy highlighted days
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      resolve({ daysToHighlight });
    }, 500);

    signal.onabort = () => {
      clearTimeout(timeout);
      reject(new DOMException('aborted', 'AbortError'));
    };
  });
}

const initialValue = dayjs(); // set to the current date

function ServerDay(props) {
  const { highlightedDays = [], day, outsideCurrentMonth, ...other } = props;
  const isSelected =
    !props.outsideCurrentMonth &&
    highlightedDays.some(
      (highlightedDay) =>
        day.month() === dayjs(highlightedDay).month() &&
        day.year() === dayjs(highlightedDay).year() &&
        day.date() === dayjs(highlightedDay).date()
    );

  return (
    <Badge
      key={props.day.toString()}
      overlap="circular"
      badgeContent={isSelected ? '📌' : undefined}
    >
      <PickersDay
        {...other}
        outsideCurrentMonth={outsideCurrentMonth}
        day={day}
        style={{
          color: isSelected ? '#FB549D' : 'white',
          fontWeight: 'bold',
          borderRadius: 8,
          border: isSelected ? '2px solid' : '',
        }} // Apply css from here ( men andy ya jon haha )
      />
    </Badge>
  );
}

export default function DateCalendarServerRequest() {
  const requestAbortController = React.useRef(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [highlightedDays, setHighlightedDays] = React.useState([]);

  const fetchHighlightedDays = (date) => {
    const controller = new AbortController();
    fakeFetch(date, {
      signal: controller.signal,
    })
      .then(({ daysToHighlight }) => {
        setHighlightedDays(daysToHighlight);
        setIsLoading(false);
      })
      .catch((error) => {
        // Ignore the error if it's caused by `controller.abort`
        if (error.name !== 'AbortError') {
          throw error;
        }
      });

    requestAbortController.current = controller;
  };

  React.useEffect(() => {
    fetchHighlightedDays(initialValue);
    // Abort request on unmount
    return () => requestAbortController.current?.abort();
  }, []);

  const handleMonthChange = (date) => {
    if (requestAbortController.current) {
      // Make sure that you are aborting useless requests
      // because it is possible to switch between months pretty quickly
      requestAbortController.current.abort();
    }

    setIsLoading(true);
    setHighlightedDays([]);
    fetchHighlightedDays(date);
  };

  const [selectedDate, setSelectedDate] = React.useState(initialValue);

  const handleDateChange = (date) => {
    setSelectedDate(date);
    console.log(date.format('YYYY-MM-DD')); // Log the selected date we can work with it for searsh
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DateCalendar
        defaultValue={initialValue}
        onChange={handleDateChange}
        loading={isLoading}
        onMonthChange={handleMonthChange}
        renderLoading={() => <DayCalendarSkeleton />}
        slots={{
          day: ServerDay,
        }}
        slotProps={{
          day: {
            highlightedDays,
          },
        }}
      />
    </LocalizationProvider>
  );
}
