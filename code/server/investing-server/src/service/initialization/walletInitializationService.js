const binanceService = require("../../service/binanceService");
const Wallet = require('../../models/initialization/wallet');

async function getWallets(context) {
    let wallets = await binanceService.getWallets();
    await setWalletForeignKeys(wallets, context);
    await saveWallets(wallets, context);
    return wallets
}

async function setWalletForeignKeys(wallets, context) {
    let idExchange = (await context.prisma.exchange.findFirst({
        where: { text: "Binance US" },
        select: { id: true }
    })).id;

    let assets = await context.prisma.asset.findMany();

    wallets.forEach(wallet => {
        wallet.idExchange = idExchange;
        wallet.idAsset = assets.find(asset => asset.symbol == wallet.symbol).id;
        wallet.idUser = 1;
    })

}

async function saveWallets(wallets, context) {
    let newWallets = [];

    for (let i = 0; i < wallets.length; i++) {
        let wallet = wallets[i];
        let wallet_Out = await context.prisma.wallet.findFirst({
            where: { 
                idUser: wallet.idUser,
                idExchange: wallet.idExchange,
                idAsset: wallet.idAsset
            }
        })

        if (!wallet_Out) {
            let wallet_New = await context.prisma.wallet.create({
                data: {
                    idUser: wallet.idUser,
                    idExchange: wallet.idExchange,
                    idAsset: wallet.idAsset,
                    address: wallet.address
                }
            });
            newWallets.push(wallet_New)
        }
    }
    
    return newWallets;
}

module.exports = {
    getWallets
}