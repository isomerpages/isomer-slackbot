/* eslint-disable dot-notation */
/*
This file will authenticate as a user and contain the commands required
to make more permissioned changes to Github such as adding or removing
users

Note that different requests require different specific accept headers.
Read the API documentation carefully!
*/

// Import dependencies
const { request } = require('@octokit/request')
const btoa = require('btoa')
const utils = require('./utils')

// Credentials - *** this should be imported in index.js
const PERSONAL_ACCESS_TOKEN = process.env['KWAJIEHAO_PERSONAL_ACCESS_TOKEN'] // kwajiehao personal access token
const USERNAME = 'kwajiehao' // user account which possesses the power to perform permissioned actions
const CREDENTIALS = `${USERNAME}:${PERSONAL_ACCESS_TOKEN}`

// Other variables
const orgName = 'test-kwa'

/*

Commands to be performed by slash function

*/

// invite (add) one user or multiple users to the organization
// and team(s) of the function invoker's choosing
async function inviteToOrganization (orgName, username, teamId) {
/*
@orgName the organization's name as a string (case-sensitive)
@username should be a string reprenting the user's Github login ID
@team is an integers which represents the team's Github Id
*/
  try {
    // get the user's github id
    const userId = await getUserId(username)
    const data = await request('POST /orgs/:org/invitations', {
      org: orgName,
      invitee_id: userId,
      team_ids: [teamId], // this has to be in array form according to api
      headers: {
        authorization: `basic ${btoa(CREDENTIALS)}`,
        accept: 'application/vnd.github.dazzler-preview+json',
      },
    })

    return data
    /*

        Here we can experiment with inviting through email instead of userId

    */
  } catch (err) {
    // *** log error - to do: develop more sophisticated logging techniques
    // console.log(err)
    return err
  }
}

// invite a user that is already part of the organization to a team
// in the organization
async function inviteToTeam (username, teamId) {
/*
@username should be a string reprenting the user's Github login ID
@teamId is an integers which represents the team's Github Id
*/
  try {
    const data = await request('PUT /teams/:team_id/memberships/:username', {
      team_id: teamId,
      username: username,
      headers: {
        authorization: `basic ${btoa(CREDENTIALS)}`,
        accept: 'application/vnd.github.dazzler-preview+json',
      },
    })
    return data
  } catch (err) {
    // *** log error - to do: develop more sophisticated logging techniques
    // console.log(err)
    return err
  }
}

// Delete user from organization - this will also remove them
// from all teams in the org
async function deleteFromOrganization (orgName, username) {
/*
@orgName the organization's name as a string (case-sensitive)
@username is the user's Github username as a string (case-sensitive)
*/
  try {
    const data = await request('DELETE /orgs/:org/members/:username', {
      org: orgName,
      username: username,
      headers: {
        authorization: `basic ${btoa(CREDENTIALS)}`,
        accept: 'application/vnd.github.dazzler-preview+json',
      },
    })

    return data
    /*

        Here we can experiment with inviting through email instead of userId

    */
  } catch (err) {
    // *** log error - to do: develop more sophisticated error detection techniques
    // console.log(err)
  }
}

// Check the user ID of a user given their username
async function getUserId (username) {
/*
@username is the user's Github username as a string (case-sensitive)
*/
  try {
    const data = await request('GET /users/:username', {
      username: username,
      headers: {
        authorization: `basic ${btoa(CREDENTIALS)}`,
        accept: 'application/vnd.github.machine-man-preview+json',
      },
    })
    // return the user id
    return data['data']['id']
  } catch (err) {
    // *** log error - to do: develop more sophisticated logging techniques
    // console.log(err)
  }
}

/*

Team-related functions

*/

// Check all the teams in an organization
async function getAllTeams (orgName) {
  try {
    const data = await request('GET /orgs/:org/teams', {
      org: orgName,
      headers: {
        authorization: `basic ${btoa(CREDENTIALS)}`,
        accept: 'application/vnd.github.hellcat-preview+json',
      },
    })

    // return team names
    const teamNames = data['data'].map(a => a.name)
    return teamNames
  } catch (err) {
    // *** log error - to do: develop more sophisticated logging techniques
    // console.log(err)
  }
}

