import {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
  Context,
} from "aws-lambda";
import { S3 } from "aws-sdk";
import { ObjectList } from "aws-sdk/clients/s3";

const s3 = new S3();
const bucketName = process.env.IMAGES_BUCKET_NAME!;

async function getPhotos(
  event: APIGatewayProxyEventV2,
  context: Context
): Promise<APIGatewayProxyStructuredResultV2> {
  try {
    const { Contents: results } = await s3
      .listObjectsV2({ Bucket: bucketName })
      .promise();
    const photos = await Promise.all(results!.map((r) => getGeneratedUrl(r)));

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: photos,
        bucketName: bucketName,
      }),
    };
  } catch (e: any) {
    return {
      statusCode: 500,
      body: e.message,
    };
  }
}

async function getGeneratedUrl(
  object: S3.Object
): Promise<{ filename: string; url: string }> {
  const url = await s3.getSignedUrlPromise("getObject", {
    Bucket: bucketName,
    Key: object.Key!,
    Expires: 24 * 60 * 60,
  });
  return {
    filename: object.Key!,
    url,
  };
}

export { getPhotos };
