// import { schema } from './src/schema';
import BinanceTradeService from './src/service/binanceTradeService'

const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const { PrismaClient } = require('@prisma/client');

const fs = require('fs');
const path = require('path');
const typeDefs = fs.readFileSync(path.join(__dirname, './src/schema.graphql'), 'utf8');

const Query = require('./src/resolvers/Query');
const Mutation = require('./src/resolvers/Mutation');

const resolvers = {
    Query,
    Mutation
};

const PORT = 4001;

async function startServer() {
    const prisma = new PrismaClient();
    const server = new ApolloServer({
        typeDefs,
        resolvers,
        context: ({ req }) => {
            return {
                ...req,
                prisma
            };
        }
    });
    await server.start();

    const app = express();
    server.applyMiddleware({ app });

    await new Promise(resolve => app.listen({ port: PORT }, resolve));
    console.log(`🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`);
    return { server, app };
}

startServer();

let binanceTradeService = new BinanceTradeService(60000, PORT);
binanceTradeService.start();