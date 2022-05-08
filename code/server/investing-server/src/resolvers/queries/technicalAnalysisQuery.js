const assetValueDAO = require('../../data/asset/assetValueDAO');
const technicalAnalysisService = require('../../service/risk/technicalAnalysisService');

async function thirtyEightTwo(parent, { symbol, interval, periods }, context, info) {
    let bars = await assetValueDAO.bars(symbol, interval, periods);
    let hammers = technicalAnalysisService.thirthEightPointTwo(bars);
    return hammers;
}

async function highsAndLows(parent, { symbol, interval, periods }, context, info) {
    try {
        let bars = await assetValueDAO.bars(symbol, interval, periods);
        let highsAndLows = technicalAnalysisService.highsAndLows(bars, { symbol, interval, periods }, context);
        return highsAndLows;
    } catch (ex) {
        console.log(ex);
    }
}

module.exports = {
    thirtyEightTwo,
    highsAndLows
}