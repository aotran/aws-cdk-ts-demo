import * as cdk from '@aws-cdk/core';
import { Bucket, BucketEncryption } from '@aws-cdk/aws-s3';
import { Networking } from './networking';
import { DocumentManagementAPI } from './api';
import * as s3Deploy from '@aws-cdk/aws-s3-deployment';
import * as path from 'path';

export class CdkTsDemoStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create POs Bucket
    const bucket = new Bucket(this, 'PurchaseOrdersBucket', {
      encryption: BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    });
    // Deployment documents
    new s3Deploy.BucketDeployment(this, 'DocumentsDeployment', {
      sources: [
        s3Deploy.Source.asset(path.join(__dirname, '..', 'documents'))
      ],
      destinationBucket: bucket,
    });
    // Create PO Bucket Name export if needed for other stacks
    new cdk.CfnOutput(this, 'POsBucketNameExport', {
      value: bucket.bucketName,
      exportName: 'POsBucket'
    });
    // Create VPC from custom template
    // new Networking(this, 'NetworkingConstruct', {
    //   maxAzs: 2
    // })
    // Create link to lambda
    const api = new DocumentManagementAPI(this, 'DocumentManagementAPI', {
      documentBucket: bucket
    });
  }
}
