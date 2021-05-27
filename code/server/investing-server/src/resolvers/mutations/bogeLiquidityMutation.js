async function getBogeLiquidity(parent, args, context, info) {
    var bogeLiquidity = await context.prisma.bogeLiquidity.findFirst({
        where: {
            datetime: { lte: new Date(args.datetime) }
        }
    });

    console.log(`Got BOGE liquidity: ${bogeLiquidity.bnbBalance}BNB  :  ${bogeLiquidity.bogeBalance}BOGE`);
    return bogeLiquidity;
}

async function addBogeLiquidity(parent, args, context, info) {
    let datetimeArray = (new Date(args.datetime)).toJSON().split(":");
    let datetime = new Date(`${datetimeArray[0]}:${datetimeArray[1]}:00.000Z`);

    let assetValue = await context.prisma.assetValue.findFirst({
        where: {
            symbol: "BNB",
            openTime: {
                equals: datetime
            }
        }
    });

    let value = assetValue.open;
    let bogePerBNB = args.bnbBalance / args.bogeBalance;
    let price = bogePerBNB * value;
    
    var bogeLiquidity = await context.prisma.bogeLiquidity.create({
        data: {
            datetime: args.datetime,
            bnbBalance: args.bnbBalance,
            bogeBalance: args.bogeBalance,
            price: price,
            address: args.address
        }
    });

    console.log(`${(new Date(args.datetime)).toJSON()}: Boge liquidity record added for ${(args.bnbBalance).toFixed(2)} BNB - ${args.bogeBalance.toFixed(2)} BOGE $${price.toFixed(2)}`);
    return bogeLiquidity;
}
  
module.exports = {
    getBogeLiquidity,
    addBogeLiquidity
}