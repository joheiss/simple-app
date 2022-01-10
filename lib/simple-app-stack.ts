import { CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { Bucket, BucketEncryption } from "aws-cdk-lib/aws-s3";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import * as path from "path";

// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class SimpleAppStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // create new S3 bucket
    const timestamp = new Date().getTime().toString();
    const bucketName = `com.jovisco.lab.cdktest1`;
    const bucket = new Bucket(this, "TestS3Bucket1", {
      bucketName: `com.jovisco.lab.cdktest1`,
      encryption: BucketEncryption.UNENCRYPTED,
    });

    // add files to S3 bucket
    new BucketDeployment(this, "DeployPhotos", {
      sources: [Source.asset(path.join(__dirname, "..", "assets", "images"))],
      destinationBucket: bucket,
      // destinationKeyPrefix: 'web/static' // optional prefix in destination bucket
    });

    // create lambda function
    const lambdaFunction = new NodejsFunction(this, "TestLambdaFunction1", {
      runtime: Runtime.NODEJS_14_X,
      entry: path.join(__dirname, "..", "api", "get-photos", "index.ts"),
      handler: "getPhotos",
      environment: {
        IMAGES_BUCKET_NAME: bucket.bucketName,
      },
    });

    // configure CFN output
    new CfnOutput(this, "TestS3Bucket1Output", {
      value: bucket.bucketName,
      exportName: "TestS3Bucket1Export",
    });

  }
}
