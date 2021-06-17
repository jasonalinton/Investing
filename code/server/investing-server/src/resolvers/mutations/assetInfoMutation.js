const date = require('date-and-time');

async function getAssetName(parent, args, context, info) {
    var asset = await context.prisma.asset.findFirst({
        where: {
            symbol: args.symbol
        }
    });

    console.log(`${args.symbol} - ${asset.name}`);
    return asset.name;
}

async function getAssetPrice_Now(parent, args, context, info) {
    let assetValue = await context.prisma.assetBar.findFirst({
        where: { symbol: args.symbol },
        orderBy: { openTime: 'desc' }
    });
    
    let diff = date.subtract(new Date(), assetValue.openTime).toMinutes();
    
    // Check if asset value is within 5 minutes of now
    if (diff <= 5) {
        console.log(`${args.symbol} was worth $${currency(assetValue.open)} at ${formatDate(assetValue.openTime)}`);
        return assetValue.open;
    } else {
        console.log(`Don't have ${args.symbol} asset value within 5 minutes`);
        //throw new Error("Don't have asset value within 5 minutes");
        return -1
    }
}

async function getAssetPrice_Hour(parent, args, context, info) {
    let now = new Date((new Date()).setSeconds(0));
    let hourAgo = date.addHours(now, -1);
    
    let assetValue = await context.prisma.assetBar.findFirst({
        where: { 
            AND: [
                { symbol: args.symbol },
                { openTime: { lt: hourAgo } }
            ]
         },
         orderBy: { openTime: 'desc' }
    });

    if (assetValue) {
        console.log(`${args.symbol} was worth $${currency(assetValue.open)} at ${formatDate(assetValue.openTime)}`);
        return assetValue.open;
    } else {
        console.log(`Don't have ${args.symbol} asset value from an hour ago`);
        return -1
    }
}

async function getAssetPrice_Day(parent, args, context, info) {
    let now = new Date((new Date()).setSeconds(0));
    let dayAgo = date.addDays(now, -1);
    
    let assetValue = await context.prisma.assetBar.findFirst({
        where: { 
            AND: [
                { symbol: args.symbol },
                { openTime: { lt: dayAgo } },
            ]
         },
         orderBy: { openTime: 'desc' }
    });

    if (assetValue) {
        console.log(`${args.symbol} was worth $${currency(assetValue.open)} at ${formatDate(assetValue.openTime)}`);
        return assetValue.open;
    } else {
        console.log(`Don't have ${args.symbol} asset value from a day ago`);
        return -1
    }
}

async function getAssetPrice_Week(parent, args, context, info) {
    let now = new Date((new Date()).setSeconds(0));
    let weekAgo = date.addDays(now, -7);
    
    let assetValue = await context.prisma.assetBar.findFirst({
        where: { 
            AND: [
                { symbol: args.symbol },
                { openTime: { lt: weekAgo } },
            ]
         },
         orderBy: { openTime: 'desc' }
    });

    if (assetValue) {
        console.log(`${args.symbol} was worth $${currency(assetValue.open)} at ${formatDate(assetValue.openTime)}`);
        return assetValue.open;
    } else {
        console.log(`Don't have ${args.symbol} asset value from a week ago`);
        return -1
    }
}

async function getAssetPrice_Month(parent, args, context, info) {
    let now = new Date((new Date()).setSeconds(0));
    let monthAgo = date.addMonths(now, -1);
    
    let assetValue = await context.prisma.assetBar.findFirst({
        where: { 
            AND: [
                { symbol: args.symbol },
                { openTime: { lt: monthAgo } },
            ]
         },
         orderBy: { openTime: 'desc' }
    });

    if (assetValue) {
        console.log(`${args.symbol} was worth $${currency(assetValue.open)} at ${formatDate(assetValue.openTime)}`);
        return assetValue.open;
    } else {
        console.log(`Don't have ${args.symbol} asset value from a month ago`);
        return -1
    }
}

async function getAssetPrices(parent, args, context, info) {
    let promises = [];
    promises.push(getAssetPrice_Now(parent, args, context, info));
    promises.push(getAssetPrice_Hour(parent, args, context, info));
    promises.push(getAssetPrice_Day(parent, args, context, info));
    promises.push(getAssetPrice_Week(parent, args, context, info));
    promises.push(getAssetPrice_Month(parent, args, context, info));

    let values = [];

    await Promise.all(promises)
        .then(value => {
            values = [
                { timeframe: '1m', price: value[0] },
                { timeframe: '1h', price: value[1] },
                { timeframe: '1d', price: value[2] },
                { timeframe: '1w', price: value[3] },
                { timeframe: '1M', price: value[4] },
            ]
        });

    return values;
    
}

async function getAssetBalances(parent, args, context, info) {
    let now = new Date((new Date()).setSeconds(0));
    let hourAgo = date.addHours(now, -1);
    let dayAgo = date.addDays(now, -1);
    let weekAgo = date.addDays(now, -7);
    let monthAgo = date.addMonths(now, -1);

    let promises = [];
    promises.push(getAssetBalance(now, args.symbol, context));
    promises.push(getAssetBalance(hourAgo, args.symbol, context));
    promises.push(getAssetBalance(dayAgo, args.symbol, context));
    promises.push(getAssetBalance(weekAgo, args.symbol, context));
    promises.push(getAssetBalance(monthAgo, args.symbol, context));

    let values = [];
    await Promise.all(promises)
        .then(value => {
            values = [
                { timeframe: '1m', balance: value[0] },
                { timeframe: '1h', balance: value[1] },
                { timeframe: '1d', balance: value[2] },
                { timeframe: '1w', balance: value[3] },
                { timeframe: '1M', balance: value[4] },
            ]
        });
    return values;
    
}

