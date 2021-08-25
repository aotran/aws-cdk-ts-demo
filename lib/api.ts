import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda-nodejs';
import { Runtime } from '@aws-cdk/aws-lambda';
import * as s3 from '@aws-cdk/aws-s3';
import * as path from 'path';
import * as iam from '@aws-cdk/aws-iam';
import * as apig from '@aws-cdk/aws-apigatewayv2';
import * as apigInt from '@aws-cdk/aws-apigatewayv2-integrations';

interface DocumentManagementAPIProps {
    documentBucket:s3.IBucket;
}

export class DocumentManagementAPI extends cdk.Construct {

    constructor(scope: cdk.Construct, id: string, props: DocumentManagementAPIProps) {
        super(scope, id);

        const getDocumentsFunction = new lambda.NodejsFunction(this, 'GetDocumentsFunction', {
            runtime: Runtime.NODEJS_12_X,
            entry: path.join(__dirname, '..', 'api', 'getDocuments.ts'),
            handler: 'getDocuments',
            bundling: {
                externalModules: [
                    'aws-sdk'
                ]
            },
            environment: {
                DOCUMENTS_BUCKET_NAME: props.documentBucket.bucketName
            }
        });

        // Give permissions to lambda function to operate on bucket
        const bucketContainerPerms = new iam.PolicyStatement();
        bucketContainerPerms.addResources(props.documentBucket.bucketArn);
        bucketContainerPerms.addActions('s3:ListBucket');
        getDocumentsFunction.addToRolePolicy(bucketContainerPerms);

        // Give permissions to lambda function to operate on objects in this bucket
        // This is an alternate way to write the permissions
        // I kept it because it gave me a useful error message when deploying with a typo
        const bucketPermissions = new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            resources: [`${props.documentBucket.bucketArn}/*`],
            actions: ['s3:GetObject', 's3:PutObject']
        });
        getDocumentsFunction.addToRolePolicy(bucketPermissions);

        const httpApi = new apig.HttpApi(this, 'HttpAPI', {
            apiName: 'document-management-api',
            createDefaultStage: true,
            corsPreflight: {
                allowMethods: [apig.CorsHttpMethod.GET],
                allowOrigins: ['*'],
                maxAge: cdk.Duration.days(10),
            }
        });

        const integration = new apigInt.LambdaProxyIntegration({
            handler: getDocumentsFunction
        });

        httpApi.addRoutes({
            path: '/getDocuments',
            methods: [
                apig.HttpMethod.GET
            ],
            integration: integration
        });

        new cdk.CfnOutput(this, 'APIEndpoint', {
            value: httpApi.url!,
            exportName: 'APIEndpoint'
        });
    }
}