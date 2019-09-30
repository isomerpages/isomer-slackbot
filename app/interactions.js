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
const errInsufficientPerm = {
    method: 'post',
    body: JSON.stringify({
        "text": `You do not possess sufficient permission to make this change`
    }),
    headers: { 
        'Content-Type': 'application/json' 
    }
}


// function to add a single user
async function addUser(i, orgName, resUrl, team, user, inviter) {
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
        await fetch(resUrl, errInsufficientPerm)
        return
    }

    // check if inviter has permission
    const role = await userToServer.checkTeamRole(teamId, inviter)

    if (role.isMaintainer){

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
                var result = await userToServer.inviteToOrganization(orgName, user, teamId)
            }
            
            // get the status code
            const statusCode = result.status.toString()
            
            // if successfully invited, send a message to inform the user
            if (statusCode[0] === '2' && statusCode.length === 3) {
                // send feedback
                await fetch(resUrl, {
                    method: 'post',
                    body: JSON.stringify({
                        "text": `An invite has been sent to ${user} to join team ${team} on ${orgName}`
                    }),
                    headers: { 
                        'Content-Type': 'application/json' 
                    }
                })
            }
        
        // else if user is already in team
        } else if (inTeam) {
            // if in team, check whether is already invited or active
            const memberStatus = await userToServer.checkTeamRole(teamId, user)
            
            // if pending, don't send an invite
            if (memberStatus.isInvited === 'pending') {
                await fetch(resUrl, {
                    method: 'post',
                    body: JSON.stringify({
                        "text": `An invite has already been sent to ${user} to join team ${team} on ${orgName}`
                    }),
                    headers: { 
                        'Content-Type': 'application/json' 
                    }
                })
            }
            
            // if active, send a message accordingly
            if (memberStatus.isInvited === 'active') {
                await fetch(resUrl, {
                    method: 'post',
                    body: JSON.stringify({
                        "text": `${user} is already a part of team ${team} on ${orgName}`
                    }),
                    headers: { 
                        'Content-Type': 'application/json' 
                    }
                })
            }
        }

    // if no permission, send a message indicating that
    } else {
        await fetch(resUrl, errInsufficientPerm)
    }
    
}     

// modules to export
module.exports = {
    addUser
}