async function getAssetBalance(datetime, symbol, context) {
    let wallet = await context.prisma.binanceWallet.findFirst({
        where: { 
            AND: [
                { symbol: symbol },
                { datetime: { lt: datetime } },
            ]
         },
        orderBy: { datetime: 'desc' }
    });
    
    if (wallet) {
        console.log(`${symbol} balance was ${wallet.balance} at ${formatDate(datetime)}`);
        return wallet.balance;
    } else {
        console.log(`No record of ${symbol} balance at ${formatDate(datetime)}`);
        return -1
    }
}

async function saveBinanceWalletBalance(parent, args, context, info) {
    var wallet = await context.prisma.binanceWallet.create({
        data: {
            datetime: args.datetime,
            symbol: args.symbol,
            balance: args.balance,
        }
    });

    console.log(`Wallet balance added for ${args.symbol}: ${args.balance.toFixed(2)}`);
    return wallet;
}

async function getAssetCandles(parent, args, context, info) {

    let periodCount = args.periods ?? 30;
    let chunkCount = 20;


    if (['1m', '1h', '1d'].includes(args.interval)) {
        let values = await context.prisma.assetBar.findMany({
            where: {
                AND: [
                    { symbol: args.symbol },
                    { interval: args.interval }
                ]
            },
            orderBy: { openTime: 'desc' },
            take: periodCount
        });

        values.forEach(value => {
            value.datetime = new Date(value.openTime);
        })
        return values.reverse();
    }

    let interval = args.interval ?? '1m';
    let queryInterval = undefined;

    let timeframeNum = interval.slice(0, -1);
    let timeframeUnit = interval.slice(-1);

    let totalTime = timeframeNum * periodCount;;
    let addTimeframeUnit = undefined;
    if (timeframeUnit == 'm') {
        queryInterval = '1m';
        addTimeframeUnit = date.addMinutes;
        if (args.start && args.end) totalTime = date.subtract(end - start).toMinutes();
    } else if (timeframeUnit == 'h') {
        queryInterval = '1h';
        addTimeframeUnit = date.addHours;
        if (args.start && args.end) totalTime = date.subtract(end - start).toHours();
    } else if (timeframeUnit == 'd') {
        queryInterval = '1d';
        addTimeframeUnit = date.addDays;
        if (args.start && args.end) totalTime = date.subtract(end - start).toDays();
    } else if (timeframeUnit == 'w') {
        queryInterval = '1w';
        addTimeframeUnit = date.addDays;
        timeframeNum = timeframeNum * 7;
        if (args.start && args.end) totalTime = date.subtract(end - start).toDays();
    } else if (timeframeUnit == 'M') {
        queryInterval = '1M';
        addTimeframeUnit = date.addMonths;
        // Candles returned might not be in exact range because of different month sizes
        if (args.start && args.end) totalTime = date.subtract(end - start).toDays();
        timeframeNum = timeframeNum * 30;
    }

    let chunkLength = totalTime / chunkCount; // Ex. 6mins

    let end = args.end ?? new Date((new Date()).setSeconds(0));
    let start = args.start ?? addTimeframeUnit(end, -totalTime);
    end = addTimeframeUnit(start, chunkLength);

    let promises = [];
    for (let i = 0; i < chunkCount; i++) {
        promise = context.prisma.assetBar.findMany({
            where: {
                AND: [
                    { symbol: args.symbol },
                    { interval: queryInterval },
                    { openTime: { gte: start } },
                    { openTime: { lt: end } }
                ]
            },
            orderBy: { openTime: 'asc' }
        });
        promises.push(promise);

        start = end;
        end = addTimeframeUnit(start, chunkLength);
    }

    let assetValues = [];
    await Promise.all(promises).then(values => assetValues = values.flat());
    assetValues = assetValues.sort((a, b) => b.datetime - a.datetime);

    let bars = [];
    let openTime = new Date(assetValues[0].openTime.toJSON());
    let closeTime = date.addSeconds(addTimeframeUnit(openTime, timeframeNum), -1);
    let open = assetValues[0].open;

    let bar = { openTime, open, high: open, low: undefined, close: 0, volume: 0, closeTime };
    bars.push(bar);

    assetValues.forEach(av => {
        if (av.openTime < closeTime) {
            bar.high = (bar.high < av.high) ? av.high : bar.high
            bar.low = (!bar.low || bar.low > av.low) ? av.low : bar.low
            bar.close = av.close
            bar.volume += av.volume;
        } else {
            openTime = addTimeframeUnit(openTime, timeframeNum);
            closeTime = date.addSeconds(addTimeframeUnit(openTime, timeframeNum), -1);

            bar = { openTime, open: av.open, high: av.high, low: av.low, close: av.close, volume: av.volume, closeTime };
            bars.push(bar);
        }
    });

    console.log(`Retrieved ${args.symbol} bars for ${args.interval} interval`);

    return bars;
}

function currency(number) {
    return new Intl.NumberFormat([ ], { style: 'currency', currency: 'USD', currencyDisplay: 'narrowSymbol' }).format(number);
}

function formatDate(date) {
    return new Intl.DateTimeFormat([], { dateStyle: 'short', timeStyle: 'short' }).format(date)
}

module.exports = {
    getAssetName,
    getAssetPrices,
    getAssetBalances,
    saveBinanceWalletBalance,
    getAssetCandles
}