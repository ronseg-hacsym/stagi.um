import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { ApolloServerPluginInlineTraceDisabled } from '@apollo/server/plugin/disabled';
// @ts-ignore
import express from 'express';
import * as http from 'http';
// @ts-ignore
import cors from 'cors';
// @ts-ignore
import bodyParser from 'body-parser';

import { getChannelSchema } from './channel/subgraph';

export const LOCAL_SUBGRAPH_CONFIG = [
  {
    name: 'channel',
    getSchema: getChannelSchema
  }
]

const getLocalSubgraphConfig = (subgraphName: any) =>
  LOCAL_SUBGRAPH_CONFIG.find(it => it.name === subgraphName);

export const startSubgraphs = async (httpPort: any) => {
  // Create a monolith express app for all subgraphs
  const app = express();
  const httpServer = http.createServer(app);
  const serverPort = process.env.PORT ?? httpPort;

  // Run each subgraph on the same http server, but at different paths
  for (const subgraph of LOCAL_SUBGRAPH_CONFIG) {
    const subgraphConfig: any = getLocalSubgraphConfig(subgraph.name);
    const schema = subgraphConfig.getSchema();
    const server = new ApolloServer({
      schema,
      // For a real subgraph introspection should remain off, but for demo we enabled
      introspection: true,
      plugins: [ApolloServerPluginDrainHttpServer({ httpServer }), ApolloServerPluginInlineTraceDisabled()]
    });

    await server.start();

    const path = `/${subgraphConfig!.name!}/graphql`;
    app.use(
      path,
      cors({
        // origin: 'http://localhost:5173'
      }),
      bodyParser.json(),
      expressMiddleware(server, {
        context: async ({ req }: any) => ({ headers: req.headers })
      })
    );

    console.log(`Setting up [${subgraphConfig!.name!}] subgraph at http://localhost:${serverPort}${path}`);
  }

  // Start entire monolith at given port
  await new Promise((resolve: any) => httpServer.listen({ port: serverPort }, resolve));

  console.log('All subgraphs started.')
};

// For local development, we will run `rover dev` that will handle
// composition and configure the ports of the Router and subgraphs manually
// See supergraph-config-dev.yaml for config setup
(async () => {
  // start subgraphs in monolith mode
  let port = undefined;
    port = 4001;
  await startSubgraphs(port);
})();



