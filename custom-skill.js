// Include the Alexa SDK v2
const Alexa = require("ask-sdk-core");
const actions = require("./actions");

// Launch Request Handler -- When a skill is launched
const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === "LaunchRequest";
  },
  handle(handlerInput) {
    console.log("Launch Request Handler Called");
    let speechText =
      "Hello , I am cygnus from Saxo Bank , I would be glad to assist you . You can ask me to look up any stock , latest finance news or open an  account with Saxo bank - The  Specialist in Trading and Investment";
    let repromptText =
      "Sorry I did not receive any input. Do you need any help ?";
      
      //session attribute for data persistance during alexa session is live , if user says Yes/No to the repromptText 
      handlerInput.attributesManager.setSessionAttributes({type:"help"});
      

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(repromptText)
      .getResponse();
  }
};

//to get latest saxo starts news
const GetNewsHandler = { 
   canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name === "GetNews"
    );
   },
   async handle(handlerInput) {
     console.log("GetNews Intent handler called");
     let speechText = '';
     
     // fetch a random tweet from @saxobank recent tweets (10)
      const options = {
       host:"api.twitter.com",
       path:'/2/users/24150300/tweets',
       method:"GET",
       headers:{
         Authorization:"Bearer YOUR_BEARER_TOKEN_HERE"
       }
     };
     try {
        const response = await actions.fetchData(options);
        const randomNo = Math.floor(Math.random()*10);
        const randomTweet = response.data[randomNo].text;
        // add regex to remove url from tweet
         console.log("before regex => " +randomTweet)
        const regex = /([\w+]+\:\/\/)?([\w\d-]+\.)*[\w-]+[\.\:]\w+([\/\?\=\&\#]?[\w-]+)*\/?/gm;
        speechText = randomTweet.replace(regex,'');
        console.log("after regex => " +speechText)
       
     } catch (err) { 
       speechText="Currently not able to connect to Twitter , Please try again in some time "
     }
     
     return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt()
      .getResponse();
   }
}

// to get share price of stock
const GetStockPriceHandler = { 
    canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name === "GetStockPrice"
    );
  },
 async  handle(handlerInput) {
     console.log("GetStockPrice Intent handler called");
     // get the stock name;
     // slot info
     let slotdata = handlerInput.requestEnvelope.request.intent.slots;
     let speechText = "";
     
     let stock = ""
     let price = "not found yet";
     
    console.log("Slot Values --> " + JSON.stringify(slotdata));
     //get name of instrument
     if(slotdata.stockname.value) { 
       stock = slotdata.stockname.value;
       console.log(`user asked for price of ${stock}`);
     }
     
     // fetch price from stock apis
    
     const options = {
       host:"www.alphavantage.co",
       path:`/query?function=GLOBAL_QUOTE&symbol=${stock}&apikey=YOUR_API_KEY_OF_ALPHAVANTAGE`,
       method:"GET"
     };
     
     try{ 
       const data = await actions.fetchData(options);
      console.log("Response Values --> " + JSON.stringify(data));
       if (data['Global Quote']) {
         // get price 
         price = data['Global Quote']['05. price'];
         speechText ="Currently Stock price of " + stock + " is "+ Number(price).toFixed(2);
       }
       else {
         speechText =`Currently unable to get stock price of ${stock}`;
       }
       
     } catch(err) {
       speechText = "Sorry, an error in connecting to Open Api, please try again";
     }
     
    
    //returning response
    let cardTitle = "Curent Stock price of " + stock;
    let cardContent = price;
    //speechText ="Stock price of " + stock + " is "+ price;
    return handlerInput.responseBuilder
      .speak(speechText)
      .withSimpleCard(cardTitle, cardContent)
      .reprompt()
      .getResponse();
    
  }
  
}

