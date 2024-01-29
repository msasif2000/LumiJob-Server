const express = require('express');
require('dotenv').config();
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://lumijobs-84d3b.web.app'
  ]

}));
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.apfagft.mongodb.net/`
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


const dbConnect = async () => {
  try {
    client.connect()
    console.log('DB Connected Successfully✅')
  } catch (error) {
    console.log(error.name, error.message)
  }
}
dbConnect()

const userCollection = client.db("lumijob").collection("users");
const jobPostsCollection = client.db("lumijob").collection("jobPosts");
const seminersCollection = client.db("lumijob").collection("Seminar");
const blogsCollection = client.db("lumijob").collection("Blogpost");

app.get('/', (req, res) => {
  res.send('Welcome to LumiJob');
})

//create user
app.post('/users', async (req, res) => {
  const user = req.body;
  const query = { email: user.email };

  try {
    const existingUser = await userCollection.findOne(query);

    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const result = await userCollection.insertOne(user);

    res.status(201).json({ userId: result.insertedId, message: 'User created successfully' });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

//get user data
app.get('/users/:email', (req, res) => {
  const email = req.params.email;
  const query = { email: email };
  userCollection.findOne(query)
    .then(result => {
      res.send(result);
    })
    .catch(err => console.log(err))
})

// For Upgrading user role
app.put('/roles/:email', async (req, res) => {
  const email = req.params.email
  const query = { email: email }
  const role = req.body;
  try {
    const userExist = await userCollection.findOne(query);
    if (!userExist) {
      return res.status(409).send({ message: 'User not found' })
    }
    const result = await userCollection.findOneAndUpdate(query, { $set: role }, { upsert: true })
    res.status(201).send({ message: 'true' })
  } catch (error) {
    res.status(500).send(error)

  }
})

// Check if any role exist
app.get('/check-role/:email', async (req, res) => {
  const email = req.params.email;
  try {
    const user = await userCollection.findOne({ email: email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userRole = user.role || false;
    res.status(200).json({ role: userRole });
  } catch (error) {
    console.error('Error checking user role:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Check what role is the user
app.get('/check-which-role/:email', async (req, res) => {
  const email = req.params.email;
  try {
    const user = await userCollection.findOne({ email: email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const userRole = user.role || false;
    res.status(200).json({ role: userRole });
  } catch (error) {
    console.error('Error checking user role:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
})


app.post('/postJob', async (req, res) => {
  const jobPost = req.body;
  const postJob = await jobPostsCollection.insertOne(jobPost);
  res.send(postJob);
})

// update user info
app.put('/user-update/:email', async (req, res) => {
  const email = req.params.email
  const user = req.body
  const filter = { email: email }
  const options = { upsert: true }
  try {
    const userExist = await userCollection.findOne(filter)
    if (!userExist) {
      return res.status(404).send({ message: 'User not found' })
    }
    const result = await userCollection.findOneAndUpdate(filter, { $set: user }, options)
    res.send({ message: 'true' })
  }
  catch (error) {
    res.status(500).send(error)
  }
})

// Get seminers
app.get('/get-all-seminars', async (req, res) => {
  const query = {}
  try {
    const result = await seminersCollection.find(query).toArray()
    res.send(result)
  }
  catch (error) {
    console.log(error)
    res.send({ message: error })
  }
})
// Get blogs
app.get('/get-all-blogs', async (req, res) => {
  const query = {}
  try {
    const result = await blogsCollection.find(query).toArray()
    res.send(result)
  }
  catch (error) {
    console.log(error)
    res.send({ message: error })
  }
})



app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
})