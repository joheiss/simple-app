
# create project within folder simple-app
cdk init app --language=typescript

# create IAM policies, IAM roles, SSM parameter, ECR repository, S3 bucket in AWS Cloudformation
cdk bootstrap

# list all Cloudformation stacks
cdk list

# deploy current stack
cdk deploy

# deploy all stacks - if there are more
cdk deploy "*"

# display cloudformation differences
cdk diff

# delete cloudformation stack
cdk destroy

# delete all stacks - if there are more
cdk destroy "*"
