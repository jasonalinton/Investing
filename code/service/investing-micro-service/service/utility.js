

// function toISODate(datetime) {
//     return (datetime.toJSON()).split("T")[0];
// }

// function getDateInTimezone(datetime) {
//     return new Date(datetime.getTime() - datetime.getTimezoneOffset() * 60000);
// }


export function logErrors(error) {
    // Node, Binance
    if (error.stack) {
        console.log(error.stack);
    }
    // Node, Binance
    if (error.message) {
        console.log(error.stack);
    }
    if (error.response && error.response.data && error.response.data.errors) {
        error.response.data.errors.forEach(err => {
            console.log(err);
        });
    }
    if (error.data && error.data.data && error.data.data.errors) {
        error.data.data.errors.forEach(err => {
            console.log(err);
        });
    }
    else {
        console.log(error);
    }
}

export function test() {
    console.log("Tesing Export");
}