# Lambda execution role
resource "aws_iam_role" "lambda_role" {
  name = "${var.app_name}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# Attach basic Lambda execution policy
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.lambda_role.name
}

# Archive the build output
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../build"
  output_path = "${path.module}/.lambda_build.zip"
  excludes    = ["node_modules/.cache"]
}

# Lambda function
resource "aws_lambda_function" "app" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = var.app_name
  role            = aws_iam_role.lambda_role.arn
  handler         = "server/index.handler"
  runtime         = "nodejs24.x"
  timeout         = 30
  memory_size     = 512
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  environment {
    variables = {
      NODE_ENV                = "production"
      VITE_AUTH0_DOMAIN       = var.tf_var_auth0_domain
      VITE_AUTH0_CLIENT_ID    = var.tf_var_auth0_client_id
    }
  }

  tags = {
    Environment = var.environment
    ManagedBy   = "OpenTofu"
  }
}

# API Gateway REST API
resource "aws_apigatewayv2_api" "app" {
  name          = "${var.app_name}-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins     = ["*"]
    allow_methods     = ["GET", "HEAD", "OPTIONS", "POST", "PUT", "PATCH", "DELETE"]
    allow_headers     = ["*"]
    expose_headers    = ["*"]
    max_age          = 300
  }

  tags = {
    Environment = var.environment
  }
}

# Integration between API Gateway and Lambda
resource "aws_apigatewayv2_integration" "lambda" {
  api_id           = aws_apigatewayv2_api.app.id
  integration_type = "AWS_PROXY"
  integration_method = "POST"
  payload_format_version = "2.0"
  integration_uri = aws_lambda_function.app.invoke_arn
  description = "Lambda integration for ${var.app_name}"
}

# Route all requests to Lambda
resource "aws_apigatewayv2_route" "default" {
  api_id    = aws_apigatewayv2_api.app.id
  route_key = "$DEFAULT"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# Stage (deployment)
resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.app.id
  name        = "$default"
  auto_deploy = true
  
  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_logs.arn
    format         = "$context.requestId"
  }

  tags = {
    Environment = var.environment
  }
}

# CloudWatch logs for API Gateway
resource "aws_cloudwatch_log_group" "api_logs" {
  name              = "/aws/apigateway/${var.app_name}"
  retention_in_days = 7

  tags = {
    Environment = var.environment
  }
}

# Lambda permission to be invoked by API Gateway
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.app.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.app.execution_arn}/*/*"
}

# Outputs
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

output "api_endpoint" {
  value       = aws_apigatewayv2_stage.default.invoke_url
  description = "API Gateway endpoint URL"
}

####################################################################
#### NEXT STEPS:  ##################################################
######## 1. Create a CI/CD pipeline to build the react package to auth-app/build #
######## 2. Set auth0_domain and auth0_client_id variables as secrets in AWS and collected by the pipeline #
####################################################################
