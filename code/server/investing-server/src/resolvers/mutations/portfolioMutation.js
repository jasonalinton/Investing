const date = require('date-and-time');


async function getAssetList() {
    let assets = await context.prisma.binanceWallet.findFirst({
        select: { city: true },
        distinct: ['city']
    });

    return assets;
}

module.exports = {
    
}