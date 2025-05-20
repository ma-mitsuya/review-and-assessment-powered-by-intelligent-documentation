// Ref: https://github.com/aws-samples/prisma-lambda-cdk/blob/main/lib/construct/prisma-function.ts

import * as lambda from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import * as iam from "aws-cdk-lib/aws-iam";
import { DatabaseConnectionProps } from "./database";

interface DockerPrismaFunctionProps extends lambda.DockerImageFunctionProps {
  database: DatabaseConnectionProps;
}

export class DockerPrismaFunction extends lambda.DockerImageFunction {
  constructor(scope: Construct, id: string, props: DockerPrismaFunctionProps) {
    const handlerRole =
      props.role ||
      new iam.Role(scope, "HandlerRole", {
        assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      });
    // Add VPC access to the Lambda function
    handlerRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaVPCAccessExecutionRole"
      )
    );

    super(scope, id, {
      ...props,
      role: handlerRole,
      environment: {
        ...props.environment,
        DATABASE_HOST: props.database.host,
        DATABASE_PORT: props.database.port,
        DATABASE_ENGINE: props.database.engine,
        DATABASE_USER: props.database.username,
        DATABASE_PASSWORD: props.database.password,
        DATABASE_NAME: props.database.databaseName,
        // Aurora Serverless v2 cold start takes up to 15 seconds
        // https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections/connection-pool
        DATABASE_OPTION: "?pool_timeout=20&connect_timeout=20",
      },
    });
  }
}
