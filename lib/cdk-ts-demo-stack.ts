import * as cdk from '@aws-cdk/core';
import { Bucket, BucketEncryption } from '@aws-cdk/aws-s3';
import { Networking } from './networking';

export class CdkTsDemoStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create POs Bucket
    const bucket = new Bucket(this, 'PurchaseOrdersBucket', {
      encryption: BucketEncryption.S3_MANAGED
    });
    // Create PO Bucket Name export if needed for other stacks
    new cdk.CfnOutput(this, 'POsBucketNameExport', {
      value: bucket.bucketName,
      exportName: 'POsBucket'
    });
    // Create VPC from custom template
    new Networking(this, 'NetworkingConstruct', {
      maxAzs: 2
    })
  }
}
