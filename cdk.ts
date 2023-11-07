import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as deployment from "aws-cdk-lib/aws-s3-deployment";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as iam from "aws-cdk-lib/aws-iam";

const app = new cdk.App();

const stack = new cdk.Stack(app, "ShopPageCdk", {
  env: { region: "eu-north-1" },
});

const originAccessIdentity = new cloudfront.OriginAccessIdentity(
  stack,
  "ShopPage-OAI"
);

const bucket = new s3.Bucket(stack, "ShopBucket", {
  bucketName: "node-aws-shop-react-cdk",
  autoDeleteObjects: true,
  publicReadAccess: false,
  websiteIndexDocument: "index.hml",
  blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});

bucket.addToResourcePolicy(
  new iam.PolicyStatement({
    actions: ["S3:GetObject"],
    resources: [bucket.arnForObjects("*")],
    principals: [
      new iam.CanonicalUserPrincipal(
        originAccessIdentity.cloudFrontOriginAccessIdentityS3CanonicalUserId
      ),
    ],
  })
);

const cf = new cloudfront.CloudFrontWebDistribution(
  stack,
  "ShopPageDistribution",
  {
    originConfigs: [
      {
        s3OriginSource: {
          s3BucketSource: bucket,
          originAccessIdentity: originAccessIdentity,
        },
        behaviors: [
          {
            isDefaultBehavior: true,
          },
        ],
      },
    ],
  }
);

new deployment.BucketDeployment(stack, "DeployShopPage", {
  sources: [deployment.Source.asset("./dist")],
  destinationBucket: bucket,
  distribution: cf,
  distributionPaths: ["/*"],
});

new cdk.CfnOutput(stack, "S3bucket Url", {
  value: bucket.bucketWebsiteUrl,
});

new cdk.CfnOutput(stack, "Cloudfront Url", {
  value: cf.distributionDomainName,
});
