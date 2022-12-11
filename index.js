const path = require('path')
const jsforce = require('jsforce');
const express = require('express'); 
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


app.get('/', (req, res)=>{
  res.send("Salesforce integration")
})
app.get('/update', (req, res)=>{
  //Main function 
  mainFunction(); 
res.send("Salesforce integration")
})
app.listen(PORT, ()=>{
  console.log('Server is running');
})





function mainFunction() {

  console.log('*******************WORKFLOW STARTS***********************')
  updateStatus(); 
}


async function updateStatus(){
    try {
        var ticket = 'W-000010'; 
        //result stores response of query for the product whose name is given by user
        var result =  await conn.query("SELECT Id, agf__Status__c FROM agf__ADM_Work__c WHERE Name =  '"+ ticket +"'");
        //console.log(result);
        if(result.records.length > 0)
        { //if the result has no records then print this message. 
          console.log(result);


          await conn.sobject("agf__ADM_Work__c").update({ 
            Id : result.records[0].Id,
            agf__Status__c : 'Updated Account#1004'
          }, function(err, ret) {
            if (err || !ret.success) { return console.error(err, ret); }
            console.log('Updated Successfully : ' + ret.id);
          
          });



          return true; 
        }
      } catch (error) {
        console.log(error);
      }
    
      return false; 
}




