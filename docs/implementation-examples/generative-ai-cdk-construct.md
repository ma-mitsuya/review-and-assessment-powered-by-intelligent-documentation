# AWS Generative AI CDK Constructs

![Stability: Experimental](https://img.shields.io/badge/stability-Experimental-important.svg?style=for-the-badge)

> All classes are under active development and subject to non-backward compatible changes or removal in any
> future version. These are not subject to the [Semantic Versioning](https://semver.org/) model.
> This means that while you may use them, you may need to update your source code when upgrading to a newer version of this package.

---

[![View on Construct Hub](https://constructs.dev/badge?package=generative-ai-cdk-constructs)](https://constructs.dev/packages/@cdklabs/generative-ai-cdk-constructs)

[![PyPI version](https://img.shields.io/pypi/v/cdklabs.generative-ai-cdk-constructs)](https://pypi.org/project/cdklabs.generative-ai-cdk-constructs/)
[![npm version](https://img.shields.io/npm/v/@cdklabs/generative-ai-cdk-constructs)](https://www.npmjs.com/package/@cdklabs/generative-ai-cdk-constructs)
[![NuGet Version](https://img.shields.io/nuget/v/Cdklabs.GenerativeAiCdkConstructs)](https://nuget.info/packages/Cdklabs.GenerativeAiCdkConstructs)
[![Maven Central Version](https://img.shields.io/maven-central/v/io.github.cdklabs/generative-ai-cdk-constructs)](https://central.sonatype.com/artifact/io.github.cdklabs/generative-ai-cdk-constructs)
[![Go Version](https://img.shields.io/github/v/tag/awslabs/generative-ai-cdk-constructs?label=go&color=orange)](https://pkg.go.dev/github.com/cdklabs/generative-ai-cdk-constructs-go/generative-ai-cdk-constructs)

## Table of contents

- [Introduction](#introduction)
- [CDK Versions](#cdk-versions)
- [Contributing](#contributing)
- [Design guidelines and Development guide](#design-guidelines-and-development-guide)
- [Getting Started](#getting-started)
- [Catalog](#catalog)
- [Sample Use Cases](#sample-use-cases)
- [Additional Resources](#additional-resources)
- [Contributors](#contributors)
- [Operational Metrics Collection](#operational-metrics-collection)
- [Roadmap](#roadmap)
- [Deprecation](#deprecation)
- [License](#license)
- [Legal Disclaimer](#legal-disclaimer)

## Introduction

The AWS Generative AI Constructs Library is an open-source extension of the [AWS Cloud Development Kit (AWS CDK)](https://docs.aws.amazon.com/cdk/v2/guide/home.html) that provides multi-service, well-architected patterns for quickly defining solutions in code to create predictable and repeatable infrastructure, called [constructs](https://docs.aws.amazon.com/cdk/v2/guide/constructs.html). The goal of AWS Generative AI CDK Constructs is to help developers build generative AI solutions using pattern-based definitions for their architecture.

The patterns defined in AWS Generative AI CDK Constructs are high level, multi-service abstractions of AWS CDK constructs that have default configurations based on well-architected best practices. The library is organized into logical modules using object-oriented techniques to create each architectural pattern model.

## CDK Versions

AWS Generative AI CDK Constructs and the AWS CDK are independent teams and have different release schedules. Each release of AWS Generative AI CDK Constructs is built against a specific version of the AWS CDK. The [CHANGELOG.md](./CHANGELOG.md) file lists the CDK version associated with each AWS Generative AI Constructs release. For instance, AWS Generative AI CDK Constructs v0.0.0 was built against AWS CDK v2.96.2. This means that to use AWS Generative AI CDK Constructs v0.0.0, your application must include AWS CDK v2.96.2 or later. You can continue to use the latest AWS CDK versions and upgrade the your AWS Generative AI CDK Constructs version when new releases become available.

## Contributing

Contributions of all kinds are welcome! Check out our [contributor guide](./CONTRIBUTING.md)

## Design guidelines and Development guide

If you want to add a new construct to the library, check out our [design guidelines](./DESIGN_GUIDELINES.md), then follow the [development guide](./DEVELOPER_GUIDE.md)

## Getting Started

<details>
<summary><i>TypeScript</i></summary>

- Create or use an existing CDK application in TypeScript.
  - `cdk init app --language typescript`
- Run `npm install @cdklabs/generative-ai-cdk-constructs`
- The package should be added to your package.json.
- Import the library:
  - `import * as genai from '@cdklabs/generative-ai-cdk-constructs';`

</details>

<details>
<summary><i>Python</i></summary>

- Create or use an existing CDK application in Python
  - `cdk init app --language python`
- Install the package:
  - `pip install cdklabs.generative-ai-cdk-constructs`
- Import the library:
  - `import cdklabs.generative_ai_cdk_constructs`

</details>

<details>
<summary><i>NuGet</i></summary>

- Create or use an existing CDK application in Python
  - `cdk init app --language csharp`
- Install the package while in the Visual Studio project:
  - `dotnet add package CdkLabs.GenerativeAICdkConstructs`
- Use the namespace:
  - `using Cdklabs.GenerativeAiCdkConstructs;`

</details>

<details>
<summary><i>Go</i></summary>

- Create or use an existing CDK application in Python
  - `cdk init app --language go`
- Get the module:
  - `go get github.com/cdklabs/generative-ai-cdk-constructs-go/generative-ai-cdk-constructs`
- Import the library:
  - `import "github.com/cdklabs/generative-ai-cdk-constructs-go/generative-ai-cdk-constructs"`

_NOTE: The [Go distribution repository](https://github.com/cdklabs/generative-ai-cdk-constructs-go), distributes the JSII tar gzipped versioned source from the [source repository](https://github.awslabs/generative-ai-cdk-constructs)_

</details>

<details>
<summary><i>Java</i></summary>

- Create or use an existing CDK application in Java
  - `cdk init app --language java`
- Add the dependency into the `pom.xml`

```
<dependency>
    <groupId>io.github.cdklabs</groupId>
    <artifactId>generative-ai-cdk-constructs</artifactId>
    <version>Get the latest version and insert it here</version>
</dependency>
```

</details>

Refer to the documentation for additional guidance on a particular construct: [Catalog](#catalog)

## Catalog

The following constructs are available in the library:

### L3 constructs

| **Construct**                                                                                                                   | Description                                                                                                                                                              | AWS Services used                                                        |
| :------------------------------------------------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------- |
| [SageMaker model deployment (JumpStart)](./src/patterns/gen-ai/aws-model-deployment-sagemaker/README_jumpstart.md)              | Deploy a foundation model from Amazon SageMaker JumpStart to an Amazon SageMaker endpoint.                                                                               | Amazon SageMaker                                                         |
| [SageMaker model deployment (Hugging Face)](./src/patterns/gen-ai/aws-model-deployment-sagemaker/README_hugging_face.md)        | Deploy a foundation model from Hugging Face to an Amazon SageMaker endpoint.                                                                                             | Amazon SageMaker                                                         |
| [SageMaker model deployment (Custom)](./src/patterns/gen-ai/aws-model-deployment-sagemaker/README_custom_sagemaker_endpoint.md) | Deploy a foundation model from an S3 location to an Amazon SageMaker endpoint.                                                                                           | Amazon SageMaker                                                         |
| [Amazon Bedrock Monitoring (Amazon CloudWatch Dashboard)](./src/patterns/gen-ai/aws-bedrock-cw-dashboard/README.md)             | Amazon CloudWatch dashboard to monitor model usage from Amazon Bedrock.                                                                                                  | Amazon CloudWatch                                                        |
| [Bedrock Data Automation](./src/patterns/gen-ai/aws-bedrock-data-automation/README.md)                                          | Use Amazon bedrock data automation client to to build and manage intelligent document processing, media analysis, and other multimodal data-centric automation solutions | AWS Lambda, Amazon S3 bucket                                             |
| [Bedrock Batch Step Functions](./src/patterns/gen-ai/aws-bedrock-batch-stepfn/README.md)                                        | Manage Bedrock model invocation jobs(batch inference) in AWS Step Functions state machines                                                                               | AWS Step Functions, AWS Lambda, AWS EventBridge, Amazon Bedrock, AWS IAM |

### L2 Constructs

| **Construct**                                                                                  | Description                                      | AWS Services used                                        |
| :--------------------------------------------------------------------------------------------- | :----------------------------------------------- | :------------------------------------------------------- |
| [Amazon Bedrock](./src/cdk-lib/bedrock/README.md)                                              | CDK L2 Constructs for Amazon Bedrock.            | Amazon Bedrock, Amazon OpenSearch Serverless, AWS Lambda |
| [Amazon OpenSearch Serverless Vector Collection](./src/cdk-lib/opensearchserverless/README.md) | CDK L2 Constructs to create a vector collection. | Amazon OpenSearch Vector Index                           |
| [Amazon OpenSearch Vector Index](./src/cdk-lib/opensearch-vectorindex/README.md)               | CDK L1 Custom Resource to create a vector index. | Amazon OpenSearch Serverless, AWS Lambda                 |

## Sample Use Cases

The official [samples repository](https://github.com/aws-samples/generative-ai-cdk-constructs-samples) includes a collection of functional use case implementations to demonstrate the usage of AWS Generative AI CDK Constructs. These can be used in the same way as architectural patterns, and can be conceptualized as an additional "higher-level" abstraction of those patterns. Those patterns (constructs) are composed together into [stacks](https://docs.aws.amazon.com/cdk/latest/guide/stacks.html), forming a "CDK app".

## Additional Resources

| Resource                                                                                                                                                                                                                                  | Type                    | Description                                                                                                                                                                                                                                              |
| :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [AWS re:Invent 2023 - Keynote with Dr. Werner Vogels](https://youtu.be/UTRBVPvzt9w?t=6252)                                                                                                                                                | Keynote                 | Dr. Werner Vogels, Amazon.com's VP and CTO, announces the AWS Generative AI CDK Constructs during his AWS re:Invent 2023 keynote.                                                                                                                        |
| [Workshop - Building Generative AI Apps on AWS with CDK](https://catalog.workshops.aws/building-genai-apps)                                                                                                                               | Workshop                | In this workshop, you will explore how to build a sample generative AI app on AWS using CDK and Generative AI CDK Constructs.                                                                                                                            |
| [Workshop - Hands on AWS CDK Generative AI Constructs](https://catalog.us-east-1.prod.workshops.aws/workshops/84c00416-19b6-44c3-8d18-cc172361af41/en-US)                                                                                 | Workshop                | In this workshop you will deploy projects that use CDK constructs from this library. Projects are from the [amazon-bedrock-samples](https://github.com/aws-samples/amazon-bedrock-samples/tree/main) Github Repository.                                  |
| [Build generative AI applications with Amazon Titan Text Premier, Amazon Bedrock, and AWS CDK](https://aws.amazon.com/blogs/machine-learning/build-generative-ai-applications-with-amazon-titan-text-premier-amazon-bedrock-and-aws-cdk/) | Blog post + Code sample | Blog post exploring building and deploying two sample applications powered by Amazon Titan Text Premier using the Generative AI CDK constructs.                                                                                                          |
| [aws-cdk-stack-builder-tool](https://github.com/aws-samples/aws-cdk-stack-builder-tool)                                                                                                                                                   | Code sample             | AWS CDK Builder is a browser-based tool designed to streamline bootstrapping of Infrastructure as Code (IaC) projects using the AWS Cloud Development Kit (CDK).                                                                                         |
| [CDK Live! Building generative AI applications and architectures leveraging AWS CDK Constructs!](https://www.youtube.com/watch?v=NI1F4Xxqyr8)                                                                                             | Video                   | CDK Live! episode focused on building and deploying generative AI applications and architectures on AWS using the AWS Cloud Development Kit (CDK) and the AWS Generative AI CDK Constructs.                                                              |
| [Announcing AWS Generative AI CDK Constructs!](https://aws.amazon.com/blogs/devops/announcing-generative-ai-cdk-constructs/)                                                                                                              | Blog post               | Blog post announcing the release of the AWS Generative AI CDK Constructs.                                                                                                                                                                                |
| [Streamline insurance underwriting with generative AI using Amazon Bedrock](https://aws.amazon.com/blogs/machine-learning/streamline-insurance-underwriting-with-generative-ai-using-amazon-bedrock-part-1/)                              | Blog post + Code sample | Blog post and code sample discussing how to use AWS generative artificial intelligence (AI) solutions like Amazon Bedrock to improve the underwriting process, including rule validation, underwriting guidelines adherence, and decision justification. |
| [aws-genai-llm-chatbot](https://github.com/aws-samples/aws-genai-llm-chatbot/tree/main)                                                                                                                                                   | Code sample             | Multi-Model and Multi-RAG Powered Chatbot Using AWS CDK on AWS allowing you to experiment with a variety of Large Language Models and Multimodal Language Models, settings and prompts in your own AWS account.                                          |
| [bedrock-claude-chat](https://github.com/aws-samples/bedrock-claude-chat)                                                                                                                                                                 | Code sample             | AWS-native chatbot using Bedrock + Claude (+Mistral).                                                                                                                                                                                                    |
| [amazon-bedrock-rag](https://github.com/aws-samples/amazon-bedrock-rag)                                                                                                                                                                   | Code sample             | Fully managed RAG solution using Knowledge Bases for Amazon Bedrock.                                                                                                                                                                                     |
| [Amazon Bedrock Multimodal Search](https://github.com/aws-samples/amazon-bedrock-titan-multimodal-search)                                                                                                                                 | Code sample             | Multimodal product search app built using Amazon Titan Multimodal Embeddings model.                                                                                                                                                                      |
| [Amazon Bedrock Knowledge Bases with Private Data](https://blog.serverlessadvocate.com/amazon-bedrock-knowledge-bases-with-private-data-7685d04ef396)                                                                                     | Blog post + Code sample | Blog post and associated code sample demonstrating how to integrate Knowledge Bases into Amazon Bedrock to provide foundational models with contextual data from private data sources.                                                                   |
| [Automating tasks using Amazon Bedrock Agents and AI](https://blog.serverlessadvocate.com/automating-tasks-using-amazon-bedrock-agents-and-ai-4b6fb8856589)                                                                               | Blog post + Code sample | Blog post and associated code sample demonstrating how to deploy an Amazon Bedrock Agent and a Knowledge Base through a hotel and spa use case.                                                                                                          |
| [Agents for Amazon Bedrock - Powertools for AWS Lambda (Python)](https://docs.powertools.aws.dev/lambda/python/latest/core/event_handler/bedrock_agents/#using-aws-cloud-developer-kit-cdk)                                               | Code sample             | Create Agents for Amazon Bedrock using event handlers and auto generation of OpenAPI schemas.                                                                                                                                                            |
| [Text to SQL Bedrock Agent](https://github.com/aws-samples/amazon-bedrock-samples/tree/main/agents-for-bedrock/use-case-examples/text-2-sql-agent-cdk-enhanced)                                                                           | Code sample             | Harnessing the power of natural language processing, the "Text to SQL Bedrock Agent" facilitates the automatic transformation of natural language questions into executable SQL queries.                                                                 |
| [Dynamic Text-to-SQL for Enterprise Workloads with Amazon Bedrock Agent](https://github.com/aws-samples/sample-Dynamic-Text-to-SQL-with-Amazon-Bedrock-Agent)                                                                             | Code sample             | Elevate your data analysis with an end-to-end agentic Text-to-SQL solution, built on AWS for enterprise-scale adaptability and resilience. Ideal for complex scenarios like fraud detection in financial services.                                       |

## Contributors

[![contributors](https://contrib.rocks/image?repo=awslabs/generative-ai-cdk-constructs&max=2000)](https://github.com/awslabs/generative-ai-cdk-constructs/graphs/contributors)

## Operational Metrics Collection

Generative AI CDK Constructs may collect anonymous operational metrics, including: the region a construct is deployed, the name and version of the construct deployed, and related information. We may use the metrics to maintain, provide, develop, and improve the constructs and AWS services.

## Roadmap

Roadmap is available through the [GitHub Project](https://github.com/orgs/awslabs/projects/136)

## Deprecation

To understand our deprecation process, please refer to the dedicated [documentation](./DEPRECATION_PROCESS.md)

## License

Apache-2.0

## Legal Disclaimer

You should consider doing your own independent assessment before using the content in this library for production purposes. This may include (amongst other things) testing, securing, and optimizing the CDK constructs and other content, provided in this library, based on your specific quality control practices and standards.

---

&copy; Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

---

# BedrockBatchSfn

<!--BEGIN STABILITY BANNER-->

---

![Stability: Experimental](https://img.shields.io/badge/stability-Experimental-important.svg?style=for-the-badge)

> All classes are under active development and subject to non-backward compatible changes or removal in any
> future version. These are not subject to the [Semantic Versioning](https://semver.org/) model.
> This means that while you may use them, you may need to update your source code when upgrading to a newer version of
> this package.

---

<!--END STABILITY BANNER-->

| **Language**                                                                                   | **Package**                             |
| :--------------------------------------------------------------------------------------------- | --------------------------------------- |
| ![Typescript Logo](https://docs.aws.amazon.com/cdk/api/latest/img/typescript32.png) TypeScript | `@cdklabs/generative-ai-cdk-constructs` |
| ![Python Logo](https://docs.aws.amazon.com/cdk/api/latest/img/python32.png) Python             | `cdklabs.generative_ai_cdk_constructs`  |

## Table of contents

- [Overview](#overview)
- [Usage](#usage)
- [Architecture](#architecture)
- [Cost](#cost)
- [Security](#security)
- [Supported AWS Regions](#supported-aws-regions)
- [Quotas](#quotas)
- [Clean up](#clean-up)

## Overview

The BedrockBatchSFN CDK construct simplifies the implementation of batch inference workflows with Amazon Bedrock by
providing a pattern for processing large volumes of data asynchronously. It helps developers
efficiently orchestrate batch processing tasks using Step Functions and Lambda, automatically handling job creation,
status monitoring, and result collection. The construct is particularly valuable for cost-sensitive workloads like bulk
text analysis, embeddings generation, and document summarization, taking advantage of Bedrock's 50% pricing discount for
batch operations. By abstracting away the complexity of managing asynchronous model invocations and state management,
developers can focus on their application logic while the construct handles the infrastructure and workflow
orchestration needed for reliable batch processing at scale.

## Usage

This construct implements
an [AWS Step Functions StateMachineFragment](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_stepfunctions-readme.html#state-machine-fragments)
which can be used in your state machines to manage Bedrock batch inference jobs.

It requires Amazon Simple Storage Service(S3) buckets for input and output manifests and an AWS Identity and Access
Management(IAM) managed policy that allows inference. You can use a single bucket for both input and output. The policy
must have the following permissions for the models and inference profiles you plan to use:

- bedrock:InvokeModel
- bedrock:CreateModelInvocationJob

Here is a minimal deployable pattern definition:

```typescript
import { BedrockBatchSfn } from "@cdklabs/generative-ai-cdk-constructs";
import {
  aws_iam as iam,
  aws_s3 as s3,
  aws_stepfunctions as sfn,
  Duration,
} from "aws-cdk-lib";

const batchBucket = new s3.Bucket(stack, "BedrockBatchBucket");

const batchPolicy = new iam.ManagedPolicy(stack, "BatchPolicy", {});

batchPolicy.addStatements(
  new iam.PolicyStatement({
    sid: "Inference",
    actions: ["bedrock:InvokeModel", "bedrock:CreateModelInvocationJob"],
    resources: [`arn:aws:bedrock:${stack.region}::foundation-model/*`],
  })
);

const bedrockBatchSfnFragment = new BedrockBatchSfn(
  stack,
  "AwsBedrockBatchSfn",
  {
    bedrockBatchInputBucket: batchBucket,
    bedrockBatchOutputBucket: batchBucket,
    bedrockBatchPolicy: batchPolicy,
    timeout: Duration.hours(48),
  }
);

const inputState = new sfn.Pass(stack, "InputState", {
  parameters: {
    job_name: "test_job",
    manifest_keys: ["test_key.jsonl"],
    model_id: "test.model-v1",
  },
});

const outputState = new sfn.Pass(stack, "OutputState");

const failState = new sfn.Fail(stack, "FailState", {
  causePath: sfn.JsonPath.stringAt("$.cause"),
  errorPath: sfn.JsonPath.stringAt("$.error"),
});

const chain = inputState.next(bedrockBatchSfnFragment).next(outputState);

bedrockBatchSfnFragment.endStates.map((endState) => {
  if (endState instanceof sfn.TaskStateBase) {
    endState.addCatch(failState);
  }
});

const stateMachine = new sfn.StateMachine(stack, "StateMachine", {
  definitionBody: sfn.DefinitionBody.fromChainable(chain),
});
```

See the [API documentation](../../../../apidocs/classes/BedrockBatchSfn.md).

## Architecture

![Architecture Diagram](architecture.png)

## Cost

Please note that you will be responsible for the costs associated with the AWS services used during the execution of
this construct. The cost of using this construct varies heavily according to model selection and the size of model
inference jobs. As a reference point, we will assume a workload that uses Amazon Nova Pro with 10,000 input tokens
and 1,000 output tokens per invocation, 100 records per invocation job and 300 invocation jobs per month.

We recommend creating a budget through [AWS Cost Explorer](http://aws.amazon.com/aws-cost-management/aws-cost-explorer/)
to help manage costs. Prices are subject to change. For full details, refer to the pricing webpage for each AWS service
used in this solution.

The following table provides a sample cost breakdown for deploying this solution with the default parameters in the **US
East (N. Virginia)** Region for **one month**.

| **AWS Service**               | **Dimensions**                                                                                                                                    | **Cost [USD]** |
| :---------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------ | -------------- |
| Amazon Bedrock                | Amazon Nova Pro with 10,000 input tokens and 1,000 output tokens per invocation, 100 records per invocation job and 300 invocation jobs per month | $168.00        |
| AWS Lambda                    | 6000 invocation requests, 128 MB, arm64 arch, 1 sec duration of each request                                                                      | $0.01          |
| AWS Step Functions            | 300 workflow requests with 1 state transition each                                                                                                | $0.00          |
| Amazon Simple Storage Service | Temporary Storage of Bedrock input and output manifests - 900 PUT requests, 600 GET requests, 1 GB data storage                                   | $0.03          |
| AWS CloudWatch                | < 1 GB logs ingested                                                                                                                              | $0.50          |
| **Total**                     |                                                                                                                                                   | **$168.54**    |

For comparison, with on-demand inference, the Amazon Bedrock usage would cost $336.00.

## Security

When you build systems on AWS infrastructure, security responsibilities are shared between you and AWS.
This [shared responsibility](http://aws.amazon.com/compliance/shared-responsibility-model/) model reduces your
operational burden because AWS operates, manages, and controls the components including the host operating system,
virtualization layer, and physical security of the facilities in which the services operate. For more information about
AWS security, visit [AWS Cloud Security](http://aws.amazon.com/security/).

## Supported AWS Regions

This solution uses the Amazon Bedrock service, which is not currently available in all AWS Regions. You must
launch this construct in an AWS Region where these services are available. For the most current availability of AWS
services by Region, see
the [AWS Regional Services List](https://aws.amazon.com/about-aws/global-infrastructure/regional-product-services/).

> **Note**
> You need to explicity enable access to models before they are available for use in the Amazon Bedrock service. Please
> follow the [Amazon Bedrock User Guide](https://docs.aws.amazon.com/bedrock/latest/userguide/model-access.html) for
> steps
> related to enabling model access.

## Quotas

Service quotas, also referred to as limits, are the maximum number of service resources or operations for your AWS
account.

Make sure you have sufficient quota for each of the services implemented in this solution. For more information, refer
to [AWS service quotas](https://docs.aws.amazon.com/general/latest/gr/aws_service_limits.html).

To view the service quotas for all AWS services in the documentation without switching pages, view the information in
the [Service endpoints and quotas](https://docs.aws.amazon.com/general/latest/gr/aws-general.pdf#aws-service-information)
page in the PDF instead.

## Clean up

When deleting your stack which uses this construct, do not forget to go over the following instructions to avoid
unexpected charges:

- delete all the associated logs created by the different services in Amazon CloudWatch logs

---

&copy; Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

---

Example of analyzer:

```ts
if (props.existKnowledgeBaseId == undefined) {
      const vectorCollection = new VectorCollection(this, "KBVectors", {
        collectionName: `kb-${props.botId.slice(0, 20).toLowerCase()}`,
        standbyReplicas:
          props.useStandbyReplicas === true
            ? VectorCollectionStandbyReplicas.ENABLED
            : VectorCollectionStandbyReplicas.DISABLED,
      });
      const vectorIndex = new VectorIndex(this, "KBIndex", {
        collection: vectorCollection,
        // DO NOT CHANGE THIS VALUE
        indexName: "bedrock-knowledge-base-default-index",
        // DO NOT CHANGE THIS VALUE
        vectorField: "bedrock-knowledge-base-default-vector",
        vectorDimensions: props.embeddingsModel.vectorDimensions!,
        mappings: [
          {
            mappingField: "AMAZON_BEDROCK_TEXT_CHUNK",
            dataType: "text",
            filterable: true,
          },
          {
            mappingField: "AMAZON_BEDROCK_METADATA",
            dataType: "text",
            filterable: false,
          },
        ],
        analyzer: props.analyzer,
      });

      kb = new KnowledgeBase(this, "KB", {
        embeddingsModel: props.embeddingsModel,
        vectorStore: vectorCollection,
        vectorIndex: vectorIndex,
        instruction: props.instruction,
      });
```

---

generative-ai-cdk-constructs
@cdklabs/generative-ai-cdk-constructs

@cdklabs/generative-ai-cdk-constructs / opensearch_vectorindex / Analyzer

Interface: Analyzer
Properties for the Analyzer.

Properties
characterFilters
readonly characterFilters: ICU_NORMALIZER[]

The analyzers to use.

tokenFilters
readonly tokenFilters: TokenFilterType[]

The token filters to use.

tokenizer
readonly tokenizer: TokenizerType

The tokenizer to use.

This site is open source. Improve this page.

generative-ai-cdk-constructs
@cdklabs/generative-ai-cdk-constructs

@cdklabs/generative-ai-cdk-constructs / opensearchserverless / CharacterFilterType

Enumeration: CharacterFilterType
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the “License”). You may not use this file except in compliance with the License. A copy of the License is located at

http://www.apache.org/licenses/LICENSE-2.0
or in the ‘license’ file accompanying this file. This file is distributed on an ‘AS IS’ BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions and limitations under the License.

Enumeration Members
ICU_NORMALIZER
ICU_NORMALIZER: "icu_normalizer"

This site is open source. Improve this page.

generative-ai-cdk-constructs
@cdklabs/generative-ai-cdk-constructs

@cdklabs/generative-ai-cdk-constructs / opensearchserverless / TokenFilterType

Enumeration: TokenFilterType
Enumeration Members
CJK_WIDTH
CJK_WIDTH: "cjk_width"

ICU_FOLDING
ICU_FOLDING: "icu_folding"

JA_STOP
JA_STOP: "ja_stop"

KUROMOJI_BASEFORM
KUROMOJI_BASEFORM: "kuromoji_baseform"

KUROMOJI_PART_OF_SPEECH
KUROMOJI_PART_OF_SPEECH: "kuromoji_part_of_speech"

KUROMOJI_STEMMER
KUROMOJI_STEMMER: "kuromoji_stemmer"

LOWERCASE
LOWERCASE: "lowercase"

This site is open source. Improve this page.

generative-ai-cdk-constructs
@cdklabs/generative-ai-cdk-constructs

@cdklabs/generative-ai-cdk-constructs / opensearchserverless / TokenizerType

Enumeration: TokenizerType
Enumeration Members
ICU_TOKENIZER
ICU_TOKENIZER: "icu_tokenizer"

KUROMOJI_TOKENIZER
KUROMOJI_TOKENIZER: "kuromoji_tokenizer"

This site is open source. Improve this page.
