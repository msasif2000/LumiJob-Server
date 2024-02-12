const express = require("express");
require("dotenv").config();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const port = process.env.PORT || 5000;


app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174", "https://lumijobs-84d3b.web.app"],
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());



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

//database collections
const userCollection = client.db("lumijob").collection("users");
const candidateCollection = client.db("lumijob").collection("candidates");
const companyCollection = client.db("lumijob").collection("companies")
const jobPostsCollection = client.db("lumijob").collection("jobPosts");
const seminarsCollection = client.db("lumijob").collection("Seminar");
const blogsCollection = client.db("lumijob").collection("Blogpost");
const bookmarksCollection = client.db("lumijob").collection("bookmarks");
const applyJobsCollection = client.db("lumijob").collection("appliedJobs");
const subscriptionCollection = client.db("lumijob").collection("subscriptions");
const temporaryCollection = client.db("lumijob").collection("temporary");

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

// ----get all user for admin--

app.get("/allUsers", async (req, res) => {
  const allUsers = await userCollection.find({}).toArray();
  res.send(allUsers);
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

//get all user and user by role
app.get('/user', async (req, res) => {
  const role = req.query.role;
  try {
    const query = {};
    if (role) {
      query.role = role
    }
    userCollection.find(query).toArray().then((result) => {
      res.status(200).send(result);
    })
  }
  catch (error) {
    res.send({ message: error.message })
  }
})

// Delete user

app.delete('/delCandidate/:id', async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) }
  const result = await userCollection.deleteOne(query);
  res.send(result);
})

app.post("/postJob", async (req, res) => {
  const jobPost = req.body;
  try {
    const postJob = await jobPostsCollection.insertOne(jobPost);
    res.send(postJob);

  }
  catch (error) {
    res.send(error)
  }
});


app.get('/postJob', async (req, res) => {
  const cursor = jobPostsCollection.find();
  const result = await cursor.toArray();
  res.send(result);
})


app.delete('/postJob/:id', async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) }
  const result = await jobPostsCollection.deleteOne(query);
  res.send(result);
})


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

    const photo = userData.photo;
    const update = await userCollection.findOneAndUpdate(filter, { $set: { photo } }, options);

    res.send({ message: "true" });
    console.log(result);
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

// get specific company data from company collection
app.get('/specific-company/:email', async (req, res) => {
  const email = req.params.email;
  try {
    const result = await companyCollection.findOne({ email: email })
    res.status(200).send(result)
  }
  catch (error) {
    res.send({ message: 'Failed' })
  }
})


// post jobs api because upper api not working
app.post('/post-jobs', async (req, res) => {
  const data = req.body;
  const email = req.body.email
  try {
    const company = await userCollection.findOne({ email: email })
    const canPost = company ? company.canPost : 0;

    const posted = await jobPostsCollection.countDocuments({ email: email })

    if (!company) {
      return res.status(404).send({ message: "Company not found" });
    }
    else if (posted >= canPost) {
      return res.status(200).send({ message: "Please update subscription" });
    }
    else {
      const result = await jobPostsCollection.insertOne(data)
      return res.status(200).send({ message: "Job application successful", insertedId: result.insertedId });
    }
  }
  catch (error) {
    res.send({ message: 'Failed' })
  }
})


// Post users applied jobs to database. and update job collection with userData

app.post('/apply-to-jobs', async (req, res) => {
  const job = req.body;
  const email = req.body.candidate;
  const jobId = req.body.jobId;

  try {
    const user = await userCollection.findOne({ email: email });
    const canUserApply = user ? user.canApply : 0;

    const applied = await applyJobsCollection.countDocuments({ candidate: email });
    const alreadyExist = await applyJobsCollection.findOne({ candidate: email, jobId: jobId });

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    } else if (applied >= canUserApply) {
      return res.status(200).send({ message: "Please update subscription" });
    } else if (alreadyExist) {
      return res.status(200).send({ message: "Already applied" });
    } else {
      // update applicants list 
      const findJob = await jobPostsCollection.findOne({ _id: new ObjectId(jobId) })
      console.log('job is found', findJob)

      if (!findJob.applicants) {
        findJob.applicants = [];
      }
      const alreadyApplied = findJob.applicants.some(applicant => applicant.email === email);
      if (alreadyApplied) {
        return res.status(200).send({ message: "You have already applied for this job" });
      }
      console.log(alreadyApplied)

      const userDetails = await userCollection.findOne({ email: email })
      const profile = userDetails?.photo
      const name = userDetails?.name

      findJob.applicants.push({ email, name, profile, appliedTime: new Date() });
      const result = await jobPostsCollection.updateOne({ _id: new ObjectId(jobId) }, { $set: { applicants: findJob.applicants } });

      if (result.modifiedCount > 0) {
        const insert = await applyJobsCollection.insertOne(job);
        console.log(insert);
        if (insert.insertedId) {
          return res.status(200).send({ message: "Job application successful", insertedId: insert.insertedId });
        } else {
          return res.status(500).send({ message: 'Failed to apply for the job' });
        }
      } else {
        return res.status(500).send({ message: 'Failed to apply for the job' });
      }


    }
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: 'Failed' });
  }
});

