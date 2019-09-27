/* 
This file will authenticate as a user and contain the commands required 
to make more permissioned changes to Github such as adding or removing 
users

Note that different requests require different specific accept headers. 
Read the API documentation carefully!
*/


// Import dependencies
const { request } = require("@octokit/request")
const btoa = require('btoa')
const utils = require('./utils')



// Credentials - *** this should be imported in index.js
PERSONAL_ACCESS_TOKEN = process.env['KWAJIEHAO_PERSONAL_ACCESS_TOKEN'] // kwajiehao personal access token
USERNAME = 'kwajiehao' // user account which possesses the power to perform permissioned actions
CREDENTIALS = `${USERNAME}:${PERSONAL_ACCESS_TOKEN}`


// Other variables
const orgId = 'test-kwa'


/*

Commands to be performed by slash function

*/




// invite (add) one user or multiple users to the organization 
// and team(s) of the function invoker's choosing
async function inviteToOrganization(orgName, username, team) {
/*
@orgName the organization's name as a string (case-sensitive)
@username should be a string reprenting the user's Github login ID
@team is an integers which represents the team's Github Id
*/
    try {
        const userId = await getUserId(username)
        const teamId = await getTeamId(orgId, team)

        const data = await request("POST /orgs/:org/invitations", {
            org: orgName,
            invitee_id: userId,
            team_ids: [teamId], // this has to be in array form according to api
            headers: {
              authorization: `basic ${btoa(CREDENTIALS)}`,
              accept: "application/vnd.github.dazzler-preview+json"
            }
        })

        console.log(data)

        /* 

        Here we can experiment with inviting through email instead of userId

        */


    } catch(err) {
        // *** log error - to do: develop more sophisticated logging techniques
        console.log(err)
        return err
    }
}



// Delete user from organization - this will also remove them 
// from all teams in the org
async function deleteFromOrganization(orgName, username) {
/*
@orgName the organization's name as a string (case-sensitive)
@username is the user's Github username as a string (case-sensitive)
*/
    try {
        const data = await request("DELETE /orgs/:org/members/:username", {
            org: orgName,
            username: username,
            headers: {
              authorization: `basic ${btoa(CREDENTIALS)}`,
              accept: "application/vnd.github.dazzler-preview+json"
            },
        })

        console.log(`User ${username} was removed from ${orgName}`)

        /* 

        Here we can experiment with inviting through email instead of userId

        */


    } catch(err) {
        // *** log error - to do: develop more sophisticated logging techniques
        console.log(err)
    }
}


// Check the user ID of a user given their username
async function getUserId(username) {
/*
@username is the user's Github username as a string (case-sensitive)
*/
    try {
        const data = await request("GET /users/:username", {
            username: username,
            headers: {
                authorization: `basic ${btoa(CREDENTIALS)}`,
                accept: "application/vnd.github.machine-man-preview+json"
              }
        })
    
        // return the user id
        return data['data']['id']

    } catch(err) {
        // *** log error - to do: develop more sophisticated logging techniques
        console.log(err)
    }

}




/* 

Team-related functions

*/



// Check all the teams in an organization
async function getAllTeams(orgName) {
    try {
        const data = await request("GET /orgs/:org/teams", {
            org: orgName,
            headers: {
                authorization: `basic ${btoa(CREDENTIALS)}`,
                accept: "application/vnd.github.hellcat-preview+json"
            }
        })

        // return team names
        const teamNames = data['data'].map(a => a.name)
        return teamNames
    
    } catch(err) {
        // *** log error - to do: develop more sophisticated logging techniques
        console.log(err)
    }
}



// Check the id of a team given its name
async function getTeamId(orgName, teamName) {
/*
@orgName is the organization's name as a string (case-sensitive)
@teamName is representing the team's name as a string (case-sensitive)
*/
    try {
        const teamSlug = utils.slugify(teamName)

        const data = await request("GET /orgs/:org/teams/:team_slug", {
            org: orgName,
            team_slug: teamSlug,
            headers: {
                authorization: `basic ${btoa(CREDENTIALS)}`,
                accept: "application/vnd.github.hellcat-preview+json"
            }
        })

        // return team id
        return data['data']['id']
    
    } catch(err) {
        // *** log error - to do: develop more sophisticated logging techniques
        console.log(err)
    }
    
}



// check if the user is a maintainer in the team
async function checkTeamRole(teamId, username) {
/*
@teamId is an integer representing the team's Github ID 
@username is the user's Github username as a string (case-sensitive)
*/
    try {
        const data = await request("GET /teams/:team_id/memberships/:username", {
            team_id: teamId,
            username: username,
            headers: {
                authorization: `basic ${btoa(CREDENTIALS)}`,
                accept: "application/vnd.github.hellcat-preview+json"
            }
        })

        // check if team role is 'maintainer'
        const teamRole = await data['data']['role']    
        return teamRole === 'maintainer'

    } catch(err) {
        // *** log error - to do: develop more sophisticated logging techniques
        console.log(err)
    }
    
}



// inviteToOrganization('Test-kwa', 'isomer-bot')
// getUserId('kwajiehao')
// getTeamId('Test-kwa', 'abc') // 3433868
// checkTeamRole(3433868, 'kwajiehao')
getAllTeams('isomerpages')


module.exports = {
    getUserId,
    inviteToOrganization,
    deleteFromOrganization,
    getAllTeams
}