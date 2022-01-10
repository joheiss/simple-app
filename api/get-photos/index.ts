import {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
  Context,
} from "aws-lambda";

const bucketName = process.env.IMAGES_BUCKET_NAME;

async function getPhotos(
  event: APIGatewayProxyEventV2,
  context: Context
): Promise<APIGatewayProxyStructuredResultV2> {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Hi Josef, you made it, so far!",
      bucketName: bucketName,
    }),
  };
}

export { getPhotos };
