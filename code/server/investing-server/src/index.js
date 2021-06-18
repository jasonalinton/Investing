const { ApolloServer } = require('apollo-server');
const { PrismaClient } = require('@prisma/client');

const fs = require('fs');
const path = require('path');

const QueryFile = require('./resolvers/Query')
const MutationFile = require('./resolvers/Mutation')
const BogeLiquidityMutation = require('./resolvers/mutations/bogeLiquidityMutation')
const AssetInfoMutation = require('./resolvers/mutations/assetInfoMutation')
const PortfolioQuery = require('./resolvers/queries/portfolioQuery')

const Query = {
  ...QueryFile,
  ...PortfolioQuery
}

const Mutation = {
  ...MutationFile,
  ...BogeLiquidityMutation,
  ...AssetInfoMutation,
}

const resolvers = {
  Query,
  Mutation
}

const prisma = new PrismaClient()
const server = new ApolloServer({
  typeDefs: fs.readFileSync(
    path.join(__dirname, '/schema.graphql'),
    'utf8'
  ),
  resolvers,
  context: ({ req }) => {
    return {
      ...req,
      prisma
    };
  }
});

server
    .listen()
    .then(({ url }) =>
        console.log(`Server is running on ${url}`)
    );
