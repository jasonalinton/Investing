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
    pancakeAddress = {
        BOGE_9: "0xb9ace332c55779ec5324fabb83a73fb33f7066bf",
        RouterV2: "0x15Ef0BE23194e4f21a4c4B871a78985c38e0CE39"
    };

    var boge9Liquidity = await context.prisma.bogeLiquidity.findFirst({
        where: { address: pancakeAddress.BOGE_9},
        orderBy: { datetime: "desc" },
    });

    var routerV2Liquidity = await context.prisma.bogeLiquidity.findFirst({
        where: { address: pancakeAddress.RouterV2},
        orderBy: { datetime: "desc" },
    });

    var price = (boge9Liquidity.price + routerV2Liquidity.price) / 2;


    console.log(`Retrieved BOGE price: $${price.toFixed(2)}`);
    return price;
}
  
module.exports = {
    assetValues,
    bogeTransfers,
    getLastSavedTransferTime,
    getBogePrice
}