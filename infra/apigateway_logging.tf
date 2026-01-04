// Create the API Gateway service-linked role so API Gateway can enable access logging
resource "aws_iam_service_linked_role" "apigateway" {
  aws_service_name = "apigateway.amazonaws.com"
  description      = "Service-linked role for API Gateway to write access logs to CloudWatch Logs"
}
