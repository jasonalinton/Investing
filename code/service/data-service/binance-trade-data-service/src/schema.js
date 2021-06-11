import { makeExecutableSchema, addMockFunctionsToSchema } from 'graphql-tools';

const typeDefs = `
    type Trade {
        id: ID!
        datetime:         String
        amount_Traded:    Int
        amount_Fee:       Float
        price_Unit:       String
        price_Total:      Float
        price_Subtotal:   Float
        orderID_Exchange: Int
        idTransaction:    Int
        idExchange:       Int
        idOrder:          Int
        idType:           Int
        idAsset:          Int
        idAsset_Fee:      Int
        idAsset_Price:    Int
    }

    type Query {
        trades: [Trade]
    }
`;

const schema = makeExecutableSchema({ typeDefs });
addMockFunctionsToSchema({ schema });

export { schema };