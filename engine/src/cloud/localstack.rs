// LocalStack-specific utilities and helpers

pub const DEFAULT_SERVICES: &[&str] = &[
    "s3",
    "dynamodb",
    "sqs",
    "sns",
    "lambda",
    "apigateway",
    "cloudformation",
    "cloudwatch",
    "ec2",
    "ecs",
    "ecr",
    "rds",
    "secretsmanager",
    "ssm",
];

pub const DEFAULT_PORT: u16 = 4566;
pub const DEFAULT_IMAGE: &str = "localstack/localstack:latest";

pub fn get_endpoint_url() -> String {
    format!("http://localhost:{}", DEFAULT_PORT)
}

pub fn get_aws_config_snippet() -> String {
    format!(
        r#"
# AWS Configuration for LocalStack
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1
export AWS_ENDPOINT_URL={}

# Or in your code:
# aws_config = {{
#     'endpoint_url': '{}',
#     'aws_access_key_id': 'test',
#     'aws_secret_access_key': 'test',
#     'region_name': 'us-east-1'
# }}
"#,
        get_endpoint_url(),
        get_endpoint_url()
    )
}
