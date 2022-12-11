const path = require('path')
const jsforce = require('jsforce');
const express = require('express'); 
//var bodyParser = require('body-parser');  
//const { request } = require('express');
const app = express();
const PORT = process.env.PORT || 3001;

const SF_LOGIN_URL = 'https://login.salesforce.com'; 
const USER_NAME = 'ashwin.joshi@mindful-koala-8ppxrs.com'; 
const PASS_WORD = '123456@abc'; 
const SF_TOKEN = 'JWIFL6z4kvbMxqxCxIec3nhsc'; 

var conn = new jsforce.Connection({
  // you can change loginUrl to connect to sandbox or prerelease env.
  loginUrl : SF_LOGIN_URL
}); 

conn.login(USER_NAME, PASS_WORD+SF_TOKEN, function(err, userInfo) {
  if (err) { return console.error(err); }
  // Now you can get the access token and instance URL information.
  // Save them to establish connection next time.
  console.log(conn.accessToken);
  console.log(conn.instanceUrl);
  // logged in user property
  console.log("User ID: " + userInfo.id);
  console.log("Org ID: " + userInfo.organizationId);
});

app.use(express.json({extended: true, limit: '1mb'}))

app.post('/updatePost', (req, res)=>{
  
  console.log('********************************');
  console.log(req.body.action)
  var canChangeStatus = true

  var action = req.body.action
  var pullRequest = req.body.pull_request
  var merged = pullRequest.merged
  var requestHead = pullRequest.head 
  var branchName = requestHead.ref

  //res.send("Salesforce integration"+'$'+action+'$'+pullRequest+'$'+merged+'$'+requestHead+'$'+branchName)
  //Main function 
  updateStatus(action,merged,branchName,canChangeStatus); 
})
app.get('/', (req, res)=>{
  res.send("Salesforce integration")
})
app.get('/update', (req, res)=>{
  //Main function 
  // mainFunction(); 
res.send("Salesforce integration update")
})
app.listen(PORT, ()=>{
  console.log('Server is running');
})

async function updateStatus(action,merged,branchName,canChangeStatus){
    try {
      var ticket = ''; 
      for(let i=0; i<branchName.length-2; i++)
      {
        if(branchName[i] ==='W' &&branchName[i+1]==='-')
        {
            ticket='W-'; 
            for(let j=i+2; j<branchName.length; j++)
            {
                if(branchName[j]>='0' && branchName[j]<='9')
                {
                    ticket +=branchName[j]; 
                }
                else break; 
            }
        }  
      }
      console.log('branchName  -> '+ branchName)
      console.log('ticket -> '+ ticket)
      if(ticket.length>0)
      {
        var newStatus; 
        if(action === 'opened' || action ==='reopened')
        {
            newStatus = 'Ready for Review'; 
        }
        else if(action ==='closed' && merged){
            newStatus = 'Fixed'; 
        }
        else if(action === 'closed' && !merged){
            newStatus = 'In Progress'; 
        }
        else {
            canChangeStatus = false; 
        }

        if(canChangeStatus){
          var result =  await conn.query("SELECT Id, agf__Status__c FROM agf__ADM_Work__c WHERE Name =  '"+ ticket +"'");
          //console.log(result);
          if(result.records.length > 0)
          { //if the result has no records then print this message. 
            console.log(result);
  
            await conn.sobject("agf__ADM_Work__c").update({ 
              Id : result.records[0].Id,
              agf__Status__c : newStatus
            }, function(err, ret) {
              if (err || !ret.success) { return console.error(err, ret); }
              console.log('Updated Successfully : ' + ret.id);
            });
            return true; 
          }
        } 
      } 
    } catch (error) {
        console.log(error);
      }    
      return false; 
}




