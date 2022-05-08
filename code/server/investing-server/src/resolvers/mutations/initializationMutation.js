const { getExchangeAssets, getSavedAssets, getNewAssets, saveAssets } 
    = require("../../service/initialization/assetInitializationService");
const { getExchangeAssetPairs, saveAssetPairs } 
    = require("../../service/initialization/assetPairInitializationService");
const { getInvestments } = require("../../service/initialization/investmentInitializationService");
const { getWallets } = require("../../service/initialization/walletInitializationService");

async function populateAssets(parent, args, context, info) {
    let exchangeAssets = await getExchangeAssets();
    let savedAssets = await getSavedAssets(context);

    let newAssets = getNewAssets(exchangeAssets, savedAssets);
    newAssets = await saveAssets(newAssets, context);

    return true;
}

async function populateAssetPairs(parent, args, context, info) {
    let exchangeAPs = await getExchangeAssetPairs();
    let assetPairs = await saveAssetPairs(exchangeAPs, context);

    return true;
}

async function populateWallets(parent, args, context, info) {
    let wallets = await getWallets(context);
    return true;
}

async function populateInvestments(parent, args, context, info) {
    let investments = await getInvestments(context);
    
    return investments;
}

module.exports = {
    populateAssets,
    populateAssetPairs,
    populateWallets,
    populateInvestments
}