import {
  Certificate,
  CertificateValidation,
  ICertificate,
} from "aws-cdk-lib/aws-certificatemanager";
import { IPublicHostedZone, PublicHostedZone } from "aws-cdk-lib/aws-route53";
import { CfnOutput, Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import { ISimpleAppStackProps } from "./simple-app-stack";

export class SimpleAppDnsStack extends Stack {
  public readonly hostedZone: IPublicHostedZone;
  public readonly certificate: ICertificate;

  constructor(scope: Construct, id: string, props?: ISimpleAppStackProps) {
    super(scope, id, props);
    // create Route53 public hosted zone
    this.hostedZone = new PublicHostedZone(this, "TestPublicHostedZone", {
      zoneName: props?.dnsName!,
    });
    this.certificate = new Certificate(this, "TestSSLCertificate", {
      domainName: props?.dnsName!,
      validation: CertificateValidation.fromDns(this.hostedZone),
    });

    // prepare Outputs
    new CfnOutput(this, `TestPublicHostedZoneOutput-${props?.envName}`, {
      value: this.hostedZone.hostedZoneArn,
      exportName: `TestPublicHostedZoneExport-${props?.envName}`,
    });
    new CfnOutput(this, `TestSSLCertificateOutput-${props?.envName}`, {
      value: this.certificate.certificateArn,
      exportName: `TestSSLCertificateExport-${props?.envName}`,
    });
  }
}
