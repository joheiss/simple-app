import { Bucket, BucketEncryption, IBucket } from "aws-cdk-lib/aws-s3";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { Construct } from "constructs";
import * as path from "path";

interface IS3BucketWithDeployProps {
  bucketName?: string;
  deployFrom: string[];
  encryption?: BucketEncryption;
}

export class S3BucketWithDeploy extends Construct {
  public readonly bucket: IBucket;

  constructor(scope: Construct, id: string, props: IS3BucketWithDeployProps) {
    super(scope, id);
    // create new S3 bucket for photos
    this.bucket = new Bucket(this, "PhotoBucket", {
      bucketName: props.bucketName,
      encryption: props.encryption || BucketEncryption.UNENCRYPTED,
    });

    // add files to S3 bucket
    new BucketDeployment(this, "DeployPhotos", {
      sources: [Source.asset(path.join(__dirname, ...props.deployFrom))],
      destinationBucket: this.bucket,
    });
  }
}
