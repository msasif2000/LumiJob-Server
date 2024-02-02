const cloudinary = require("cloudinary").v2;
const express = require("express");
require("dotenv").config();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const fs = require("fs");

app.use(
  cors({
    origin: ["http://localhost:5173", "https://lumijobs-84d3b.web.app"],
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.apfagft.mongodb.net/`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const dbConnect = async () => {
  try {
    client.connect();
    console.log("DB Connected Successfully✅");
  } catch (error) {
    console.log(error.name, error.message);
  }
};
dbConnect();

const userCollection = client.db("lumijob").collection("users");
const candidateCollection = client.db("lumijob").collection("candidates");
const companyCollection = client.db("lumijob").collection("companies")
const jobPostsCollection = client.db("lumijob").collection("jobPosts");
const seminarsCollection = client.db("lumijob").collection("Seminar");
const blogsCollection = client.db("lumijob").collection("Blogpost");
const bookmarksCollection = client.db("lumijob").collection("bookmarks");

app.get("/", (req, res) => {
  res.send("Welcome to LumiJob");
});

//create user
app.post("/users", async (req, res) => {
  const user = req.body;
  const query = { email: user.email };

  try {
    const existingUser = await userCollection.findOne(query);

    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    const result = await userCollection.insertOne(user);

    res.status(201).json({
      userId: result.insertedId,
      message: "User created successfully",
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

//get user data
app.get("/users/:email", (req, res) => {
  const email = req.params.email;
  const query = { email: email };
  userCollection
    .findOne(query)
    .then((result) => {
      res.send(result);
    })
    .catch((err) => console.log(err));
});

// For Upgrading user role
app.put("/roles/:email", async (req, res) => {
  const email = req.params.email;
  const query = { email: email };
  const role = req.body;
  try {
    const userExist = await userCollection.findOne(query);
    if (!userExist) {
      return res.status(409).send({ message: "User not found" });
    }
    const result = await userCollection.findOneAndUpdate(
      query,
      { $set: role },
      { upsert: true }
    );
    res.status(201).send({ message: "true" });
  } catch (error) {
    res.status(500).send(error);
  }
});

// Check if any role exist
app.get("/check-role/:email", async (req, res) => {
  const email = req.params.email;
  try {
    const user = await userCollection.findOne({ email: email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userRole = user.role || false;
    res.status(200).json({ role: userRole });
  } catch (error) {
    console.error("Error checking user role:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Check what role is the user
app.get("/check-which-role/:email", async (req, res) => {
  const email = req.params.email;
  try {
    const user = await userCollection.findOne({ email: email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const userRole = user.role || false;
    res.status(200).json({ role: userRole });
  } catch (error) {
    console.error("Error checking user role:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/postJob", async (req, res) => {
  const jobPost = req.body;
  const postJob = await jobPostsCollection.insertOne(jobPost);
  res.send(postJob);
});


// update user information in role specific database
app.put("/user-update/:email", async (req, res) => {
  const email = req.params.email;
  const userData = req.body;
  const filter = { email: email };
  const options = { upsert: true };
  console.log(userData)

  try {
    const userExist = await userCollection.findOne(filter);
    let result;
    if (!userExist) {
      return res.status(404).send({ message: "User not found" });
    }
    else if (userData.role === 'candidate') {
      result = await candidateCollection.findOneAndUpdate(
        filter,
        { $set: userData },
        options
      );
    } else if (userData.role === 'company') {
      result = await companyCollection.findOneAndUpdate(
        filter,
        { $set: userData },
        options
      );
    } else {
      return res.status(400).send({ message: "Invalid role specified" });
    }

    res.send({ message: "true" });
    console.log(result);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

// Update user profile photo
app.post("/update-photo/:email", upload.single("photo"), async (req, res) => {
  const email = req.params.email;

  try {
    const userExist = await userCollection.findOne({ email: email });

    const role = userExist?.role
    console.log(role)

    if (!userExist) {
      return res.status(404).send({ message: "User not found" });
    }

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "LumiJob",
        quality: "auto:good",
        fetch_format: "auto",
      });

      if (role === 'candidate') {
        const updatedUser = await candidateCollection.findOneAndUpdate(
          { email: email },
          { $set: { photo: result.secure_url } },
          { upsert: true }
        );
      }
      else if (role === 'company') {
        const updatedUser = await companyCollection.findOneAndUpdate(
          { email: email },
          { $set: { photo: result.secure_url } },
          { upsert: true }
        );
      }

      const updatedUser = await userCollection.findOneAndUpdate(
        { email: email },
        { $set: { photo: result.secure_url } },
        { upsert: true }
      );

      fs.unlink(req.file.path, (unlinkError) => {
        if (unlinkError) {
          console.error("Error deleting temporary file:", unlinkError);
        }
      });

      res.send({ message: true });
      console.log(updatedUser);
    } else {
      res.status(400).send({ message: "No photo provided" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

// get specific user data from candidates collection
app.get('/specific-candidate/:email', async (req, res) => {
  const email = req.params.email;
  try {
    const result = await candidateCollection.findOne({ email: email })
    res.status(200).send(result)
  }
  catch (error) {
    res.send({ message: 'Failed' })
  }
})



//get seminars data
app.get("/seminars", async (req, res) => {
  const seminars = await seminarsCollection.find({}).toArray();
  res.send(seminars);
});

//get blog data
app.get("/blogs", async (req, res) => {
  const blogs = await blogsCollection.find({}).toArray();
  res.send(blogs);
});

app.get("/single-blog/:id", async (req, res) => {
  const id = req.params.id;
  console.log("Received params:", req.params);
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    return res.status(400).send({ message: 'Invalid ObjectId' });
  }
  const query = { _id: new ObjectId(id) };
  try {
    const blogs = await blogsCollection.findOne(query);
    res.send(blogs);
  }
  catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

// Get user for profile
app.get("/user-profile/:email", async (req, res) => {
  const email = req.params.email;
  const query = { email: email };
  try {
    const existingUser = await userCollection.findOne(query);
    if (!existingUser) {
      return res.status(404).send({ message: "User not found" });
    }


    const user = await userCollection.findOne(query);
    res.send(user);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

//get job post data
app.get("/all-job-posts", async (req, res) => {
  const jobPosts = await jobPostsCollection.find({}).toArray();
  res.send(jobPosts);
});

/// search functionality
app.get("/job-Search", async (req, res) => {
  const filter = req.query;
  const query = {
    title: { $regex: filter.search, $options: "i" },
  };
  try {
    const userExist = await jobPostsCollection.findOne(query);
    if (!userExist) {
      return res.status(409).send({ message: "User not found" });
    }
    const cursor = jobPostsCollection.find(query);
    const result = await cursor.toArray();
    res.status(201).send(result);
  } catch (error) {
    res.status(500).send(error);
  }
});

//################## Job filter Begin #####################

//get filtered job data by category
app.get("/jobs-by-category/:category", async (req, res) => {
  const category = req.params.category;
  const query = { category: category };
  const jobs = await jobPostsCollection.find(query).toArray();
  res.send(jobs);
});

//get filtered job data by date
app.get("/jobs-by-date/:date", async (req, res) => {
  const date = req.params.date;
  const query = { date: date };
  const jobs = await jobPostsCollection.find(query).toArray();
  res.send(jobs);
});

//get filtered job data by job type
app.get("/jobs-by-jobType/:jobType", async (req, res) => {
  const jobType = req.params.jobType;
  const query = { jobType: jobType };
  const jobs = await jobPostsCollection.find(query).toArray();
  res.send(jobs);
});

//get filtered job data by salary
app.get("/jobs-by-salary/:salary", async (req, res) => {
  const salary = req.params.salary;
  const query = { salary: salary };
  const jobs = await jobPostsCollection.find(query).toArray();
  res.send(jobs);
});

//################## Job filter END #####################


// --------------------- job bookmark start ---------------


// app.get("/bookmarks", async (req, res) => {
//   const bookmarks = await bookmarksCollection.find({}).toArray();
//   res.send(bookmarks);
// });


app.get('/bookmarks', async (req, res) => {
  const email = req.query.email;
  const query = { email: email };
  const result = await bookmarksCollection.find(query).toArray();
  res.send(result);
});

app.post('/bookmarks', async (req, res) => {
  const bookmarkItem = req.body;
  const result = await bookmarksCollection.insertOne(bookmarkItem);
  res.send(result);
});

app.delete('/bookmarks/:id', async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) }
  const result = await bookmarksCollection.deleteOne(query);
  res.send(result);
})


// ----------------------job bookmark end------------------

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
