## Problem statement
Github does not have a sophisticated user permissions system. This means that team leaders in Github organization cannot add or remove users by themselves; team leaders must contact organization owners, who must then manually add or remove users from teams and/or organizations.

## Mission
This Slack app is meant to help Github organization owners delegate the responsibility of managing teams and users to team leaders. In the future, more features can be added to this Slack bot to allow agency users to self-serve themselves on other aspects of Isomer, such as monthly commit logs.

## How it works
This app works mainly using Slack slash commands. Slash commands act as an interface for Isomer users to communicate with Github on our (the organization owners) behalf: for example, one of the slash commands is `/add-users`. By sending the message `/add-users <username>` to any channel in the Isomer workspace, the user can add a new member to his/her team in the Isomer organization using our credentials (provided the user who invoked the function has the necessary permissions to add users).

## Functions

### Things to work on
- Implement permissions and a whitelist of team leaders who will be allowed to perform permissioned actions
- Remove user function
- Retrieve monthly commit log function