-- CreateTable
CREATE TABLE "Trade" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "datetime" DATETIME NOT NULL,
    "symbol" TEXT NOT NULL,
    "amount_Traded" INTEGER NOT NULL,
    "amount_Fee" REAL NOT NULL,
    "price_Unit" TEXT NOT NULL,
    "price_Total" REAL NOT NULL,
    "price_Subtotal" REAL NOT NULL,
    "orderID_Exchange" INTEGER NOT NULL,
    "idTransaction" INTEGER NOT NULL,
    "idExchange" INTEGER NOT NULL,
    "idOrder" INTEGER NOT NULL,
    "idType" INTEGER NOT NULL,
    "idAsset" INTEGER NOT NULL,
    "idAsset_Fee" INTEGER NOT NULL,
    "idAsset_Price" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
