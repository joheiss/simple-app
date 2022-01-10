import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { BucketEncryption } from "aws-cdk-lib/aws-s3";
import * as SimpleApp from "../lib/simple-app-stack";

// example test. To run these tests, uncomment this file along with the
// example resource in lib/simple-app-stack.ts
test("S3 bucket created ...", () => {
  const app = new cdk.App();
  const stack = new SimpleApp.SimpleAppStack(app, "MyTestStack");
  const template = Template.fromStack(stack);

  template.hasResourceProperties("AWS::S3::Bucket", {});
  template.hasOutput("TestS3Bucket1Output", {});
});
