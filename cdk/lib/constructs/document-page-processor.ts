import * as cdk from "aws-cdk-lib";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as tasks from "aws-cdk-lib/aws-stepfunctions-tasks";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as iam from "aws-cdk-lib/aws-iam";
import * as logs from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";
import { Duration } from "aws-cdk-lib";
import { BedrockBatchSfn } from "@cdklabs/generative-ai-cdk-constructs";

export interface DocumentPageProcessorProps {
  documentBucket: s3.IBucket;
  mediumDocThreshold?: number;
  largeDocThreshold?: number;
  inlineMapConcurrency?: number;
  distributedMapConcurrency?: number;
  logLevel?: sfn.LogLevel;
}

export class DocumentPageProcessor extends Construct {
  public readonly stateMachine: sfn.StateMachine;
  public readonly backendLambda: lambda.Function;

  constructor(scope: Construct, id: string, props: DocumentPageProcessorProps) {
    super(scope, id);

    const mediumDocThreshold = props.mediumDocThreshold || 40;
    const largeDocThreshold = props.largeDocThreshold || 100;
    const inlineMapConcurrency = props.inlineMapConcurrency || 10;
    const distributedMapConcurrency = props.distributedMapConcurrency || 20;
    const logLevel = props.logLevel || sfn.LogLevel.ERROR;

    this.backendLambda = new lambda.Function(this, "BackendFunction", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("../backend"),
      timeout: Duration.minutes(15),
      memorySize: 1024,
      environment: {
        DOCUMENT_BUCKET: props.documentBucket.bucketName,
        BEDROCK_RUNTIME_REGION: "us-west-2",
      },
    });

    props.documentBucket.grantReadWrite(this.backendLambda);

