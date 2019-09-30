/* 
This file contains the functions that power the logic behind slack
interactions. For example, it tells the slack bot how to react if 
a manager selects a team to add his teammate to using the drop-down menu.  
*/


// import dependencies
const fetch = require('node-fetch')


// import internal modules
const userToServer = require('./user')

async function addUser(i, j, orgID, resUrl, team, users) {
    // get the team id 
    const teamId = await userToServer.getTeamId(orgID, team)

    //  check whether user is in the team yet
    const inTeam = await userToServer.checkIfInTeam(teamId, users[j])
    
    // if not in team, send invite
    if (!inTeam) {
        // check whether user is part of the organization
        const inOrg = await userToServer.checkIfInOrg(orgID, users[j])
        
        // get the response after inviting
        if (inOrg) {
            var result = await userToServer.inviteToTeam(users[j], teamId)
        } else {
            var result = await userToServer.inviteToOrganization(orgID, users[j], teamId)
        }
        
        // get the status code
        const statusCode = result.status.toString()
        
        // if successfully invited, send a message to inform the user
        if (statusCode[0] === '2' && statusCode.length === 3) {
            // send feedback
            await fetch(resUrl, {
                method: 'post',
                body: JSON.stringify({
                    "text": `An invite has been sent to ${users[j]} to join team ${team} on ${orgID}`
                }),
                headers: { 
                    'Content-Type': 'application/json' 
                }
            })
        }
    
    // else if user is already in team
    } else if (inTeam) {
        // if in team, check whether is already invited or active
        const memberStatus = await userToServer.checkTeamRole(teamId, users[j])
        
        // if pending, don't send an invite
        if (memberStatus.isInvited === 'pending') {
            await fetch(resUrl, {
                method: 'post',
                body: JSON.stringify({
                    "text": `An invite has already been sent to ${users[j]} to join team ${team} on ${orgID}`
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
                    "text": `${users[j]} is already a part of team ${team} on ${orgID}`
                }),
                headers: { 
                    'Content-Type': 'application/json' 
                }
            })
        }
    }
}     

module.exports = {
    addUser
}


// Test-cases
// 1. Adding a user who is not a member of the org to the given team
// 2. Adding a user who is a member of the org but not a member of given team
// 3. Adding a user who is a member of the org and is a member of given team
// 4. Adding a user who has already been sent an invite to the organization and a given team