// Check all the members in a team
async function getAllTeamMembers (orgName, team) {
  const teamId = await getTeamId(orgName, team)
  try {
    const data = await request('GET /teams/:team_id/members', {
      team_id: teamId,
      headers: {
        authorization: `basic ${btoa(CREDENTIALS)}`,
        accept: 'application/vnd.github.hellcat-preview+json',
      },
    })
    // return team names
    const memberNames = data['data'].map(a => a.login)
    return memberNames
  } catch (err) {
    // *** log error - to do: develop more sophisticated logging techniques
    // console.log(err)
  }
}

// Check the id of a team given its name
async function getTeamId (orgName, teamName) {
/*
@orgName is the organization's name as a string (case-sensitive)
@teamName is representing the team's name as a string (case-sensitive)
*/
  try {
    const teamSlug = utils.slugify(teamName)
    const data = await request('GET /orgs/:org/teams/:team_slug', {
      org: orgName,
      team_slug: teamSlug,
      headers: {
        authorization: `basic ${btoa(CREDENTIALS)}`,
        accept: 'application/vnd.github.hellcat-preview+json',
      },
    })

    // return team id
    return data['data']['id']
  } catch (err) {
    // *** log error - to do: develop more sophisticated logging techniques
    // console.log(err)
  }
}

// check if the user is a maintainer in the team, or the state of the membership
async function checkTeamRole (teamId, username) {
/*
@teamId is an integer representing the team's Github ID
@username is the user's Github username as a string (case-sensitive)

note: this assumes that the username submitted is a part of the team!
you can do this by running the checkIfInTeam function below.
*/

  try {
    const data = await request('GET /teams/:team_id/memberships/:username', {
      team_id: teamId,
      username: username,
      headers: {
        authorization: `basic ${btoa(CREDENTIALS)}`,
        accept: 'application/vnd.github.hellcat-preview+json',
      },
    })

    // console.log(data['data'])
    // returns an object that tells you if the member is
    //    1. a maintainer
    //    2. already invited
    return {
      isMaintainer: data['data']['role'] === 'maintainer',
      isInvited: data['data']['state'],
    }
  } catch (err) {
    // *** log error - to do: develop more sophisticated logging techniques
    // console.log(err)
  }
}

// check if a user is in a team
async function checkIfInTeam (teamId, username) {
/*

Add comments

*/

  // initiate empty array to store results
  const inTeam = []

  try {
    const data = await request('GET /teams/:team_id/members', {
      team_id: teamId,
      headers: {
        authorization: `basic ${btoa(CREDENTIALS)}`,
        accept: 'application/vnd.github.hellcat-preview+json',
      },
    })

    // get the list of members
    const memberList = data['data']

    // puts the username of each member into the results array
    for (let i = 0; i < memberList.length; i += 1) {
      inTeam.push(memberList[i].login)
    }

    return inTeam.indexOf(username) > -1
  } catch (err) {
    // *** log error - to do: develop more sophisticated logging techniques
    // console.log(err)
  }
}

// check if a user is in an organization
async function checkIfInOrg (orgID, username) {
/*
    Add comments
*/
  // initiate empty array to store results
  const inOrg = []
  try {
    const data = await request('GET /orgs/:org/members', {
      org: orgID,
      headers: {
        authorization: `basic ${btoa(CREDENTIALS)}`,
        accept: 'application/vnd.github.hellcat-preview+json',
      },
    })
    // get the list of members
    const memberList = data['data']
    // puts the username of each member into the results array
    for (let i = 0; i < memberList.length; i += 1) {
      inOrg.push(memberList[i].login)
    }
    return inOrg.indexOf(username) > -1
  } catch (err) {
    // *** log error - to do: develop more sophisticated logging techniques
    // console.log(err)
  }
}

// inviteToOrganization('Test-kwa', 'isomer-bot')
// inviteToTeam('isomer-bot', 3433871)
// getUserId('kwajiehao')
// getTeamId('test-kwa', 'test-team-2') // abc is 3433868, test-team-2 is 3433871
// checkTeamRole(3433871, 'isomer-bot')
// getAllTeams('isomerpages')
getAllTeamMembers(orgName, 'abc')
// checkIfInTeam(3433868, 'isomer-bot')
// checkIfInOrg('test-kwa', 'kwajiehao')

module.exports = {
  inviteToOrganization,
  inviteToTeam,
  deleteFromOrganization,
  getAllTeams,
  getAllTeamMembers,
  getUserId,
  getTeamId,
  checkTeamRole,
  checkIfInTeam,
  checkIfInOrg,
}
