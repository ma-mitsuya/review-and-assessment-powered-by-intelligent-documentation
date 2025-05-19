#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { RapidStack } from "../lib/rapid-stack";
import { FrontendWafStack } from "../lib/frontend-waf-stack";

const app = new cdk.App();

// WAF for frontend
// 2025/4: Currently, the WAF for CloudFront needs to be created in the North America region (us-east-1), so the stacks are separated
// https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-wafv2-webacl.html
const waf = new FrontendWafStack(app, `RapidFrontendWafStack`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: "us-east-1",
  },
  envPrefix: "",
  allowedIpV4AddressRanges: ["0.0.0.0/1", "128.0.0.0/1"],
  allowedIpV6AddressRanges: [
    "0000:0000:0000:0000:0000:0000:0000:0000/1",
    "8000:0000:0000:0000:0000:0000:0000:0000/1",
  ],
});

new RapidStack(app, "RapidStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || "us-west-2",
  },
  description:
    "RAPID (Review & Assessment Powered by Intelligent Documentation)",
  crossRegionReferences: true,
  webAclId: waf.webAclArn.value,
  enableIpV6: waf.ipV6Enabled,
});
