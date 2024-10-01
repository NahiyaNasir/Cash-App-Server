require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");

const app = express();

const cors = require("cors");
const port = process.env.PORT || 8000;
const bcrypt = require("bcrypt");

app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.get("/", (req, res) => {
  res.send("cash app is running");
});

const { MongoClient, ServerApiVersion } = require("mongodb");
const { status } = require("init");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.gze7wpc.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  const userCollection = client.db("ek_pay").collection("users");

  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    // app.get("/role/:email", async (req, res) => {
    //   const email = req.params.email;
    //   const user = await userCollection.findOne({ email: email });
    //   res.send(user);
    //   console.log(user);
    // });

    //   verify token
    const verifyToken = (req, res, next) => {
      if (!req.headers.authorization) {
        return res.status(403).send({ message: "Forbidden access" });  // Add 'return' here
      }
    
      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decode) => {
        if (err) {
          return res.status(401).send({ message: "Unauthorized access" });  // Add 'return' here
        }
    
        req.decoded = decode;
        next();
      });
    };
    


    app.get("/userInfo", verifyToken, async (req, res) => {
      user = req.decoded;
      // console.log(user);
      const result = await userCollection.findOne({ email: req.decoded.email });
      // console.log(result);
      res.send(result);
  });
    // jwt
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      // console.log(user);
      const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET );
      res.send({ token });
    });
    //  role based api
 
    app.get("/role/:email", async (req, res) => {
      try {
        const { email } = req.params;
        const user = await userCollection.findOne({ email });
        
        // Check if user exists
        if (!user) {
          return res.status(404).send({ message: "User not found" });
        }
    
        // Extract the role if the user exists
        const { role } = user;
        console.log(role);
        return res.send({ role });  // Ensure the response is sent in a proper format
      } catch (error) {
        console.log(error);
        return res.status(500).send({ message: "Internal server error" });
      }
    });
    

  
    //  create user
    app.post("/createUser", async (req, res) => {
      const user = req.body;
      const hashPin = bcrypt.hashSync(user.pin, 10);
    
      const isExiting = await userCollection.findOne({ email: user.email });
      if (isExiting) {
        return res.send({ message: "User already exists" });  // Add 'return' here
      }
    
      const doc = {
        ...user,
        pin: hashPin,
      };
    
      const result = await userCollection.insertOne(doc);
      return res.send(result);  // Add 'return' here as well to ensure no more code runs after sending the response
    });
    


    //  login user check

    app.post("/login/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const pin = req.body.pin;
        const user = await userCollection.findOne({ email });
    
        // User does not exist
        if (!user) {
          return res.status(403).send({ message: "Invalid credentials", status: "403" });
        }
    
        // Pin does not match
        const pinMatching = bcrypt.compareSync(pin, user.pin);
        if (!pinMatching) {
          return res.status(403).send({ message: "Invalid credentials", status: "403" });
        }
    
        // If everything is fine, return the user object
        return res.send(user);
      } catch (error) {
        console.log(error);
        // Sending an error response
        return res.status(500).send({ message: "Internal server error" });
      }
    });
    ;
    

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`
   cash app  is running at ${port}`);
});
