const meta = require("./config.json");//open Json file
const rawProjet =require("./rawProjet.json");

const jsonFile = require('jsonfile');//load library
const {Client, Intents} = require("discord.js");
const github = require("@octokit/rest");
const log =require("fs");

const client = new Client({ intents: [Intents.FLAGS.GUILDS] }); //set objet
const octokit = new github.Octokit({
    auth: meta.user_token
  });
client.login(meta.bot_token);

let projet=[];//load last projet
for (let i=0;i<rawProjet.length;i++){
    projet.push(rawProjet[i]);
}

async function run(){//def main function
    //to proof the execution in the log
    let Rundate = new Date
    console.log("run at:"+Rundate);
    log.appendFile("log.txt","run at: "+Rundate+"\n",function(err){if (err) {console.log(err);}});

    //get the user followings
    var user=[]
    var rawData= await octokit.request('GET /users/{username}/following',{
        username: meta.user_name
    });
    for (let i=0;i<rawData.data.length;i++){
        user.push(rawData.data[i].login);
    }
    //get the repo activity of user's following
    for(let b=0;b<user.length;b++){
        var data=await octokit.request('GET /users/{username}/events/public',{
            username: user[b]
        });
        for (let a=0; a< data.data.length;a++){
            if (data.data[a].public==true){
                if(data.data[a].type =="CreateEvent" || data.data[a].type =="ReleaseEvent" ||data.data[a].type =="PushEvent"){
                    let test= verif(data.data[a].repo.id,data.data[a].created_at,data.data[a].actor.login);//call the function to verif
                    if(test==1){
                        
                        const channel = client.channels.cache.get(meta.id_salon);
                        let date=data.data[a].created_at.toString("MMMM dS, yyyy");
                        let name=data.data[a].repo.name.split("/");
                        var message="Hello @everyone here are the news:\n"+data.data[a].actor.login+
                                    " update his/her projet named: "+name[1]+"\nupdate at: "+date+"\n Url: https://github.com/"+data.data[a].repo.name;
                        channel.send(message);
                        //send a message in the salon
                        
                    }
                    else if(test==2){
                        
                        const channel = client.channels.cache.get(meta.id_salon);
                        let date=data.data[a].created_at.toString("d-MMM-yyyy");
                        let name=data.data[a].repo.name.split("/");
                        var message="Hello @everyone here are the news:\n"+data.data[a].actor.login+
                                    " create one projet named: "+name[1]+"\ncreate at: "+date+"\n Url: https://github.com/"+data.data[a].repo.name;
                        channel.send(message);
                        //send a message in the salon
                    }
                }
           }
        }
    }
    for (i = 0; i < projet.length; i++) {
        jsonFile.writeFile('rawProjet.json',projet);
    }

}
function verif(id,date,login){
    //check if projet is already saved
    for(let i=0;i<projet.length;i++){
        if(id==projet[i].id){
            if(date>projet[i].created_at){//check if the projet was updated
                projet[i].created_at=date;
                return 1;
            }
            else{
                return 0;
            }
        }
        else{
            
        }
    }
    //add new projet in array
    var newProjet={
        login:login,
        created_at : date,
        id: id
    }
    projet.push(newProjet);
    return 2;
}
function convert(date){
    let rawtime = date.split("T");
    let day= rawtime[0].split("-");
    let hours= rawtime[1].split(":");
    let Retdata = day[2]+"/"+day[1]+"/"+day[0]+" at "+hours[0]+":"+hours[1]+"(UTC)";
    return Retdata;
}

client.on("ready", async () => {
    console.log(`Connecté en tant que ${client.user.tag}`);
});//say if the bot is ready

run();
setInterval(run,1000000);
