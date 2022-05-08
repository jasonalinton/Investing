const binanceService = require("../../service/binanceService");
const Asset = require('../../models/initialization/asset');

/* THIS WILL EVENTUALLY RUN THE GET ASSETS FUNCTIION FOR THE EXCHANGE INTERFACE */
async function getExchangeAssets() {
    let assets = await binanceService.getAssets();
    return assets
}

/* Get assets that have already been saved to the server */
async function getSavedAssets(context) {
    let assets = await context.prisma.asset.findMany();
    let assetModels = [];
    assets.forEach(asset =>
        assetModels.push(new Asset(asset.symbol, asset.name)));
    return assetModels;
}

/* Get exchange assets that were not yet saved */
function getNewAssets(exchangeAssets, savedAssets) {
    savedAssets = savedAssets.flatMap(_savedAsset => _savedAsset.symbol);
    let newAssets = [];
    exchangeAssets.forEach(_exchangeAsset => {
        if (!savedAssets.includes(_exchangeAsset.symbol)) {
            newAssets.push(new Asset(_exchangeAsset.symbol, _exchangeAsset.name));
        }
    })
    return newAssets;
}

/* Get assets that have already been saved to the server */
async function saveAssets(assets, context) {
    assets.forEach(asset => asset.text = `${asset.name} (${asset.symbol})`);

    let count = await context.prisma.asset.createMany({
        data: assets
    });

    return count;
}

module.exports = {
    getExchangeAssets,
    getSavedAssets,
    getNewAssets,
    saveAssets
}