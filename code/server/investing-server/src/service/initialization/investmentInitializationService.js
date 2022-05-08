const binanceService = require("../../service/binanceService");
const Transfer = require('../../models/initialization/transfer');
const csv = require('csvtojson');

/* THIS WILL EVENTUALLY RUN THE GET ASSETS FUNCTIION FOR THE EXCHANGE INTERFACE */
async function getInvestments(context) {
    let assets = await context.prisma.asset.findMany();
    let wallets = await context.prisma.wallet.findMany({
        where: { idUser: 1 },
        select: { idAsset: true, address: true }
    });
    let exchange = await context.prisma.exchange.findFirst({
        where: { text: 'Binance US' },
        select: { id: true }
    });

    let investments = await binanceService.getInvestments(assets, wallets, exchange.id);
    investments = await saveInvestments(investments, context);
    return investments
}

async function saveInvestments(investments, context) {
    let accountIDs = await getAccountIDs(context);
    let transfers = [];

    for (let i = 0; i < investments.length; i++) {
        let investment = investments[i];

        let transaction = {
            idType: accountIDs.investmentID,
            datetime: investment.datetime,
            ledger: {
                create: [
                    {
                        value: investment.priceTotal,
                        quantity: investment.quantity,
                        idSide: accountIDs.creditID,
                        idAccount: accountIDs.capitalID,
                        idAsset: investment.idAsset
                    },
                    {
                        value: investment.priceSubtotal,
                        quantity: investment.quantity,
                        idSide: accountIDs.debitID,
                        idAccount: accountIDs.cryptoID,
                        idAsset: investment.idAsset
                    },
                    {
                        value: investment.fee,
                        quantity: investment.quantity,
                        idSide: accountIDs.debitID,
                        idAccount: accountIDs.expenseID,
                        idAsset: investment.idAsset
                    }
                ]
            }
        }

        let transfer = await context.prisma.transfer.create({
            data: {
                datetime: investment.datetime,
                quantity: investment.quantity,
                fee: investment.fee,
                price_Total: investment.priceTotal,
                price_Subtotal: investment.priceSubtotal,
                address_In: investment.addressIn,
                transferID: investment.transferID,
                txID: investment.txID,
                transaction: { create: transaction },
                type: { connect: { id: accountIDs.transferID } },
                exchange: { connect: { id: investment.idExchange } },
                exchange_In: { connect: { id: investment.idExchange } },
                asset: { connect: { id: investment.idAsset } },
                asset_Fee: { connect: { id: investment.idFeeAsset } },
                status: { connect: { id: accountIDs.successID } },
            }
        })
        transfers.push(transfer);
    }
    return transfers;
}

async function getAccountIDs(context) {
    let transaction_Type = await context.prisma.type.findFirst({
        where: { text: 'Transaction Type' }
    });
    let investment_Type = await context.prisma.type.findFirst({
        where: { text: 'Investment', idParent: transaction_Type.id }
    });
    let ledgerAccount_Type = await context.prisma.type.findFirst({
        where: { text: 'Ledger Account', idParent: 1 }
    });
    let equityAccount_Type = await context.prisma.type.findFirst({
        where: { text: 'Equity', idParent: ledgerAccount_Type.id }
    });
    let capitalAccount_Type = await context.prisma.type.findFirst({
        where: { text: 'Capital Contributions', idParent: equityAccount_Type.id }
    });
    let assetAccount_Type = await context.prisma.type.findFirst({
        where: { text: 'Asset', idParent: ledgerAccount_Type.id }
    });
    let cryptoAccount_Type = await context.prisma.type.findFirst({
        where: { text: 'Crypto', idParent: assetAccount_Type.id }
    });
    let expenseAccount_Type = await context.prisma.type.findFirst({
        where: { text: 'Expense', idParent: equityAccount_Type.id }
    });
    let ledgerSide_Type = await context.prisma.type.findFirst({
        where: { text: 'Ledger Side', idParent: 1 }
    });
    let debit_Type = await context.prisma.type.findFirst({
        where: { text: 'Debit', idParent: ledgerSide_Type.id }
    });
    let credit_Type = await context.prisma.type.findFirst({
        where: { text: 'Credit', idParent: ledgerSide_Type.id }
    });

    let transfer_Type = await context.prisma.type.findFirst({
        where: { text: 'Transfer Type', idParent: 1 }
    });
    let investmentTransfer_Type = await context.prisma.type.findFirst({
        where: { text: 'Investment', idParent: transaction_Type.id }
    });

    let depositeStatus_Type = await context.prisma.type.findFirst({
        where: { text: 'Deposit Status', idParent: 1 }
    });
    let success_Type = await context.prisma.type.findFirst({
        where: { text: 'Success', idParent: depositeStatus_Type.id }
    });

    return {
        transactionID: transaction_Type.id,
        investmentID: investment_Type.id,
        ledgerID: ledgerAccount_Type.id,
        equityID: equityAccount_Type.id,
        capitalID: capitalAccount_Type.id,
        assetID: assetAccount_Type.id,
        cryptoID: cryptoAccount_Type.id,
        expenseID: expenseAccount_Type.id,
        ledgerID: ledgerSide_Type.id,
        debitID: debit_Type.id,
        creditID: credit_Type.id,
        transferID: transfer_Type.id,
        investmentTransferID: investmentTransfer_Type.id,
        successID: success_Type.id
    }
}

module.exports = {
    getInvestments,
}