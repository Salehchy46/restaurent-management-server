const express = require('express');
const cors = require('cors');
const app = express();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

//middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://console.firebase.google.com/project/restaurent-management-client/overview',
    'https://restaurent-management-client.web.app',
  ],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

//distinctive middleware 
const logger = (req, res, next) => {
  console.log('Something to verify.');
  next();
}

const verifyToken = (req, res, next) => {
  console.log('verify');

  const token = req?.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: "Unauthorized Access" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decode) => {
    if (err) {
      return res.status(401).send({ message: 'Unauthorized Access' })
    }
    req.user = decode;
    console.log('Decoded Token:', decode);
    next();
  })
}

// uSER
// pASSWORD

console.log(process.env.DB_USER);


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.vu0s8qh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    const foodCollection = client.db('restaurentManagement').collection('foodMenu');
    const contactCollection = client.db('restaurentManagement').collection('contacts');
    const ordersCollection = client.db('restaurentManagement').collection('orders');

    //Auth related API's
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1hr' })
      res
        .cookie('token', token, {
          httpOnly: true,
          secure: false,
          // sameSite: false,
        })
        .send({ success: true });
    })

    app.post('/logout', (req, res) => {
      res.clearCookie('token', {
        httpOnly: true,
        secure: false,
      })
        .send({ success: true })
    })

    app.get('/menu', verifyToken, async (req, res) => {
      const items = req.query;
      const cursor = foodCollection.find(items);
      const result = await cursor.toArray();
      res.send(result);
    })

    app.get('/menuByPage', async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);

      console.log('pagination', page, size);
      const result = await foodCollection.find()
        .skip(page * size)
        .limit(size)
        .toArray();
      
      res.send(result);
    })

    app.get('/productPages', async(req, res) => {
      const count = await foodCollection.estimatedDocumentCount();
      res.send({ count })
    })

    app.get('/menu/:id', verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodCollection.findOne(query);
      res.send(result);
    })

    app.post('/productsByIds', async(req, res) => {
      const ids = req.body;
      const idsWithObjectId = ids.map(id => new ObjectId(id))
      console.log(idsWithObjectId);

      const query = {
        _id : {
          $in : idsWithObjectId
        }
      }

      const result = await ordersCollection.find(query).toArray();
      res.send(result);
    })

    app.post('/contactus', logger, verifyToken, async (req, res) => {
      const message = req.body;
      const result = await contactCollection.insertOne(message);
      res.send(result);
    })

  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('The Chefs are cooking, Come and take your food.');
})

app.listen(port, () => {
  console.log(`Foods are waiting at Chef's hand: ${port}`);
})