const binanceService = require("../../service/binanceService");
const Asset = require('../../models/initialization/asset');
const AssetPair = require("../../models/initialization/assetPair");

async function getExchangeAssetPairs() {
    let assetPairs = await binanceService.getAssetPairs();
    let exchangeAssetPairs = [{
        exchange: 'Binance US',
        assetPairs: assetPairs
    }]
    return exchangeAssetPairs
}

async function saveAssetPairs(exchangeAPs, context) {
    let assets = await context.prisma.asset.findMany();

    for (let i = 0; i < exchangeAPs.length; i++) {
        let assetPairs = exchangeAPs[i].assetPairs;
    
        let idExchange = (await context.prisma.exchange.findFirst({
            where: { text: exchangeAPs[i].exchange },
            select: { id: true }
        })).id;
        
        for (let j = 0; j < assetPairs.length; j++) {
            try {
                let assetPair = assetPairs[j];
                let idBaseAsset = assets.find(asset => asset.symbol == assetPair.baseAsset).id;
                let idQuoteAsset = assets.find(asset => asset.symbol == assetPair.quoteAsset).id;
    
                let assetPair_Out = await context.prisma.assetpair.findFirst({
                    where: {
                        idBaseAsset,
                        idQuoteAsset
                    },
                    include: {
                        exchange_assetpair: true
                    }
                });
    
                if (!assetPair_Out) {
                    let newAssetPair = await context.prisma.assetpair.create({
                        data: {
                            idBaseAsset,
                            idQuoteAsset,
                            exchange_assetpair: {
                                create: {
                                    idExchange,
                                    idBaseAsset,
                                    idQuoteAsset
                                }
                            }
                        }
                    });
                } else {
                    let exchangeIDs = assetPair_Out.exchange_assetpair.flatMap(__ => __.idExchange);
                    if (!exchangeIDs.includes(idExchange)) {
                        await context.prisma.assetpair.update({
                            data: {
                                exchange_assetpair: {
                                    create: {
                                        idExchange,
                                        idBaseAsset,
                                        idQuoteAsset
                                    }
                                }
                            },
                            where: {
                                id: assetPair_Out.id
                            },
                        })
                    }
                }
            } catch (ex) {
                console.log(ex);
            }
        }
    }
}

// /* Get assets that have already been saved to the server */
// async function getSavedAssetPairs(exchange, context) {
//     let exchangeOut = await context.prisma.exchange.findFirst({
//         where: { text: exchange },
//         select: { id: true }
//     });
//     let exchangeID = exchangeOut.id;

//     let assetPairs = await context.prisma.exchange_assetpair.findMany({
//         include: {
//             assetpair: {
//                 include: {
//                     baseAsset: true,
//                     quoteAsset: true
//                 }
//             }
//         },
//         where: {
//             idExchange: exchangeID
//         }
//     });
//     let assetPairModels = [];
//     assetPairs.forEach(assetPair =>
//         assetPairModels.push(new AssetPair(assetPair.symbol, assetPair.baseAsset, assetPair.quoteAsset)));
//     return assetPairModels;
// }

/* Get assets that have already been saved to the server */
async function getSavedAssetPairs(exchange, context) {
    let assetPairs = await context.prisma.assetpair.findMany({
        include: {
            baseAsset: true,
            quoteAsset: true,
            exchange_assetpair: true
        }
    });
    let assetPairModels = [];
    assetPairs.forEach(assetPair =>
        assetPairModels.push(new AssetPair(assetPair.symbol, assetPair.baseAsset, assetPair.quoteAsset)));
    return assetPairModels;
}

// /* Get exchange assets that were not yet saved */
// async function getNewAssetPairs(exchangeAPs, context) {
//     for (let i = 0; i < exchangeAPs.length; i++) {
//         let exchangeAP = exchangeAPs[i]
//         let savedExchangeAPs = await getSavedAssetPairs(exchangeAP.exchange, context);
//         savedExchangeAPs = savedExchangeAPs.flatMap(_seap => _seap.symbol);
//         exchangeAP.newAssetPairs = [];
//         exchangeAP.assetPairs.forEach(ap => {
//             if (!savedExchangeAPs.includes(ap.symbol)) {
//                 exchangeAP.newAssetPairs.push(new AssetPair(ap.symbol, ap.baseAsset, ap.quoteAsset));
//             }
//         })
//     }
//     return exchangeAPs;
// }

module.exports = {
    getExchangeAssetPairs,
    getSavedAssetPairs,
    // getNewAssetPairs,
    saveAssetPairs
}