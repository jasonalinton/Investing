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

// NOT IDEAL: This can return the wrong values if there is a gap in the saved liquidity times 
// or if liquidity wasn't saved for an address
async function getBogePrice(parent, args, context, info) {
    var bogeLiquidity = await context.prisma.bogeLiquidities.findFirst({
        orderBy: { datetime: "desc" },
    });
    
    console.log(`Retrieved BOGE price: $${bogeLiquidity.price.toFixed(2)}`);
    return bogeLiquidity.price;
}

// NOT IDEAL: This can return the wrong values if there is a gap in the saved liquidity times 
// or if liquidity wasn't saved for an address
async function getBogePrice1(parent, args, context, info) {
    var bogeLiquidity = await context.prisma.bogeLiquidities.findFirst({
        orderBy: { datetime: "desc" },
    });
    
    console.log(`Retrieved BOGE price: $${bogeLiquidity.price.toFixed(2)}`);
    return bogeLiquidity.price;
}
  
module.exports = {
    assetValues,
    bogeTransfers,
    getLastSavedTransferTime,
    getBogePrice,
    getBogePrice1,
}