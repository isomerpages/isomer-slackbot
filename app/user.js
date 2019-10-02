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
const { createReadStream } = require('fs')
const ObjectsToCsv = require('objects-to-csv')
var tmp = require('tmp')

// Credentials - *** this should be imported in index.js
const PERSONAL_ACCESS_TOKEN = process.env['KWAJIEHAO_PERSONAL_ACCESS_TOKEN'] // kwajiehao personal access token
const USERNAME = 'kwajiehao' // user account which possesses the power to perform permissioned actions
const CREDENTIALS = `${USERNAME}:${PERSONAL_ACCESS_TOKEN}`

// Other variables
// const orgName = 'test-kwa'

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

// get git logs
async function getLogs (owner, repo, startDate, endDate) {
/*
@orgName name of owner who owns the repository - could be organization or user (string)
@repo name of repository (string)
@startDate ISO8601 format, YYYY-MM-DDTHH:MM:SSZ, for example, 2011-04-14T16:00:49Z
@endDate ISO8601 format, YYYY-MM-DDTHH:MM:SSZ
*/
  try {
    const data = await request('GET /repos/:owner/:repo/commits', {
      owner: owner,
      repo: repo,
      since: startDate,
      until: endDate,
      headers: {
        authorization: `basic ${btoa(CREDENTIALS)}`,
        accept: 'application/vnd.github.hellcat-preview+json',
      },
    })
    // console.log(data.data)
    const commits = data.data.map((curr) => {
      return {
        commitId: curr.sha.substring(0, 7),
        author: curr.commit.author.name,
        description: curr.commit.message,
        date: curr.commit.author.date.substring(0, curr.commit.author.date.length - 1).replace('T', ' '),
      }
    })
    return commits
  } catch (err) {
    // *** log error - to do: develop more sophisticated logging techniques
    // console.log(err)
  }
}

// create a csv and upload it
async function createAndSendCsv (channelId, client, commitData) {
  try {
    // create a csv object from the data object
    const commitCsv = new ObjectsToCsv(commitData)

    // async temp file creation
    tmp.file(async function _tempFileCreated (err, path, cleanupCallback) {
      // path is the absolute filepath of the temp file created
      // fd is the file descriptor of the temp file created
      if (err) throw err

      // Save to temp file
      await commitCsv.toDisk(`${path}.csv`)

      // upload the file
      fileUpload(channelId, client, `${path}.csv`)
    })
  } catch (err) {
    // console.log(err)
  }
}

// upload a file to a channel
async function fileUpload (channelId, client, fileAddress) {
  try {
    await client.files.upload({
      token: process.env['BOT_SLACK_OAUTH_ACCESS'],
      channels: channelId,
      // You can use a ReadableStream or a Buffer for the file option
      // This file is located in the current directory (`process.pwd()`), so the relative path resolves
      file: createReadStream(fileAddress),
      filename: 'commitlog.csv',
    })
  } catch (err) {
  }
}

const { WebClient } = require('@slack/web-api')
const slackToken = process.env['BOT_SLACK_OAUTH_ACCESS']
const web = new WebClient(slackToken)
const data = [
  { code: 'CA', name: 'California' },
  { code: 'TX', name: 'Texas' },
  { code: 'NY', name: 'New York' },
]
// inviteToOrganization('Test-kwa', 'isomer-bot')
// inviteToTeam('isomer-bot', 3433871)
// getUserId('kwajiehao')
// getTeamId('test-kwa', 'test-team-2') // abc is 3433868, test-team-2 is 3433871
// checkTeamRole(3433871, 'isomer-bot')
// getAllTeams('isomerpages')
// getAllTeamMembers(orgName, 'abc')
// checkIfInTeam(3433868, 'isomer-bot')
// checkIfInOrg('test-kwa', 'kwajiehao')
// getLogs('kwajiehao', 'telegram_kwabot', '2019-08-14T00:00:00Z')
createAndSendCsv('DNERMJMDW', web, data)
// fileUpload('DNERMJMDW', web)

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
  getLogs,
  fileUpload,
}
