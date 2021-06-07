// const moment = require('moment-timezone');

async function addAssetValue(parent, args, context, info) {
    let assetValue = args.assetValue;
    var av = await context.prisma.assetValue.create({
        data: {
            symbol: assetValue.symbol,
            interval: assetValue.interval,
            openTime: assetValue.openTime,
            open: parseFloat(assetValue.open),
            high: parseFloat(assetValue.high),
            low: parseFloat(assetValue.low),
            close: parseFloat(assetValue.close),
            volume: parseFloat(assetValue.volume),
            closeTime: assetValue.closeTime,
            quoteAssetVolume: parseFloat(assetValue.quoteAssetVolume),
            numberOfTrades: parseFloat(assetValue.numberOfTrades),
            takerBuyBaseAssetVolume: parseFloat(assetValue.takerBuyBaseAssetVolume),
            takerBuyQuoreAssetVolume: parseFloat(assetValue.takerBuyQuoreAssetVolume),
            baseAsset: {
                connect: { symbol: assetValue.baseAsset.symbol }
            },
            quoteAsset: {
                connect: { symbol: assetValue.quoteAsset.symbol }
            }
        },
        select: {
            id: true,
            idBaseAsset: true,
            idQuoteAsset: true,
            symbol: true,
            interval: true,
            openTime: true,
            open: true,
            high: true,
            low: true,
            close: true,
            volume: true,
            closeTime: true,
            quoteAssetVolume: true,
            numberOfTrades: true,
            takerBuyBaseAssetVolume: true,
            takerBuyQuoreAssetVolume: true,
            quoteAsset: {
                select: {
                    id: true,
                    symbol: true,
                    name: true
                }
            },
            baseAsset: {
                select: {
                    id: true,
                    symbol: true,
                    name: true
                }
            }
        },
    });
    console.log(`Added ${av.baseAsset.symbol} AssetValue-${av.interval}: ${formatDate(av.openTime)} - $${av.open}`);
    return av;
}

async function addAssetValues(parent, args, context, info) {
    let assetValues = []
    args.assetValues.map(assetValue => {
        assetValues.push({
            symbol: assetValue.symbol,
            interval: assetValue.interval,
            openTime: assetValue.openTime,
            open: parseFloat(assetValue.open),
            high: parseFloat(assetValue.high),
            low: parseFloat(assetValue.low),
            close: parseFloat(assetValue.close),
            volume: parseFloat(assetValue.volume),
            closeTime: assetValue.closeTime,
            quoteAssetVolume: parseFloat(assetValue.quoteAssetVolume),
            numberOfTrades: parseFloat(assetValue.numberOfTrades),
            takerBuyBaseAssetVolume: parseFloat(assetValue.takerBuyBaseAssetVolume),
            takerBuyQuoreAssetVolume: parseFloat(assetValue.takerBuyQuoreAssetVolume),
            baseAsset: {
                connect: { symbol: assetValue.baseAsset.symbol }
            },
            quoteAsset: {
                connect: { symbol: assetValue.quoteAsset.symbol }
            }
        });
    });
    
    let assetValues_Out = [];
    assetValues.map(assetValue => {
        var av = context.prisma.assetValue.create({
            data: assetValue,
            select: {
                id: true,
                idBaseAsset: true,
                idQuoteAsset: true,
                symbol: true,
                interval: true,
                openTime: true,
                open: true,
                high: true,
                low: true,
                close: true,
                volume: true,
                closeTime: true,
                quoteAssetVolume: true,
                numberOfTrades: true,
                takerBuyBaseAssetVolume: true,
                takerBuyQuoreAssetVolume: true,
                quoteAsset: {
                    select: {
                        id: true,
                        symbol: true,
                        name: true
                    }
                },
                baseAsset: {
                    select: {
                        id: true,
                        symbol: true,
                        name: true
                    }
                }
            },
        })
        console.log(av);
        assetValues_Out.push(av);
    });
    console.log("Return");
    Promise.allSettled(assetValues_Out).then(() => {
        return assetValues_Out;
    })
    console.log(assetValues_Out);
    return Promise.resolve(assetValues_Out);
}

