require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const parser = require("body-parser");
const { MongoClient } = require("mongodb");
const dns = require("node:dns");
const url = require("node:url");


// Basic Configuration
const port = process.env.PORT || 3000;
const client = new MongoClient(process.env.MONGO_URI);
const db_url = client.db("urlshortener").collection("url");

app.use(parser.urlencoded({ extended: false }));
app.use(parser.json());

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.post("/api/shorturl", (req, res) => {
  const dnslookup = dns.lookup(
    url.parse(req.body.url).hostname,
    async (err, address) => {
      //check if valid url
      if (!address) {
        res.json({ error: "invalid url" });
      } else {
        //upload to db
        const db_count = await db_url.countDocuments({})
        const urlObj = {
          "url": req.body.url,
          "short_url": db_count
        } 
        const update_db = await db_url.insertOne(urlObj)
        console.log(urlObj);
        res.json({
          "original_url": req.body.url,
          "short_url": db_count
        })
      }
    }
  );
});

app.get("/api/shorturl/:shorturl?", async(req,res)=>{
  const short_url = req.params.shorturl
  const db_Obj = await db_url.findOne({short_url: +short_url})
  res.redirect(db_Obj.url)
  console.log(`redirected to ${db_Obj.url}`)
})

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
