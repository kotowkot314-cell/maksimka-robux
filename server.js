const axios=require('axios');
const crypto=require('crypto');
const express=require('express');
const app=express();
const PORT=3000;
const DELTA_API_BASE='https://gateway.platoboost.com/a/8';
const HWID='ваш-hwid-здесь';
const USER_AGENT='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const keysStore=new Map();
const taskTokensStore=new Map();
function uuid(){return crypto.randomUUID();}
function sleep(ms){return new Promise(r=>setTimeout(r,ms));}
async function createBypassSession(){
const sessionId=uuid();
taskTokensStore.set(sessionId,{created:Date.now(),tasks:{},token:null});
return sessionId;
}
async function spoofTaskCompletion(sessionId,taskId,payload){
const session=taskTokensStore.get(sessionId);
if(!session)throw new Error('SESSION_NOT_FOUND');
const spoofPayload={
task_id:taskId,
completed:true,
timestamp:Date.now(),
signature:crypto.createHmac('sha256',sessionId).update(taskId+Date.now()).digest('hex'),
hwid:HWID,
user_agent:USER_AGENT,
...payload
};
session.tasks[taskId]=spoofPayload;
taskTokensStore.set(sessionId,session);
return spoofPayload;
}
async function fetchDeltaKey(sessionId){
const session=taskTokensStore.get(sessionId);
if(!session)throw new Error('SESSION_NOT_FOUND');
const requiredTasks=['video_watch','subscribe','survey','human_check'];
const completed=Object.keys(session.tasks);
const missing=requiredTasks.filter(t=>!completed.includes(t));
if(missing.length>0)throw new Error('TASKS_INCOMPLETE: '+missing.join(','));
const reqPayload={
sid:sessionId,
hwid:HWID,
ua:USER_AGENT,
tasks:session.tasks,
nonce:crypto.randomBytes(16).toString('hex')
};
reqPayload.checksum=crypto.createHash('sha256').update(JSON.stringify(reqPayload)).digest('hex');
try{
const resp=await axios.post(`${DELTA_API_BASE}/api/v1/bypass`,reqPayload,{
headers:{
'Content-Type':'application/json',
'User-Agent':USER_AGENT,
'Origin':'https://gateway.platoboost.com',
'Referer':'https://gateway.platoboost.com/',
'X-Requested-With':'XMLHttpRequest'
},
timeout:15000
});
if(resp.data&&resp.data.key){
const keyData={
key:resp.data.key,
created:Date.now(),
expires:Date.now()+3600000,
used:false,
hwid:HWID,
raw:resp.data
};
keysStore.set(resp.data.key,keyData);
return keyData;
}
if(resp.data&&resp.data.success&&resp.data.data){
return resp.data.data;
}
throw new Error('NO_KEY_IN_RESPONSE: '+JSON.stringify(resp.data));
}catch(err){
if(err.response){
throw new Error(`API_ERROR_${err.response.status}: ${JSON.stringify(err.response.data)}`);
}
throw new Error('NETWORK_ERROR: '+err.message);
}
async function bypassAllTasks(targetUrl){
const sessionId=await createBypassSession();
const taskIds=['video_watch','subscribe','survey','human_check'];
for(let i=0;i<taskIds.length;i++){
await spoofTaskCompletion(sessionId,taskIds[i],{
clicked:true,
ad_watched:true,
subscription_confirmed:true,
form_filled:true,
captcha_passed:true,
source:targetUrl
});
await sleep(500);
}
const keyData=await fetchDeltaKey(sessionId);
return keyData;
}
app.use(express.static('public'));
app.use(express.json());
app.get('/api/bypass-delta',async(req,res)=>{
try{
const target=req.query.url||'https://gateway.platoboost.com/a/8';
const keyData=await bypassAllTasks(target);
res.json({
status:'success',
key:keyData.key,
expires_in:3600,
hwid:HWID,
raw:keyData.raw
});
}catch(err){
res.status(500).json({status:'error',message:err.message});
}
});
app.get('/api/keys',(req,res)=>{
const keys=[];
keysStore.forEach((v,k)=>keys.push({key:k,expires:v.expires,used:v.used}));
res.json({total:keys.length,keys});
});
app.get('/api/check-key/:key',(req,res)=>{
const data=keysStore.get(req.params.key);
if(!data)return res.json({valid:false,reason:'NOT_FOUND'});
if(data.expires<Date.now())return res.json({valid:false,reason:'EXPIRED'});
res.json({valid:true,expires:data.expires,used:data.used});
});
app.listen(PORT,()=>{
console.log(`ROCKET Delta Bypass Server running on http://localhost:${PORT}`);
console.log(`Endpoint: GET /api/bypass-delta?url=<target>`);
});