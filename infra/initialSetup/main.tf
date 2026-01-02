terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }

  backend "s3" {
    bucket = var.state_bucket
    key    = "auth-app-infra-setup/terraform.tfstate"
    region = var.aws_region
    use_lockfile = true
  }
}

provider "aws" {
  region = var.aws_region
}

data "aws_iam_policy_document" "assume_role" {
  statement {
    actions = [
      "sts:AssumeRoleWithWebIdentity",
    ]
    effect = "Allow"

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github_actions.arn]
    }

    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      # Allow workflows from this repo (branches and PRs). Tighten if you only
      # want a specific branch (e.g. ref:refs/heads/main).
      values   = ["repo:kingchappers/auth-app:*"]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "iam_policy" {
  statement {
    actions = [
      "apigateway:GET",
      "iam:AttachRolePolicy",
      "iam:CreateRole",
      "iam:DeleteRolePolicy",
      "iam:DetachRolePolicy",
      "iam:GetRole",
      "iam:ListAttachedRolePolicies",
      "iam:ListRolePolicies",
      "iam:PassRole",
      "iam:PutRolePolicy",
      "lambda:CreateFunction",
      "lambda:DeleteFunction",
      "lambda:UpdateFunction",
      "lambda:GetFunction",
      "logs:CreateLogGroup",
      "logs:DeleteLogGroup",
      "logs:DeleteRetentionPolicy",
      "logs:DescribeLogGroups",
      "logs:ListTagsForResource",
      "logs:PutRetentionPolicy",
      "s3:CreateBucket",
      "s3:DeleteBucket",
      "s3:DeleteObject",
      "s3:GetObject",
      "s3:PutObject",
      "s3:ListBucket"
    ]
    effect    = "Allow"
    resources = ["*"]
  }
}

resource "aws_iam_openid_connect_provider" "github_actions" {
  url            = "https://token.actions.githubusercontent.com"
  client_id_list = ["sts.amazonaws.com"]
}

resource "aws_iam_role" "github_actions_role" {
  name               = "github-actions"
  assume_role_policy = data.aws_iam_policy_document.assume_role.json
}