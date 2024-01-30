const cloudinary = require('cloudinary').v2;
const express = require('express');
require('dotenv').config();
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const fs = require('fs');


app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://lumijobs-84d3b.web.app'
  ]

}));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

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
const seminarsCollection = client.db("lumijob").collection("Seminar");
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
app.put('/user-update/:email', upload.single('photo'), async (req, res) => {
  const email = req.params.email;
  const user = req.body;
  const filter = { email: email };
  const options = { upsert: true };

  try {
    const userExist = await userCollection.findOne(filter);

    if (!userExist) {
      return res.status(404).send({ message: 'User not found' });
    }

    if (req.file) {

      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'LumiJob',
        quality: 'auto:good',
        fetch_format: 'auto',
      });

      user.photo = result.secure_url;
      // console.log(user.photo);

      fs.unlink(req.file.path, (unlinkError) => {
        if (unlinkError) {
          console.error('Error deleting temporary file:', unlinkError);
        }
      });
    }


    const result = await userCollection.findOneAndUpdate(filter, { $set: user }, options);
    res.send({ message: 'true' });
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});



//get seminars data
app.get('/seminars', async (req, res) => {
  const seminars = await seminarsCollection.find({}).toArray();
  res.send(seminars);
})

//get blog data
app.get('/blogs', async (req, res) => {
  const blogs = await blogsCollection.find({}).toArray();
  res.send(blogs);
})


//get job post data
app.get('/all-job-posts', async (req, res) => {
  const jobPosts = await jobPostsCollection.find({}).toArray();
  res.send(jobPosts);
})


//################## Job filter Begin #####################

//get filtered job data by category
app.get('/jobs-by-category/:category', async (req, res) => {
  const category = req.params.category;
  const query = { category: category };
  const jobs = await jobPostsCollection.find(query).toArray();
  res.send(jobs);
})

//get filtered job data by date
app.get('/jobs-by-date/:date', async (req, res) => {
  const date = req.params.date;
  const query = { date: date };
  const jobs = await jobPostsCollection.find(query).toArray();
  res.send(jobs);
})

//get filtered job data by job type
app.get('/jobs-by-jobType/:jobType', async (req, res) => {
  const jobType = req.params.jobType;
  const query = { jobType: jobType };
  const jobs = await jobPostsCollection.find(query).toArray();
  res.send(jobs);
})

//get filtered job data by salary
app.get('/jobs-by-salary/:salary', async (req, res) => {
  const salary = req.params.salary;
  const query = { salary: salary };
  const jobs = await jobPostsCollection.find(query).toArray();
  res.send(jobs);
})

//################## Job filter END #####################

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
})