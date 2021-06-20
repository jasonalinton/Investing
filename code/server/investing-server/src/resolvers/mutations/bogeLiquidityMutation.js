async function getLiquidityRange(parent, args, context, info) {
    let end = (args.end) ? new Date(args.end) : new Date();

    var bogeLiquidity = await context.prisma.bogeLiquidities.findMany({
        where: {
            AND: [
                { datetime: { lte: end } },
                { datetime: { gte: new Date(args.start) } }
            ],
        },
        orderBy: { datetime: 'asc' }
    });
    
    console.log(`Got BOGE liquidity: ${args.start} ${(args.end) ? '- ' + formatDate(args.start) : ""}`);
    return bogeLiquidity;
}

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

    let assetValue = await context.prisma.assetBar.findFirst({
        where: {
            symbol: "BNB",
            openTime: {
                equals: datetime
            }
        }
    });

    let value = assetValue.open;
    let boge9PerBNB = args.bnbBalance_BOGE_9 / args.bogeBalance_BOGE_9;
    let price_BOGE_9 = boge9PerBNB * value;
    let bogeV2PerBNB = args.bnbBalance_V2 / args.bogeBalance_V2;
    let price_V2 = bogeV2PerBNB * value;
    
    var bogeLiquidity = await context.prisma.bogeLiquidities.create({
        data: {
            datetime: args.datetime,
            bnbBalance_BOGE_9: args.bnbBalance_BOGE_9,
            bogeBalance_BOGE_9: args.bogeBalance_BOGE_9,
            price_BOGE_9: price_BOGE_9,
            bnbBalance_V2: args.bnbBalance_V2,
            bogeBalance_V2: args.bogeBalance_V2,
            price_V2: price_V2,
            price: (price_BOGE_9 + price_V2) / 2
        }
    });

    console.log(`${(new Date(args.datetime)).toJSON()}: Boge liquidity record added. Price = ${bogeLiquidity.price}`);
    return bogeLiquidity;
}

async function fixBogeLiquidity(parent, args, context, info) {
    let BOGE_9 = "0xb9ace332c55779ec5324fabb83a73fb33f7066bf";
    let RouterV2 = "0x15Ef0BE23194e4f21a4c4B871a78985c38e0CE39";

    var bogeLiquidities = await context.prisma.bogeLiquidity.findMany();
    let news = [];

    let last = bogeLiquidities[0];
    for (let i = 1; i < bogeLiquidities.length; i++) {
        current = bogeLiquidities[i];
        if (formatDate(last.datetime) == formatDate(current.datetime)) {
            if (last.address != current.address) {
                let v1 = (BOGE_9 == current.address) ? current : last;
                let v2 = (RouterV2 == current.address) ? current : last;
                
                let newLi = {
                    datetime: current.datetime,
                    bnbBalance_BOGE_9: v1.bnbBalance,
                    bogeBalance_BOGE_9: v1.bogeBalance,
                    price_BOGE_9: v1.price,
                    bnbBalance_V2: v2.bnbBalance,
                    bogeBalance_V2: v2.bogeBalance,
                    price_V2: v2.price,
                    price: (v1.price + v2.price) / 2
                }
                news.push(newLi);
                last = bogeLiquidities[++i];
            } else {
                console.log("Something's off");
                last = current;
            }
        } else {
            last = current;
        }
    }

    news.forEach(async n => {
        let newone = await context.prisma.bogeLiquidities.create({
            data: {
                    datetime: n.datetime,
                    bnbBalance_BOGE_9: n.bnbBalance_BOGE_9,
                    bogeBalance_BOGE_9: n.bogeBalance_BOGE_9,
                    price_BOGE_9: n.price_BOGE_9,
                    bnbBalance_V2: n.bnbBalance_V2,
                    bogeBalance_V2: n.bogeBalance_V2,
                    price_V2: n.price_V2,
                    price: n.price
            },
            select: {
                id: true
            }
        });
        console.log(newone)
    });

    return "Done";
}

function formatDate(date) {
    return new Intl.DateTimeFormat([], { dateStyle: 'short', timeStyle: 'medium' }).format(date)
}

function orderByAscDate(object) {
    object = object.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
    return object;
}
  
module.exports = {
    getLiquidityRange,
    getBogeLiquidity,
    addBogeLiquidity,
    fixBogeLiquidity
}