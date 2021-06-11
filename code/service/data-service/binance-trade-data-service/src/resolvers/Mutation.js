async function trades(parent, args, context, info) {
    let trades = await context.prisma.trade.findMany({
        where: { symbol: args.symbol },
        orderBy: { datetime: 'desc' }
    });

    console.log(`Retrieved ${trades.length} trades for ${args.symbol}`)
    return trades;
}

async function addTrade(parent, args, context, info) {
    let trade = await context.prisma.trade.findFirst({
        where: {
            AND: [
                { symbol: args.trade.symbol },
                { orderID_Exchange: args.trade.orderID_Exchange },
                { datetime: args.trade.datetime },
                { amount_Traded: args.trade.amount_Traded },
            ]
        },
        orderBy: { datetime: 'desc' }
    });

    if (!trade) {
        trade = await context.prisma.trade.create({
            data: args.trade
        });
        console.log(`Added new trade for ${trade.symbol} from ${formatDate(trade.datetime)}`);
    } else {
        console.log(`Binance trade with exchange order ID of ${trade.orderID_Exchange} already exists`);
    }
    
    return trade;
}

async function getLastTradeDatetime(parent, args, context, info) {
    let trade = await context.prisma.trade.findFirst({
        where: { symbol: args.symbol },
        orderBy: { datetime: 'desc' }
    });

    if (trade != null)
        console.log(`Last saved ${args.symbol} trades was from ${formatDate(trade.datetime)}`);
    else
        console.log(`No trade records for ${args.symbol}`);
    
    return trade.datetime;
}

function formatDate(date) {
    return new Intl.DateTimeFormat([], { dateStyle: 'short', timeStyle: 'short' }).format(date)
}

module.exports = {
    trades,
    addTrade,
    getLastTradeDatetime
}