async function getAssetValue(parent, args, context, info) {
    //var date = moment(args.input.attemptedDateTime).parseZone().format();
    var openTime = (new Date(args.datetime)).setSeconds(0);
    console.log("Get " + args.symbol + " value for " + new Date(openTime));
    console.log("Get " + args.symbol + " value for " + openTime);
    var datetime = new Date(args.datetime);
    var dateString = `${datetime.getUTCFullYear()}/${datetime.getUTCMonth() + 1}/${datetime.getUTCDate()}`;
    
    let assetValue = await context.prisma.assetValue.findFirst({
        where: {
            symbol: args.symbol,
            openTime: {
                equals: new Date(openTime)
            }
        }
    });

    console.log(assetValue);
    return assetValue;
}

async function getAssetValues(parent, args, context, info) {
    console.log("     ")
    console.log(args.datetimes[0]);
    console.log("     ")
    //var date = moment(args.input.attemptedDateTime).parseZone().format();

    return await context.prisma.assetValue.findMany({
        where: {
            symbol: args.symbol,
            openTime: {
                in: args.datetimes
            }
        }
    })
}

async function getAssetValueRange(parent, args, context, info) {
    let startDatetime = (args.startDatetime) ? new Date(args.startDatetime) : new Date(2000, 0, 1);
    let endDatetime = (args.endDatetime) ? new Date(args.endDatetime) : new Date(3000, 0, 1);

    return await context.prisma.assetValue.findMany({
        where: {
            AND: [
                { symbol: args.symbol },
                { openTime: { gte: startDatetime } },
                { openTime: { lte: endDatetime } }
            ]
        }
    })
}

async function getLastSavedTime(parent, args, context, info) {
    let assetValue = await context.prisma.assetValue.findFirst({
        select: { closeTime: true },
        where: {
            AND: [
                { symbol: args.symbol },
                { interval: args.interval }
            ]
        },
        orderBy: { closeTime: "desc" }
    })

    console.log(assetValue);
    let lastTime = (args.symbol == "BOGE") ? new Date(2021, 3, 18, 16, 30, 0) : new Date(2021, 0, 1);
    if (assetValue) {
        lastTime = new Date(assetValue.closeTime);
    }
    console.log(`${args.symbol} history last saved on ${formatDate(lastTime)} for ${args.interval} interval`);
    return lastTime.toJSON();
}

async function getLastTwoKlines(parent, args, context, info) {
    let assetValue = await context.prisma.assetValue.findMany({
        where: { symbol: args.symbol },
        orderBy: { closeTime: "desc" },
        take: 2
    });
    
    return assetValue;
}

async function deleteLastTwoKlines(parent, args, context, info) {
    try {
        let assetValue = await context.prisma.assetValue.findMany({
            where: { symbol: args.symbol },
            orderBy: { closeTime: "desc" },
            take: 2
        });

        assetValue.forEach(async assetValue => {
            let deleted = await context.prisma.assetValue.delete({
                where: {
                    id: assetValue.id
                }
            });
        });

        return true;
    } catch {
        return false;
    }
}

// Used by the Boge history service to get the get the second to last kline and delete the last 2
async function getAndDeleteLastKlines(parent, args, context, info) {
    try {
        //  Get last 2 klines
        let klines = await context.prisma.assetValue.findMany({
            where: {
                AND: [
                    { symbol: args.symbol },
                    { interval: args.interval }
                ]
            },
            orderBy: { openTime: "desc" },
            take: 2
        });

        // Delete klines
        klines.forEach(async kline => {
            await context.prisma.assetValue.delete({
                where: {
                    id: kline.id
                }
            });
        });

        // Get total kline count
        let klineCount = await context.prisma.assetValue.count({
            where: {
                AND: [
                    { symbol: args.symbol },
                    { interval: args.interval }
                ]
            }
        });
        
        if (klineCount > 0) {
            return klines[klines.length - 1];
        } else {
            return null
        }
    } catch {
        return null;
    }
}

async function getBogeTransfers(parent, args, context, info) {
    //var date = moment(args.input.attemptedDateTime).parseZone().format();
    if (args.address) {
        return await context.prisma.bogeTransfers.findMany({
            where: {
                OR: [
                    { senderAddress: args.address },
                    { receiverAddress: args.address }
                ]
            }
        });
    } else {
        return await context.prisma.bogeTransfers.findMany({
            select: {
                datetime: true,
                type: true,
                bnbAmount: true,
                bogeAmount: true,
                priceUnit: true,
                priceTotal: true,
                senderAddress: true,
                receiverAddress: true,
                txHash: true
            }
        });
    }
}

