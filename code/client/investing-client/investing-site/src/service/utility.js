

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

export function timezoneTimestamp(datetime) {
    datetime = new Date(datetime.getTime() - datetime.getTimezoneOffset() * 60000);
    return datetime.getTime() / 1000;
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

export function replaceItem(item, itemList, property) {
  var findObject = (object) => object[property] == item[property];
  var index = itemList.findIndex(findObject);
  if (index === -1) return false;
  else {
    itemList.splice(index, 1, item);
    return true;
  }
}
