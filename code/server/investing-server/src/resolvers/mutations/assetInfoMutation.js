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
    let assetValue = await context.prisma.assetValue.findFirst({
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
    
    let assetValue = await context.prisma.assetValue.findFirst({
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
    
    let assetValue = await context.prisma.assetValue.findFirst({
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
    
    let assetValue = await context.prisma.assetValue.findFirst({
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
    
    let assetValue = await context.prisma.assetValue.findFirst({
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
    saveBinanceWalletBalance
}