async function getBogeTransferRange(parent, args, context, info) {
    let startDatetime = (args.startDatetime) ? new Date(args.startDatetime) : new Date(2000, 0, 1);
    let endDatetime = (args.endDatetime) ? new Date(args.endDatetime) : new Date(3000, 0, 1);

    if (args.address) {
        return await context.prisma.bogeTransfers.findMany({
            where: {
                OR: [
                    { senderAddress: args.address },
                    { receiverAddress: args.address }
                ],
                AND: [
                    { datetime: { gte: startDatetime } },
                    { datetime: { lte: endDatetime } }
                ]
            }
        });
    } else {
        return await context.prisma.bogeTransfers.findMany({
            where: {
                AND: [
                    { datetime: { gte: startDatetime } },
                    { datetime: { lte: endDatetime } }
                ]
            }
        });
    }
}

async function saveBNBValue(parent, args, context, info) {
    console.log(args);
    return await context.prisma.bogeTransfers.update({
        where: {
            id: Number(args.id)
        },
        data: {
            bnbAmount: args.bnbAmount
        },
        select: {
            datetime: true,
            type: true,
            bnbAmount: true,
            bogeAmount: true,
            senderAddress: true,
            receiverAddress: true,
            txHash: true
        },
    });
    
}

async function addTransfer(parent, args, context, info) {
    let transfer = args.transfer;
    var transfer_Out = await context.prisma.bogeTransfers.create({
        data: {
            datetime: transfer.datetime,
            type: transfer.type,
            bnbAmount: transfer.bnbAmount,
            bogeAmount: transfer.bogeAmount,
            bnbUnitValue: transfer.bnbUnitValue,
            priceUnit: transfer.priceUnit,
            priceTotal: transfer.priceTotal,
            senderAddress: transfer.senderAddress,
            receiverAddress: transfer.receiverAddress,
            txHash: transfer.txHash
        },
        select: {
            id: true,
            datetime: true,
            type: true,
            bnbAmount: true,
            bogeAmount: true,
            bnbUnitValue: true,
            priceUnit: true,
            priceTotal: true,
            senderAddress: true,
            receiverAddress: true,
            txHash: true
        },
    });
    console.log("Transfer added: " + transfer_Out.datetime.toJSON());
    return transfer_Out;
}

async function getWalletBalance(parent, args, context, info) {
    let bogeWallet;
    if (args.datetime) {
        bogeWallet = await context.prisma.bogeWallet.findFirst({
            where: {
                AND: [
                    { address: args.address },
                    { datetime: { lte: new Date(args.datetime) } }
                ]
            },
            orderBy: { datetime: "desc" },
        });

        if (!bogeWallet) {
            // If datetime is before saved record, return the earliest record
            bogeWallet = await context.prisma.bogeWallet.findFirst({
                where: { address: args.address },
                orderBy: { datetime: "asc" },
            });
        }
        
    } else {
        bogeWallet = await context.prisma.bogeWallet.findFirst({
            where: { address: args.address },
            orderBy: { datetime: "desc" },
        });
    }

    console.log(`Got wallet balance for ${args.address}:  ${bogeWallet.balance.toFixed(2)} BOGE`);
    return bogeWallet;
}

async function addWalletBalance(parent, args, context, info) {
    var bogeWallet = await context.prisma.bogeWallet.create({
        data: {
            datetime: args.datetime,
            balance: args.balance,
            name: args.name,
            address: args.address
        }
    });

    console.log(`Wallet balance added for ${args.datetime}: ${args.address}  -  ${args.balance.toFixed(2)} BOGE`);
    return bogeWallet;
}

function formatDate(date) {
    return new Intl.DateTimeFormat([], { dateStyle: 'short', timeStyle: 'short' }).format(date)
}
  
module.exports = {
    addAssetValue,
    addAssetValues,
    getAssetValue,
    getAssetValues,
    getAssetValueRange,
    getLastSavedTime,
    getLastTwoKlines,
    deleteLastTwoKlines,
    getAndDeleteLastKlines,
    saveBNBValue,
    getBogeTransfers,
    getBogeTransferRange,
    addTransfer,
    getWalletBalance,
    addWalletBalance,
    //getg,
    // addBogeLiquidity
}