const { ApolloServer } = require('apollo-server');
const { PrismaClient } = require('@prisma/client');

const fs = require('fs');
const path = require('path');

const Query = require('./resolvers/Query')
const MutationFile = require('./resolvers/Mutation')
const BogeLiquidityMutation = require('./resolvers/mutations/bogeLiquidityMutation')
const AssetInfoMutation = require('./resolvers/mutations/assetInfoMutation')
const PortfolioMutation = require('./resolvers/mutations/portfolioMutation')

const Mutation = {
  ...MutationFile,
  ...BogeLiquidityMutation,
  ...AssetInfoMutation,
  ...PortfolioMutation
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
