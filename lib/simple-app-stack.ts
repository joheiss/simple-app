import {
  aws_cloudfront_origins,
  CfnOutput,
  Fn,
  Stack,
  StackProps,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import { Bucket, BucketEncryption, IBucket } from "aws-cdk-lib/aws-s3";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import * as path from "path";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import {
  CloudFrontWebDistribution,
  Distribution,
  OriginSslPolicy,
} from "aws-cdk-lib/aws-cloudfront";
import {
  CorsHttpMethod,
  HttpApi,
  HttpMethod,
} from "@aws-cdk/aws-apigatewayv2-alpha";
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import {
  ARecord,
  IPublicHostedZone,
  RecordTarget,
} from "aws-cdk-lib/aws-route53";
import { ICertificate } from "aws-cdk-lib/aws-certificatemanager";
import { CloudFrontTarget } from "aws-cdk-lib/aws-route53-targets";
import { S3Origin } from "aws-cdk-lib/aws-cloudfront-origins";
import { S3BucketWithDeploy } from "./s3-bucket-with-deploy";

export interface ISimpleAppStackProps extends StackProps {
  envName?: string;
  dnsName?: string;
  hostedZone?: IPublicHostedZone;
  certificate?: ICertificate;
}

export class SimpleAppStack extends Stack {
  constructor(scope: Construct, id: string, props?: ISimpleAppStackProps) {
    super(scope, id, props);

    // create S3 bucket and deploy photos there
    const photoBucket = this.build_photo_bucket(props);

    // create S3 bucket for static website and cloudfront distribution
    const websiteBucket = this.build_website(props);

    // create rest api
    const httpApi = this.build_rest_api(props, photoBucket);
  }

  private build_rest_api(
    props: ISimpleAppStackProps | undefined,
    photoBucket: IBucket
  ) {
    // create lambda function
    const lambdaFunction = new NodejsFunction(this, "TestLambdaFunction1", {
      runtime: Runtime.NODEJS_14_X,
      entry: path.join(__dirname, "..", "api", "get-photos", "index.ts"),
      handler: "getPhotos",
      environment: {
        IMAGES_BUCKET_NAME: photoBucket.bucketName,
      },
    });

    // create policy to allow lambda to access S3 and generate signed urls
    const bucketContainerPermission = new PolicyStatement({
      resources: [photoBucket.bucketArn, `${photoBucket.bucketArn}/*`],
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

    // prepare Outputs
    new CfnOutput(this, `TestApiEndpoint1Output-${props?.envName}`, {
      value: httpApi.url!,
      exportName: `TestApiEndpoint1Export-${props?.envName}`,
    });

    return httpApi;
  }

  private build_website(props: ISimpleAppStackProps | undefined): Bucket {
    // create new S3 bucket for website
    const bucket = new Bucket(this, "TestWebsiteBucket1", {
      bucketName: `com.jovisco.lab.cdktest.website.${props?.envName}`,
      websiteIndexDocument: "index.html",
      publicReadAccess: true,
    });

    // create new cloudfront distribution
    const distribution = new Distribution(this, "TestWebsiteDistribution", {
      defaultBehavior: {
        origin: new S3Origin(bucket, {}),
      },
      domainNames: [props?.dnsName!],
      certificate: props?.certificate!,
    });

    // create Route53 A record
    const aRecord = new ARecord(this, "TestARecord", {
      zone: props?.hostedZone!,
      target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
    });

    // add website files to bucket
    new BucketDeployment(this, "DeployWebsite", {
      sources: [Source.asset(path.join(__dirname, "..", "frontend", "build"))],
      destinationBucket: bucket,
      distribution,
    });

    // prepare Outputs
    new CfnOutput(this, `TestWebsiteBucketOutput-${props?.envName}`, {
      value: bucket.bucketName,
      exportName: `TestWebsiteBucketExport-${props?.envName}`,
    });

    new CfnOutput(this, `TestWebsiteDistributionOutput-${props?.envName}`, {
      value: distribution.distributionDomainName,
      exportName: `TestWebsiteDistributionExport-${props?.envName}`,
    });

    return bucket;
  }

  private build_photo_bucket(props: ISimpleAppStackProps | undefined): IBucket {
    const { bucket } = new S3BucketWithDeploy(this, "PhotoBucket", {
      bucketName: `com.jovisco.lab.cdktest1.${props?.envName}`,
      deployFrom: ["..", "assets", "images"],
      encryption:
        props?.envName === "prod"
          ? BucketEncryption.S3_MANAGED
          : BucketEncryption.UNENCRYPTED,
    });

    new CfnOutput(this, `PhotoBucketOutput-${props?.envName}`, {
      value: bucket.bucketName,
      exportName: `PhotoBucketExport-${props?.envName}`,
    });

    return bucket;
  }
}