//when user wish to open an account
const OpenAccountIntentHandler = { 
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name === "OpenAccount"
    );
  },
  async handle(handlerInput) {
    console.log("OpenAccountIntentHandler is called");
    let speechText = "";
   
    const slots = handlerInput.requestEnvelope.request.intent.slots;
    const calltime = slots.calltime.value ;
    const calldate = slots.calldate.value ;
    const name =    slots.name.value;
    const contactnumber = slots.contactnumber.value;
    
    
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    
  
    
    if(!sessionAttributes.name && name) {sessionAttributes.name = name}
    if(!sessionAttributes.contactnumber && contactnumber) {sessionAttributes.contactnumber = contactnumber}
    if(!sessionAttributes.calltime && calltime) {sessionAttributes.calltime = calltime}
    if(!sessionAttributes.calldate && calldate) {sessionAttributes.calldate = calldate}
    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
  
    if(sessionAttributes.calltime && sessionAttributes.calldate && sessionAttributes.name && sessionAttributes.contactnumber) { 
      // user has provided when to call , make entry into db with name , phone no and calltime
      // POST CALL : API CALL TO HANDLE DATA IN DB
      /* 
        { 
        "name": "hero@gmail.com",
        "contact_number":"10202001",
        "contactLead_on":"22/01/2021 at 5pm"
        }
      */

    const postdata = JSON.stringify({ 
        name:sessionAttributes.name,
        contact_number:sessionAttributes.contactnumber,
        contactLead_on: `${sessionAttributes.calldate} : ${sessionAttributes.calltime}`
      });
      
      const options = {
       host:"API_URL_TO_HANDLE_DATA_IN_DB",
       path:"/openaccount",
       method:"POST",
       headers: {
        'Content-Type': 'application/json',
        'Content-Length': postdata.length
        }
     };
     
      try {
        const response = await actions.postData(options,postdata);
        speechText = "Thank you for your interest in opening  the trading account, to complete account verification process, our team would contact you soon"
      } catch(err) { 
        speechText = "Your account is already created , Tele verification is pending and will be done soon. Thankyou !"
      }
      
    } else { 
       const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
     if(!sessionAttributes.name) speechText = "Please Provide your name .";
     else if(!sessionAttributes.contactnumber) speechText = "Your Contact Number ? ";
     else speechText = "Sure and  When should our team  call  you for verification purpose";
    }
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt()
      .getResponse();
  }
  
  
}

// when user asks for help
const HelpIntentHandler = { 
  canHandle(handlerInput) { 
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name === "AMAZON.HelpIntent"
    );
  },
  handle(handlerInput) { 
    console.log("HelpIntentHandler is called");
    
    //setting attribute for data persitence for repromptText
    handlerInput.attributesManager.setSessionAttributes({type:"news"});
    
    let speechText = `I can read out latest financial news and also get the current share price of any stock.
    To know about markets news , you can try speaking ,  today's finance news or how is market today.
    To know about Share price of any Stock say ,what is  share price of INFY.
    To Open Your Trading Account, say , open my account or start my trading account.
    `;
    
    let repromptText = "Sorry I did not recieve any input, DO you want me to  read out Saxo Starts for the day ?";
    
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(repromptText)
      .getResponse();
    
  }
};


//when user says Yes, ok , fine , proceed ....
const YesIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name === "AMAZON.YesIntent"
    );
  },
  handle(handlerInput) {
    console.log("YesIntentHandler is called");
    let attributes = handlerInput.attributesManager.getSessionAttributes();
    let speechText = "";
    if (attributes.type) { 
      switch(attributes.type) {
        case "news":
          return GetNewsHandler.handle(handlerInput);
        case "help":
          return HelpIntentHandler.handle(handlerInput);
        default:
        speechText="Sorry, I don't know this !"
      }
      
    }else {
      speechText= "Sorry, I am not sure what you meant Yes for"
    }
    
    return handlerInput.responseBuilder
           .speak(speechText)
           .getResponse();
    
  },
};

//when user says no , never etc....
const NoIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name === "AMAZON.NoIntent"
    );
  },
  handle(handlerInput) {
    console.log("No IntentHandler is called");
    let speechText = "It was nice talking to you.  Good Bye , Do checkout more about us on www.home.saxo.com"
      return handlerInput.responseBuilder
           .speak(speechText)
           .getResponse();
    
  },
};


const StopIntentHandler = { 
   canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name === "AMAZON.StopIntent"
    );
  },
  handle(handlerInput) {
    console.log("StopIntentHandler is called");
      return handlerInput.responseBuilder
           .speak('It was nice talking to you.  Good Bye , Do checkout more about us on www.home.saxo.com')
           .shouldEndSession(true)
           .getResponse();
  },
  
}

//any fallback Handler
const FallbackIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name === "AMAZON.FallbackIntent"
    );
  },
  handle(handlerInput) {
    console.log("FallbackIntentHandler is called");
     let speechText = "Sorry , I was not able to understand, still learning . Please Try again "
      return handlerInput.responseBuilder
           .speak(speechText)
           .reprompt()
           .getResponse();
  },
};



// Unhandled Requests
const UnhandledHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error Handler : ${error.message}`);

    return handlerInput.responseBuilder
      .speak(
        "Sorry, I am unable to understand what you said. For help, ask Cygnus and say you need Help"
      ).reprompt()
      .getResponse();
  }
};

exports.handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(LaunchRequestHandler,GetStockPriceHandler,GetNewsHandler,HelpIntentHandler,YesIntentHandler,NoIntentHandler,FallbackIntentHandler,OpenAccountIntentHandler)
  .addErrorHandlers(UnhandledHandler)
  .lambda();
