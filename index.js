var jsforce = require('jsforce');

var conn = new jsforce.Connection({
  // you can change loginUrl to connect to sandbox or prerelease env.
  loginUrl : 'https://login.salesforce.com'
});
const USER_NAME = 'ashwin.joshi@mindful-koala-8ppxrs.com'; 
const PASS_WORD = '123456@abc'; 
const NAMESPACE = 'agf';  //change the namespace accordingly in line 160 and 177
const NAMESPACE_PREFIX = NAMESPACE + '__'; 

conn.login(USER_NAME, PASS_WORD, function(err, userInfo) {
  if (err) { return console.error(err); }
  // Now you can get the access token and instance URL information.
  // Save them to establish connection next time.
  console.log(conn.accessToken);
  console.log(conn.instanceUrl);
  // logged in user property
  console.log("User ID: " + userInfo.id);
  console.log("Org ID: " + userInfo.organizationId);

  //Main function 
  mainFunction(); 

});



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
            agf__Status__c : 'Updated Account#1000'
          }, function(err, ret) {
            if (err || !ret.success) { return console.error(err, ret); }
            console.log('Updated Successfully : ' + ret.id);
            // ...
          });



          return true; 
        }
      } catch (error) {
        console.log(error);
      }
    
      return false; 
}

async function checkProductErrors(productName)
{ //If user is not able to add product we are checking 3 cases : 
  //1. If there is no product having the name that user is trying to add. 
  const productInValid = await isProductNameInValid(productName)
  if(productInValid)
  {
    return; 
  }

  //2. If the recurring price of the product is null. 
  const recurringPriceNull = await isRecurringPriceNull(productName)
  if(recurringPriceNull)
  {
    return; 
  }

  //3. If the product is not active. (IsActive = false for the product) 
  const productNotActive = await isProductNotActive(productName)
  if(productNotActive)
  {
    return; 
  }

  //If we could find no error, then print this message. 
  console.log("Sorry, we could not find anything wrong!!");
}

async function isProductNameInValid(productName) 
{ 
  try {
    //result stores response of query for the product whose name is given by user
    var result =  await conn.query("SELECT Id, Name FROM Product2 WHERE Name = '"+ productName +"' LIMIT 100");
    //console.log(result);
    if(result.records.length == 0)
    { //if the result has no records then print this message. 
      console.log('There is no product having name as '+productName+'. Please check the name or create a new product with this name.');
      return true; 
    }
  } catch (error) {
    console.log(error);
  }

  return false; 
}

async function isRecurringPriceNull(productName) 
{
  try {
    var result =  await conn.query("SELECT Id, Product2.Name FROM PricebookEntry WHERE "+ NAMESPACE_PREFIX +"RecurringPrice__c = null AND Product2.Name = '"+ productName +"'   LIMIT 100"); 
    //console.log(result);
    if(result.records.length > 0)
    { //if the result is not empty then print this message. 
      console.log('Recurring price for product '+productName+', is NULL.');
      return true; 
    } 

  } catch (error) {
    console.log(error);
  }
  return false; 

}

async function isProductNotActive(productName)
{
  try {
    var result =  await conn.query("SELECT Id, Name, IsActive FROM Product2 WHERE Name = '"+ productName +"' LIMIT 1");

    var product = result.records[0]; 
    if( product.IsActive == false)
    { //if the product is not active print this message. 
      console.log('The product '+productName+', is not Active.');
      return true; 
    }
  } catch (error) {
    console.log(error);
  }
  return false; 

}

function checkAttributeAssignment() {
  //Query for AttributeAssignment__c
  conn.query("SELECT Id FROM "+ NAMESPACE_PREFIX +"AttributeAssignment__c ", function(err, result) {
    if (err) { return console.error(err); }
    // "result" stores the data returned by the query. 
    if(result.records.length > 5)
    { // if the number of AttributeAssignment__c records in org is greater than 5 
      // then we say that the job is taking time because it has to process large number of records. 
      console.log("Due to large number of AttributeAssignment__c, batch job taking some time. Please be patient.");
    }
    else 
    {
      console.log("Please try running the job again.");
    }  
  });
}

function checkPromoCode(promotionName) {

  var promoCode = "" ; 
  //Get the promoCode of the promotion whose name is given by the user. 
  conn.query("SELECT Id, "+ NAMESPACE_PREFIX +"Code__c , Name	 FROM "+ NAMESPACE_PREFIX +"Promotion__c where Name = '"+promotionName+"' ", function(err, result) {
    if (err) { return console.error(err); }

    var promotions = result.records;  
    var promotion = promotions[0]; 
    promoCode = promotion.vlocity_digital__Code__c;      
    isPromoCodeDuplicate(promoCode, promotionName); 
  });
}

function isPromoCodeDuplicate(promoCode, promotionName){
  // this function checks if there is any other promotion that is having the same code but is having a different promotion name as entered by the user. 
  conn.query("SELECT Id, "+ NAMESPACE_PREFIX +"Code__c, Name	 FROM "+ NAMESPACE_PREFIX +"Promotion__c ", function(err, result) {
    if (err) { return console.error(err); }

    var duplicatePromo = null; 
    //promotionsVar stores all the promotions in the org
    var promotionsVar = result.records;  
    for (let i = 0; i < promotionsVar.length; i++)
    { 
      var promotion = promotionsVar[i]; 

      if( promotion.Name != promotionName && promotion.vlocity_digital__Code__c == promoCode )
      { 
        duplicatePromo =  promotion.Name; 
        break; 
      }
    }

    if(duplicatePromo != null)
    {
      console.log(duplicatePromo + " has the same code as " + promotionName + ". Please use different promo code.");
    }
    else 
    {
      console.log("Sorry, we could not find anything wrong!!");
    }

  });

}




