/* eslint-disable no-trailing-spaces */
/* eslint-disable quote-props */
/*
This file contains the functions that power the logic behind slack
interactions. For example, it tells the slack bot how to react if 
a manager selects a team to add his teammate to using the drop-down menu.  
*/

// import dependencies
const fetch = require('node-fetch')

// import internal modules
const userToServer = require('./user')

// generic error message for insufficient permissions
const errInsufficientPerm = 'You do not possess sufficient permission to make this change'

// function to add a single user
async function addUser (i, orgName, resUrl, team, user, inviter) {
/*
@i index from for loop in index.js (number)
@orgName organization's Github name (string)
@resUrl response URL to send response to (string)
@team team name (string)
@user username of invitee (string)
@inviter username of inviter (string)
*/
  // Test-cases
  // 1. Adding a user who is not a member of the org to the given team
  // 2. Adding a user who is a member of the org but not a member of given team
  // 3. Adding a user who is a member of the org and is a member of given team
  // 4. Adding a user who has already been sent an invite to the organization and a given team

  // get the team id
  const teamId = await userToServer.getTeamId(orgName, team)

  // check if inviter is in the team
  const inviterInTeam = await userToServer.checkIfInTeam(teamId, inviter)

  if (!inviterInTeam) {
    // post error message 
    postMessage(resUrl, errInsufficientPerm)
    return
  }

  // check if inviter has permission
  const role = await userToServer.checkTeamRole(teamId, inviter)

  if (role.isMaintainer) {
    //  check whether user is in the team yet
    const inTeam = await userToServer.checkIfInTeam(teamId, user)
    
    // if not in team, send invite
    if (!inTeam) {
      // check whether user is part of the organization
      const inOrg = await userToServer.checkIfInOrg(orgName, user)

      // get the response after inviting
      if (inOrg) {
        var result = await userToServer.inviteToTeam(user, teamId)
      } else {
        // eslint-disable-next-line no-redeclare
        var result = await userToServer.inviteToOrganization(orgName, user, teamId)
      }

      // if successfully invited, send a message to inform the user
      printStatus(result, resUrl, `An invite has been sent to ${user} to join team ${team} on ${orgName}`)
      
    // else if user is already in team
    } else if (inTeam) {
      // if in team, check whether is already invited or active
      const memberStatus = await userToServer.checkTeamRole(teamId, user)
      
      // if pending, don't send an invite
      if (memberStatus.isInvited === 'pending') {
        postMessage(resUrl, `An invite has already been sent to ${user} to join team ${team} on ${orgName}`)
      }

      // if active, send a message accordingly
      if (memberStatus.isInvited === 'active') {
        postMessage(resUrl, `${user} is already a part of team ${team} on ${orgName}`)
      }
    }

  // if no permission, send a message indicating that
  } else {
    postMessage(resUrl, errInsufficientPerm)
  }
}

async function selectUserToRemove (orgName, team, inviter, action, channelId, client) {
  // check for team ID
  const teamId = await userToServer.getTeamId(orgName, team) 
  
  // check if inviter is a maintainer in the team
  const role = await userToServer.checkTeamRole(teamId, inviter) 

  if (role.isMaintainer) {
    // get a list of members in the team
    const teamMembers = await userToServer.getAllTeamMembers(orgName, team)

    // initiate empty array to store the result to be passed to the interactive message
    const memberOptions = []

    // generate the teamOptions array to be displayed in the message
    for (let i = 0; i < teamMembers.length; i += 1) {
      memberOptions.push({
        'text': {
          'type': 'plain_text',
          'text': teamMembers[i],
        },
        'value': teamMembers[i],
      })
    }

    // provide a dropdown menu of team members to remove
    client.chat.postMessage({
      channel: channelId,
      blocks: [{
        'type': 'section',
        'text': {
          'type': 'mrkdwn',
          'text': 'Which member do you want to remove from the team?',
        },
      }, {
        'type': 'actions',
        // use an * to create a unique id depending on the usernames submitted
        'block_id': team,
        'elements': [{
          'type': 'static_select',
          'placeholder': {
            'type': 'plain_text',
            'text': 'Select member to remove',
          },
          'action_id': action,
          'options': memberOptions,
        }],
      }],
    })
  // send message if insufficient permissions
  } else {
    client.chat.postMessage(channelId, errInsufficientPerm)
  }
}

async function removeUser (orgName, user, resUrl) {
  // delete the user from the organization
  const result = await userToServer.deleteFromOrganization(orgName, user)

  printStatus(result, resUrl, `You have successfully removed ${user} from ${orgName}`)
}

async function printStatus (result, resUrl, text) {
  // get the status code
  const statusCode = result.status.toString()

  // if successfully invited, send a message to inform the user
  if (statusCode[0] === '2' && statusCode.length === 3) {
    // send feedback
    postMessage(resUrl, text)
  }
}

async function postMessage (resUrl, text) {
  await fetch(resUrl, {
    method: 'post',
    body: JSON.stringify({
      'text': text,
    }),
    headers: { 'Content-Type': 'application/json' },
  })
}

// modules to export
module.exports = {
  addUser,
  selectUserToRemove,
  removeUser,
  postMessage,
}