    this.backendLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          "bedrock:InvokeModel",
          "bedrock:CreateModelInvocationJob",
          "bedrock:GetModelInvocationJob",
          "bedrock:StopModelInvocationJob",
        ],
        resources: [
          `arn:aws:bedrock:${cdk.Stack.of(this).region}::foundation-model/*`,
        ],
      })
    );

    const documentProcessorTask = new tasks.LambdaInvoke(
      this,
      "ProcessDocument",
      {
        lambdaFunction: this.backendLambda,
        payload: sfn.TaskInput.fromObject({
          action: "processDocument",
          documentId: sfn.JsonPath.stringAt("$.documentId"),
          fileName: sfn.JsonPath.stringAt("$.fileName"),
          fileType: sfn.JsonPath.stringAt("$.fileType"),
        }),
        outputPath: "$.Payload",
      }
    );

    const extractTextTaskInline = new tasks.LambdaInvoke(
      this,
      "ExtractTextInline",
      {
        lambdaFunction: this.backendLambda,
        payload: sfn.TaskInput.fromObject({
          action: "extractText",
          documentId: sfn.JsonPath.stringAt("$.documentId"),
          pageNumber: sfn.JsonPath.stringAt("$.pageNumber"),
        }),
        resultPath: "$.textExtraction",
        outputPath: "$",
      }
    );

    const processWithLLMTaskInline = new tasks.LambdaInvoke(
      this,
      "ProcessWithLLMInline",
      {
        lambdaFunction: this.backendLambda,
        payload: sfn.TaskInput.fromObject({
          action: "processWithLLM",
          documentId: sfn.JsonPath.stringAt("$.documentId"),
          pageNumber: sfn.JsonPath.stringAt("$.pageNumber"),
        }),
        resultPath: "$.llmProcessing",
        outputPath: "$",
      }
    ).addRetry({
      errors: [
        "Lambda.ServiceException",
        "Lambda.AWSLambdaException",
        "Lambda.SdkClientException",
      ],
      interval: Duration.seconds(2),
      backoffRate: 2,
      maxAttempts: 5,
    });

    const combinePageResultsTaskInline = new tasks.LambdaInvoke(
      this,
      "CombinePageResultsInline",
      {
        lambdaFunction: this.backendLambda,
        payload: sfn.TaskInput.fromObject({
          action: "combinePageResults",
          documentId: sfn.JsonPath.stringAt("$.documentId"),
          pageNumber: sfn.JsonPath.stringAt("$.pageNumber"),
        }),
        outputPath: "$.Payload",
      }
    );

    const parallelProcessingInline = new sfn.Parallel(
      this,
      "ParallelProcessingInline",
      {
        resultPath: "$",
        outputPath: "$",
      }
    )
      .branch(extractTextTaskInline)
      .branch(processWithLLMTaskInline)
      .addCatch(
        new tasks.LambdaInvoke(this, "HandleParallelErrorInline", {
          lambdaFunction: this.backendLambda,
          payload: sfn.TaskInput.fromObject({
            action: "handleError",
            documentId: sfn.JsonPath.stringAt("$.documentId"),
            pageNumber: sfn.JsonPath.stringAt("$.pageNumber"),
            error: sfn.JsonPath.stringAt("$.error"),
          }),
          outputPath: "$.Payload",
        })
      );

    const processPageFlowInline = parallelProcessingInline.next(
      combinePageResultsTaskInline
    );

    const inlineMapState = new sfn.Map(this, "ProcessAllPagesInline", {
      maxConcurrency: inlineMapConcurrency,
      itemsPath: sfn.JsonPath.stringAt("$.pages"),
      resultPath: "$.processedPages",
      itemSelector: {
        pageNumber: sfn.JsonPath.stringAt("$$.Map.Item.Value.pageNumber"),
        documentId: sfn.JsonPath.stringAt("$.documentId"),
        fileType: sfn.JsonPath.stringAt("$.metadata.fileType"),
      },
    });
    inlineMapState.itemProcessor(processPageFlowInline);

    const extractTextTaskDistributed = new tasks.LambdaInvoke(
      this,
      "ExtractTextDistributed",
      {
        lambdaFunction: this.backendLambda,
        payload: sfn.TaskInput.fromObject({
          action: "extractText",
          documentId: sfn.JsonPath.stringAt("$.documentId"),
          pageNumber: sfn.JsonPath.stringAt("$.pageNumber"),
        }),
        resultPath: "$.textExtraction",
        outputPath: "$",
      }
    );

    const processWithLLMTaskDistributed = new tasks.LambdaInvoke(
      this,
      "ProcessWithLLMDistributed",
      {
        lambdaFunction: this.backendLambda,
        payload: sfn.TaskInput.fromObject({
          action: "processWithLLM",
          documentId: sfn.JsonPath.stringAt("$.documentId"),
          pageNumber: sfn.JsonPath.stringAt("$.pageNumber"),
        }),
        resultPath: "$.llmProcessing",
        outputPath: "$",
      }
    ).addRetry({
      errors: [
        "Lambda.ServiceException",
        "Lambda.AWSLambdaException",
        "Lambda.SdkClientException",
      ],
      interval: Duration.seconds(2),
      backoffRate: 2,
      maxAttempts: 5,
    });

    const combinePageResultsTaskDistributed = new tasks.LambdaInvoke(
      this,
      "CombinePageResultsDistributed",
      {
        lambdaFunction: this.backendLambda,
        payload: sfn.TaskInput.fromObject({
          action: "combinePageResults",
          documentId: sfn.JsonPath.stringAt("$.documentId"),
          pageNumber: sfn.JsonPath.stringAt("$.pageNumber"),
        }),
        outputPath: "$.Payload",
      }
    );

    const parallelProcessingDistributed = new sfn.Parallel(
      this,
      "ParallelProcessingDistributed",
      {
        resultPath: "$",
        outputPath: "$",
      }
    )
      .branch(extractTextTaskDistributed)
      .branch(processWithLLMTaskDistributed)
      .addCatch(
        new tasks.LambdaInvoke(this, "HandleParallelErrorDistributed", {
          lambdaFunction: this.backendLambda,
          payload: sfn.TaskInput.fromObject({
            action: "handleError",
            documentId: sfn.JsonPath.stringAt("$.documentId"),
            pageNumber: sfn.JsonPath.stringAt("$.pageNumber"),
            error: sfn.JsonPath.stringAt("$.error"),
          }),
          outputPath: "$.Payload",
        })
      );

    const processPageFlowDistributed = parallelProcessingDistributed.next(
      combinePageResultsTaskDistributed
    );

    const distributedMapState = new sfn.DistributedMap(
      this,
      "ProcessAllPagesDistributed",
      {
        maxConcurrency: distributedMapConcurrency,
        itemsPath: sfn.JsonPath.stringAt("$.pages"),
        resultPath: "$.processedPages",
        resultSelector: {
          "processedPages.$": "$[*]",
        },
        itemSelector: {
          pageNumber: sfn.JsonPath.stringAt("$$.Map.Item.Value.pageNumber"),
          documentId: sfn.JsonPath.stringAt("$.documentId"),
          fileType: sfn.JsonPath.stringAt("$.metadata.fileType"),
        },
        outputPath: "$",
        itemBatcher: new sfn.ItemBatcher({
          maxItemsPerBatch: 10,
          batchInput: { type: "DISTRIBUTED_MAP_BATCH" },
        }),
        resultWriter: new sfn.ResultWriter({
          bucket: props.documentBucket,
          prefix: "map-state-results",
        }),
      }
    );
    distributedMapState.itemProcessor(processPageFlowDistributed);
  }
}
