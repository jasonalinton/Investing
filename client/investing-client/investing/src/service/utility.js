

// function getUTCTimestamp(datetime) {
//   //return (datetime.getTime() + datetime.getTimezoneOffset() * 60 * 1000) / 1000;
//   return datetime.getTime() / 1000;
// }

// function toISODate(datetime) {
//     return (datetime.toJSON()).split("T")[0];
// }

// function getDateInTimezone(datetime) {
//     return new Date(datetime.getTime() - datetime.getTimezoneOffset() * 60000);
// }


function test() {
    console.log("Tesing Export");
}

// module.exports = {
//     test
// }

export default test;