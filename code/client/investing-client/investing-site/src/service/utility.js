

// function getUTCTimestamp(datetime) {
//   //return (datetime.getTime() + datetime.getTimezoneOffset() * 60 * 1000) / 1000;
//   return datetime.getTime() / 1000;
// }

export function toISODate(datetime) {
    return (datetime.toJSON()).split("T")[0];
}

export function getDateInTimezone(datetime) {
    return new Date(datetime.getTime() - datetime.getTimezoneOffset() * 60000);
}

export function currency(number) {
    return new Intl.NumberFormat([ ], { style: 'currency', currency: 'USD', currencyDisplay: 'narrowSymbol' }).format(number);
}

export function formatDate(date) {
    new Intl.DateTimeFormat([], { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

export function clone(item) {
  return JSON.parse(JSON.stringify(item));
}
