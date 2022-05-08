const util = require('util');

// function toISODate(datetime) {
//     return (datetime.toJSON()).split("T")[0];
// }

// function getDateInTimezone(datetime) {
//     return new Date(datetime.getTime() - datetime.getTimezoneOffset() * 60000);
// }

function sortAsc(array, prop) {
    return array.sort((a, b) => a[prop] - b[prop]);
}

function sortDesc(array, prop) {
    return array.sort((a, b) => b[prop] - a[prop]);
}

function sortAlphabeticallyAsc(array, prop) {
    return array.sort((a, b) => {
        if (a[prop] < b[prop]) return -1;
        if (a[prop] > b[prop]) return 1;
        return 0;
    });
}

function sortAlphabeticallyDesc(array, prop) {
    return array.sort((a, b) => {
        if (a[prop] > b[prop]) return -1;
        if (a[prop] < b[prop]) return 1;
        return 0;
    });
}


function logErrors(error) {
    // Node, Binance
    if (error.stack) {
        util.log(error.stack);
    }
    // Node, Binance
    if (error.message) {
        util.log(error.stack);
    }
    if (error.response && error.response.data && error.response.data.errors) {
        error.response.data.errors.forEach(err => {
            util.log(err);
        });
    }
    if (error.data && error.data.data && error.data.data.errors) {
        error.data.data.errors.forEach(err => {
            util.log(err);
        });
    }
    else {
        util.log(error);
    }
}

function currency(number) {
    return new Intl.NumberFormat([ ], { style: 'currency', currency: 'USD', currencyDisplay: 'narrowSymbol' }).format(number);
}

function logErrors(error) {
    // Node, Binance
    if (error.stack) {
        util.log(error.stack);
    }
    // Node, Binance
    if (error.message) {
        util.log(error.stack);
    }
    if (error.response && error.response.data && error.response.data.errors) {
        error.response.data.errors.forEach(err => {
            util.log(err);
        });
    }
    if (error.data && error.data.data && error.data.data.errors) {
        error.data.data.errors.forEach(err => {
            util.log(err);
        });
    }
    else {
        util.log(error);
    }
}

module.exports = {
    sortAsc,
    sortDesc,
    sortAlphabeticallyAsc,
    sortAlphabeticallyDesc,
    logErrors,
    currency,
    logErrors
}