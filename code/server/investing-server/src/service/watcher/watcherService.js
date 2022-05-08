const AssetValueService = require('../watcher/assetValueService');
// const { getTrackedAssets } = require('../../data/asset/assetValueDAO');
const assetValueDAO = require('../../data/asset/assetValueDAO');
// const { assetValueDAO } = require('../../index')

class WatcherService { 
    prisma;

    constructor(prisma) {
        this.prisma = prisma;
    }
    
    async start() {
        this.startAssetValueWatcher();
    }

    async startAssetValueWatcher() {
        let barIntervals = ['1m', '1h', '1d', '1w', '1M'];
        let loopInterval = 3600000;
        let promises = [];
        let assets = await assetValueDAO.getTrackedAssets();

        // let i = 1;
        // const avService = new AssetValueService(assets[i].baseAsset.symbol, assets[i].quoteAsset.symbol, barIntervals, loopInterval);
        // promises.push(avService.start());

        for (let i = 0; i < assets.length; i++) {
            const avService = new AssetValueService(assets[i].baseAsset.symbol, assets[i].quoteAsset.symbol, barIntervals, loopInterval);
            await avService.start();
            // promises.push(avService.start());
        };

        // if (i < assets.length)
        //     this.startAssetValueService(assets, barIntervals, loopInterval, promises, i);
    }

    async startAssetValueService(assets, barIntervals, loopInterval, promises, i) {
        setTimeout(() => {
            const avService = new AssetValueService(assets[i].baseAsset.symbol, assets[i].quoteAsset.symbol, barIntervals, loopInterval);
            promises.push(avService.start());

            if (i < assets.length) 
                this.startAssetValueService(assets, barIntervals, loopInterval, promises, ++i)
        }, 2000);
        
    }
}

module.exports = WatcherService;