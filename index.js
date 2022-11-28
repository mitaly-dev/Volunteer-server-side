const express = require("express")
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')
require('dotenv').config()
var jwt = require('jsonwebtoken');
const app = express()
const cors = require("cors")
const { JsonWebTokenError } = require("jsonwebtoken");
const auth = require("./auth");
const { urlencoded } = require("express");
require('dotenv').config() 
const port = process.env.PORT || 5000


app.use(cors())
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ojtfupc.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


const verifyJWT=(req,res,next)=>{
   const authHeader = req.headers.authorization 
   if(!authHeader){
      return res.status(401).send({message:'unauthorized user'})
   }
   const token = authHeader.split(' ')[1]
   jwt.verify(token,process.env.TOKEN,function(err,decoded){
      if(err){
         return res.status(403).send({message:'forbidden user'})
      }
      req.decoded = decoded 
      next()
   })
}

async function run(){
    try{
         const categoryCollection = client.db("Volunteer-network").collection("category")
         const volunteercollection = client.db("Volunteer-network").collection("volunteerInfo")
         const addedEventCollection = client.db("Volunteer-network").collection('addedEvent')
         const userRequestCollection = client.db("Volunteer-network").collection('userRequest')
 
        app.post('/jwt',async(req,res)=>{
        const user = req.body 
        if(!user){
            return res.status(401).send("email not found")
        }
        const token = jwt.sign(user,process.env.TOKEN,{expiresIn:"5h"})
        res.send({token})
        })

        app.post('/category',auth,async(req,res)=>{
            const event = req.body 
            const result =await categoryCollection.insertOne(event)
            res.send(result)
            })
     
         app.get("/category",async(req,res)=>{
            const search = req.query.search
            console.log(search)
            if(search){
               const query = {
                  $text : {
                     $search : search
                  }
               }
               let items = await categoryCollection.find(query).toArray()
              return  res.send({
                        status:"true",
                        data:items
                  })
            }
            const size=parseInt(req.query.size)
            const page=parseInt(req.query.page)
            let items = await categoryCollection.find({}).skip(page*size).limit(size).toArray()
            const count = await categoryCollection.count()
             res.send({
                 status:"true",
                 count,
                 data:items
             })
         })

         app.delete("/category/:id",async(req,res)=>{
            const id = req.params.id 
            console.log(id)
            const result = await categoryCollection.deleteOne({_id:ObjectId(id)})
            res.send(result)
            console.log(result)
         })

         app.get('/eventDetails/:id',async(req,res)=>{
            const id = req.params.id 
            const query = {_id:ObjectId(id)}
            const result = await categoryCollection.findOne(query)
            res.send(result)
         })
     
         app.post('/addEvent',async(req,res)=>{
            const eventCart = req.body 
            console.log(eventCart)
            const result = await addedEventCollection.insertOne(eventCart)
            res.send(result)
         })

         app.get('/addEvent',async(req,res)=>{
            const result = await addedEventCollection.find({}).toArray()
            res.send(result)
         })

         
         app.post("/volunteerInfo",async(req,res)=>{
            const volunteer = req.body 
            if(volunteer){
                const result = await volunteercollection.insertOne(volunteer)
                res.send(result)
            }
            else{
                res.send("volunter information not found")
            }
         })

         app.get("/volunteerInfo",auth,async(req,res)=>{
            const result = await volunteercollection.find({}).toArray()
            res.send({
                data:result
            })
         })

         app.delete("/volunteerInfo/:id",verifyJWT,async(req,res)=>{
            const email = req.decoded.email 
            const user = await volunteercollection.findOne({email:email})
            if(user.role=='admin' || user.role=='moderator'){
               const id=req.params.id
               const query = {_id:ObjectId(id)}
               const result = await volunteercollection.deleteOne(query)
              return res.send(result)
            }
            return  res.status(403).send({message:'only admin can access'})
          
         })

        app.put('/user/admin/:id',verifyJWT,async(req,res)=>{
         const email = req.decoded.email 
         const user = await volunteercollection.findOne({email:email})
         if(user.role!=='admin'){
          return res.status(403).send({message:'only admin can access'})
         }
         const id = req.params.id 
         const filter = {_id:ObjectId(id)}
         const options = {upsert : true}
         const updateDoc = {
            $set : {
               role : 'admin'
            }
         }
         const result = await volunteercollection.updateOne(filter,updateDoc,options)
         res.send(result)
        })

        app.put('/user/moderator/:id',verifyJWT,async(req,res)=>{
         const email = req.decoded.email 
         const user = await volunteercollection.findOne({email:email})
         if(user.role!=='admin'){
          return res.status(403).send({message:'only admin can access'})
         }
         const id = req.params.id 
         const filter = {_id:ObjectId(id)}
         const options = {upsert : true}
         const updateDoc = {
            $set : {
               role : 'moderator'
            }
         }
         const result = await volunteercollection.updateOne(filter,updateDoc,options)
         res.send(result)
        })

        app.get('/user/admin',async(req,res)=>{
         const email = req.query.email
         const query = {email:email}
         const user = await volunteercollection.findOne(query)
         res.send({isAdmin:user?.role==='admin'})
        })

        app.get('/user/moderator',async(req,res)=>{
         const email = req.query.email
         const query = {email:email}
         const user = await volunteercollection.findOne(query)
         res.send({isModerator:user?.role==='moderator'})
        })

      
    }
    catch{
 
    } 
 }
 run()


app.listen(port,()=>{
    console.log(`volunteer server is running on ${port}`)
    
})
