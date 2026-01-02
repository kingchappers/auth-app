# Authentication Tester App

This is a small scale attempt to integrate authentication within a basic react application. This is a single-page application (so it doesn't reload the entire page as the user interacts with it) that will allow a user to login to it and display information when the user is authenticated. 

This will be deployed to AWS' Lambda, API Gateway, S3, and CloudFront services and the IaC will be contained in this repository (monorepo). This should make it cheap to run and easy to maintain.

It didn't start out this way, but I intend on using this is a template for future projects that require some sort of web app with authentication. I've struggled to get authentication working with an API Gateway in the past so I'm aiming to resolve that problem in a repeatable way for future me. 

# Infrastructure
This project uses OpenTofu for IaC, the code is stored in the infra folder.

# Components
This app is made up of: 
- React
- React-router
- Mantine
