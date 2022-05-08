const moment = require('moment');

function initMiddleware(prisma) {
    initDateFormatMiddleware(prisma)
}

// Date objects are returned as a millisecond string
// Formatting makes it easier to read and convert
async function initDateFormatMiddleware(prisma) {
    prisma.$use(async (params, next) => {
        const result = await next(params);
        if (['Transfer'].includes(params.model)) {
            if (Array.isArray(result)) result.forEach(_result => fixDateFormat(_result));
            else if (result) fixDateFormat(result)
        }
        return result
    })
}

function fixDateFormat(result) {
    if (result.datetime) {
        result.datetime = moment(result.datetime).format();
    }
}

module.exports = initMiddleware;