import { CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { Bucket, BucketEncryption } from "aws-cdk-lib/aws-s3";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import * as path from "path";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { CloudFrontWebDistribution } from "aws-cdk-lib/aws-cloudfront";
import {
  CorsHttpMethod,
  HttpApi,
  HttpMethod,
} from "@aws-cdk/aws-apigatewayv2-alpha";
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

interface SimpleAppStackProps extends StackProps {
  envName?: string;
}
export class SimpleAppStack extends Stack {
  constructor(scope: Construct, id: string, props?: SimpleAppStackProps) {
    super(scope, id, props);

    // create new S3 bucket for photos
    const bucketName = `com.jovisco.lab.cdktest1.${props?.envName}`;
    const bucket = new Bucket(this, "TestS3Bucket1", {
      bucketName: `com.jovisco.lab.cdktest1.${props?.envName}`,
      encryption:
        props?.envName === "prod"
          ? BucketEncryption.S3_MANAGED
          : BucketEncryption.UNENCRYPTED,
    });

    // add files to S3 bucket
    new BucketDeployment(this, "DeployPhotos", {
      sources: [Source.asset(path.join(__dirname, "..", "assets", "images"))],
      destinationBucket: bucket,
    });

    // create new S3 bucket for website
    const websiteBucket = new Bucket(this, "TestWebsiteBucket1", {
      bucketName: `com.jovisco.lab.cdktest.website.${props?.envName}`,
      websiteIndexDocument: "index.html",
      publicReadAccess: true,
    });

    // create new cloudfront distribution
    const cloudfrontDist = new CloudFrontWebDistribution(
      this,
      "TestWebsiteDistribution",
      {
        originConfigs: [
          {
            s3OriginSource: {
              s3BucketSource: websiteBucket,
            },
            behaviors: [{ isDefaultBehavior: true }],
          },
        ],
      }
    );

    // add website files to bucket
    new BucketDeployment(this, "DeployWebsite", {
      sources: [Source.asset(path.join(__dirname, "..", "frontend", "build"))],
      destinationBucket: websiteBucket,
      distribution: cloudfrontDist,
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

    // create policy to allow lambda to access S3 and generate signed urls
    const bucketContainerPermission = new PolicyStatement({
      resources: [bucket.bucketArn, `${bucket.bucketArn}/*`],
      actions: ["s3:ListBucket", "s3:GetObject", "s3:PutObject"],
    });

    // add role to Lambda function
    lambdaFunction.addToRolePolicy(bucketContainerPermission);

    // create API Gateway
    const httpApi = new HttpApi(this, "TestHttpApi", {
      corsPreflight: {
        allowOrigins: ["*"],
        allowMethods: [CorsHttpMethod.GET],
      },
      apiName: "photo-api",
      createDefaultStage: true,
    });

    // create Lambda Proxy Integration
    const lambdaIntegration = new HttpLambdaIntegration(
      "TestHttpLambdaIntegration",
      lambdaFunction
    );

    // add routes to API Gateway
    httpApi.addRoutes({
      path: "/getAllPhotos",
      methods: [HttpMethod.GET],
      integration: lambdaIntegration,
    });

    // configure CFN output
    new CfnOutput(this, `TestS3Bucket1Output-${props?.envName}`, {
      value: bucket.bucketName,
      exportName: `TestS3Bucket1Export-${props?.envName}`,
    });

    new CfnOutput(this, `TestWebsiteBucket1Output-${props?.envName}`, {
      value: websiteBucket.bucketName,
      exportName: `TestWebsiteBucket1Export-${props?.envName}`,
    });

    new CfnOutput(this, `TestWebsiteDist1Output-${props?.envName}`, {
      value: cloudfrontDist.distributionDomainName,
      exportName: `TestWebsiteDist1Export-${props?.envName}`,
    });

    new CfnOutput(this, `TestApiEndpoint1Output-${props?.envName}`, {
      value: httpApi.url!,
      exportName: `TestApiEndpoint1Export-${props?.envName}`,
    });
  }
}