// get applied jobs back
app.get('/get-applied-jobs/:email', async (req, res) => {
  const email = req.params.email;
  const query = { candidate: email }
  try {
    const result = await applyJobsCollection.find(query).toArray()
    res.send(result)
  }
  catch (error) {
    res.status(404).send({ message: 'No applied jobs' })
  }
})

app.get(`/get-company-posted-jobs/:email`, async (req, res) => {
  const email = req.params.email;
  const query = { email: email }
  try {
    const result = await jobPostsCollection.find(query).toArray()
    res.send(result)
  }
  catch (error) {
    res.status(404).send({ message: 'error' })
  }
})


// job deleting api for company
app.delete('/delete-job/:id', async (req, res) => {
  const id = req.params.id;
  const querry = { _id: id }
  const query = { _id: new ObjectId(id) }
  // console.log(query)
  try {
    const deleteApplied = await applyJobsCollection.findOneAndDelete(querry)

    const result = await jobPostsCollection.findOneAndDelete(query)
    res.send({ message: 'true' })
  }
  catch (error) {
    res.send(error)
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

//get single blog data
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

//get all job post data
app.get('/all-job-posts', async (req, res) => {
  try {
    const result = (await jobPostsCollection.find({}).sort({ post_time: -1 }).toArray());
    res.send(result)
  }
  catch (error) {
    res.send({ message: 'Error fetching data' })
  }
})

// job filter--

app.get('/filter-job-posts', async (req, res) => {
  try {
    const { sectorType, jobType } = req.query;
    const query = {};

    if (sectorType) {
      // Split the sectorType query parameter into an array if it contains multiple values
      const sectors = typeof sectorType === 'string' ? sectorType.split(',') : sectorType;
      query.sectorType = { $in: sectors };
    }

    if (jobType) {
      const types = typeof jobType === 'string' ? jobType.split(',') : jobType;
      query.jobType = { $in: types };
    }

    const result = await jobPostsCollection.find(query).sort({ post_time: -1 }).toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: 'Error fetching data' });
  }
});



// Get single job for details page
app.get('/single-job/:id', async (req, res) => {
  const id = req.params.id
  const query = { _id: new ObjectId(id) }

  try {
    const result = await jobPostsCollection.findOne(query)
    res.send(result)
  }
  catch (error) {
    res.send({ message: 'Error fetching data' })
  }

})

/// search function
app.get("/job-Search", async (req, res) => {
  const filter = req.query;
  const query = {
    $or: [
      { title: { $regex: filter.search, $options: "i" } },
      { platform: { $regex: filter.search, $options: "i" } }
    ]
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





//-----pagination-----

// pagination api
// app.get('/pagination', async (req, res) => {
//   const page = parseInt(req.query.page);
//   const size = parseInt(req.query.size);

//   const result = await jobPostsCollection.find()
//     .skip(page * size)
//     .limit(size)
//     .toArray();
//   res.send(result)
// })


// app.get('/paginationCount', async (req, res) => {
//   const count = await jobPostsCollection.estimatedDocumentCount()
//   res.send({ count })
// })



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

//get Company data for Admin Panel
app.get('/company-data', async (req, res) => {
  const result = await companyCollection.find({}).toArray();
  res.send(result);
})

app.delete('/delete-company/:id', async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) }
  const result = await companyCollection.deleteOne(query);
  res.send(result);
})

//admin  =  posted jobs delate
app.delete('/delete-jobs/:id', async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) }
  const result = await jobPostsCollection.deleteOne(query);
  res.send(result);
})

//admin  =  posted jobs delate bookmarkCollections
app.delete('/delete-jobs-bookmarks/:id', async (req, res) => {
  const id = req.params.id;
  const query = { userId: id }
  const result = await bookmarksCollection.deleteOne(query);
  res.send(result);
})

//admin  =  posted jobs delate applyJobsCollection
app.delete('/delete-jobs-applyJobsCollection/:id', async (req, res) => {
  const id = req.params.id;
  const query = { jobId: id }
  const result = await applyJobsCollection.deleteOne(query);
  res.send(result);
})



// =======>>> stripe payment <<<=======

// payment intent

app.post("/create-payment-intent", async (req, res) => {
  const { price } = req.body;
  const amount = parseInt(price * 100);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount,
    currency: "usd",
    payment_method_types: ['card']
  })

  res.send({
    clientSecret: paymentIntent.client_secret,
  });
})

// Subscription data insert to database

app.post('/payments', async (req, res) => {
  const payment = req.body;
  const paymentResult = await subscriptionCollection.insertOne(payment);
  res.send({ paymentResult })
})


app.post('/subscription', async(req,res)=>{
  const data = req.body;
  try{
    const store = await temporaryCollection.insertOne(data)
    res.send({message: 'data inserted'})
    console.log(store)
  }
  catch(error){
    res.send(error)
  }
})

app.get('/get-subs-details/:email',async(req,res)=>{
  const email = req.params.email;
  const query = {user: email}
  try{
    const result = await temporaryCollection.findOne(query)
    res.send(result)
    console.log(result)
  }
  catch(error){
    res.send(error)
  }
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
