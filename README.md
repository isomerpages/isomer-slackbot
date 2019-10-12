## Problem statement
Github does not have a sophisticated user permissions system. This means that agency team leaders in Isomer cannot add or remove users by themselves; team leaders must contact us, the organization owners, who must then manually add or remove users from teams in Isomer. 

## Mission
This Slack app is meant to help Open Gov Products delegate the responsibility of managing teams and users to team leaders. In the future, more features can be added to this Slack bot to allow agency users to self-serve themselves on other aspects of Isomer, such as monthly commit logs.

## How it works
This app works mainly using Slack slash commands. Slash commands act as an interface for Isomer users to communicate with Github on our (the organization owners) behalf: for example, one of the slash commands is `/add-users`. By sending the message `/add-users <username>` to any channel in the Isomer workspace, the user can add a new member to his/her team in the Isomer organization using our credentials d(provided the user who invoked the function has the necessary permissions to add users).

## Functions
**Add User**
Enter the username of the person you want to invite to Isomer and select the team you wish to invite him/her to.

**Remove User**
Select an Isomer team you would like to remove a user from and select the team member to remove from the subsequent drop down.

**Get Commit Logs**
Enter your repo name and select the start and end dates for which you would like to retrieve your commit logs.

## Local development
You can run the slackbot locally using ngrok. More information on how to download and run ngrok can be found [here](https://ngrok.com/download). The command to start a ngrok server is `./ngrok http <port number>`. Once you have set up your ngrok server, you can take your ngrok URL and configure your URL end points on your Slack app.

### Things to work on
- Document the functions
- Implement permissions and a whitelist of team leaders who will be allowed to perform permissioned actions
- Remove user from team function (right now we can only remove from organization)
- Multiselect list to add users to multiple teams / remove multiple users from organization
