function assetValues(parent, args, context, info) {
    return context.prisma.assetValue.findMany({
        include: {
            baseAsset: true,
            quoteAsset: true
        }
    })
}

function bogeTransfers(parent, args, context, info) {
    return context.prisma.bogeTransfers.findMany()
}

async function getLastSavedTransferTime(parent, args, context, info) {
    let lastTransfer = await context.prisma.bogeTransfers.findFirst({
        where: { symbol: args.symbol },
        select: { datetime: true },
        orderBy: { datetime: "desc" }
    });

    // let lastTime = ( args.symbol == "BOGE" ) ? new Date(2021, 3, 1) : new Date(2021, 3, 1);
    let lastTime = new Date(2021, 3, 1);
    if (lastTransfer)
        lastTime = lastTransfer.datetime;
    
    console.log("Last BOGE transfer " + lastTime.toJSON());
    return lastTime.toJSON();
}
  
module.exports = {
    assetValues,
    bogeTransfers,
    getLastSavedTransferTime
}