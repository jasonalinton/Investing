async function trades(parent, args, context, info) {
    let trades = await context.prisma.trade.findMany();

    console.log(`Retrieved ${trades.length} trades`)
    return trades;
}

module.exports = {
    trades
}