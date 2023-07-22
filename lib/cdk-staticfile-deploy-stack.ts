import * as cdk from 'aws-cdk-lib';
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3_deployment from "aws-cdk-lib/aws-s3-deployment";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as cloudfront_origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as iam from "aws-cdk-lib/aws-iam";
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';
import { Construct } from 'constructs';


export class CdkStaticfileDeployStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /**
     *  S3
    */ 
    const bucket = new s3.Bucket(this, 'S3Bucket', {
      bucketName: 'cdk-staticfile-deploy-202307',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    /**
     * Cloud Front
     */
    // OAC
    const cfnOriginAccessControl = new cloudfront.CfnOriginAccessControl(this, 'OriginAccessControl', {
      originAccessControlConfig: {
          name: 'OriginAccessControlForContentsBucket',
          originAccessControlOriginType: 's3',
          signingBehavior: 'always',
          signingProtocol: 'sigv4',
          description: 'Access Control',
      },
    }); 
    
    // Cloudfront(distribution)
    const origin = new cloudfront_origins.S3Origin(bucket);
    const distribution = new cloudfront.Distribution(this, 'DistributionId', {
      defaultRootObject: 'index.html',
      defaultBehavior: {
          origin: origin,
      },
    });

    // Policy 
    const bucketPolicyStatement = new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      effect: iam.Effect.ALLOW,
      principals: [
          new iam.ServicePrincipal('cloudfront.amazonaws.com')
      ],
      resources: [`${bucket.bucketArn}/*`]
    });
    bucketPolicyStatement.addCondition('StringEquals', {
      'AWS:SourceArn': `arn:aws:cloudfront::${cdk.Stack.of(this).account}:distribution/${distribution.distributionId}`
    });
    bucket.addToResourcePolicy(bucketPolicyStatement);
  
    const cfnDistribution = distribution.node.defaultChild as cloudfront.CfnDistribution;
    cfnDistribution.addPropertyOverride('DistributionConfig.Origins.0.OriginAccessControlId', cfnOriginAccessControl.getAtt('Id'));
    cfnDistribution.addPropertyOverride('DistributionConfig.Origins.0.DomainName', bucket.bucketRegionalDomainName);
    cfnDistribution.addOverride('Properties.DistributionConfig.Origins.0.S3OriginConfig.OriginAccessIdentity', "");
    cfnDistribution.addPropertyDeletionOverride('DistributionConfig.Origins.0.CustomOriginConfig');
    
    /**
     *  S3へのファイルをデプロイ(アップロード) 
     */ 
    new s3_deployment.BucketDeployment(this, 'S3Deployment', {
      sources: [s3_deployment.Source.asset('./static_files/')],
      destinationBucket: bucket,
      distribution,
      distributionPaths: ['/*']
    });
  }
}
