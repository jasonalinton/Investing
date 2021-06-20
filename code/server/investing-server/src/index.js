const { ApolloServer } = require('apollo-server');
const { PrismaClient } = require('@prisma/client');

const fs = require('fs');
const path = require('path');

const QueryFile = require('./resolvers/Query')
const MutationFile = require('./resolvers/Mutation')
const SubscriptionFile = require('./resolvers/Subscription')
const BogeLiquidityMutation = require('./resolvers/mutations/bogeLiquidityMutation')
const AssetInfoMutation = require('./resolvers/mutations/assetInfoMutation')
const PortfolioQuery = require('./resolvers/queries/portfolioQuery')
const AssetListQuery = require('./resolvers/queries/assetListQuery')

const Query = {
  ...QueryFile,
  ...PortfolioQuery,
  ...AssetListQuery
}

const Mutation = {
  ...MutationFile,
  ...BogeLiquidityMutation,
  ...AssetInfoMutation,
}

const Subscription = {
  ...SubscriptionFile
}

const { PubSub } = require('apollo-server');
const pubsub = new PubSub();

const resolvers = {
  Query,
  Mutation,
  Subscription
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
      prisma,
      pubsub
    };
  }
});

server
    .listen()
    .then(({ url }) =>
        console.log(`Server is running on ${url}`)
    );
