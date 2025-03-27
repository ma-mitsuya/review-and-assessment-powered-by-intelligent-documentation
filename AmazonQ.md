cdk synth
/Users/tksuzuki/projects/real-estate/aws-summit/beacon/cdk/lib/constructs/document-page-processor.ts:78
this.backendLambda = new lambda.Function(this, "BackendFunction", {
^
ValidationError: AWS_REGION environment variable is reserved by the lambda runtime and can not be set manually. See https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html
at path [BeaconStack/DocumentProcessor/BackendFunction] in aws-cdk-lib.aws_lambda.Function

    at new DocumentPageProcessor (/Users/tksuzuki/projects/real-estate/aws-summit/beacon/cdk/lib/constructs/document-page-processor.ts:78:26)
    at new BeaconStack (/Users/tksuzuki/projects/real-estate/aws-summit/beacon/cdk/lib/beacon-stack.ts:32:31)
    at Object.<anonymous> (/Users/tksuzuki/projects/real-estate/aws-summit/beacon/cdk/bin/beacon.ts:6:1)
    at Module._compile (node:internal/modules/cjs/loader:1376:14)
    at Module.m._compile (/Users/tksuzuki/projects/real-estate/aws-summit/beacon/cdk/node_modules/ts-node/src/index.ts:1618:23)
    at Module._extensions..js (node:internal/modules/cjs/loader:1435:10)
    at Object.require.extensions.<computed> [as .ts] (/Users/tksuzuki/projects/real-estate/aws-summit/beacon/cdk/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1207:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1023:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:135:12)

Subprocess exited with error 1
