const express = require("express");
require("dotenv").config();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const port = process.env.PORT || 5000;


app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174", "https://lumijobs-84d3b.web.app", "https://lumijobs.tech"],
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
const companyCommentsCollection = client.db("lumijob").collection("companyComments");
const jobSectorCollection = client.db("lumijob").collection("jobSector");
const skillSetsCollection = client.db("lumijob").collection("skillSets");
const packageCollection = client.db("lumijob").collection("userPack");

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
// Check what role is the user
app.get("/check-which-role/:email", async (req, res) => {
  const email = req.params.email;
  try {
    const user = await userCollection.findOne({ email: email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // const userRole = user.role || false;
    // res.status(200).json({ role: userRole });
    res.status(200).json(user);
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

// get all candidates from candidateCollection
app.get("/candidates", async (req, res) => {
  const allCandidates = await candidateCollection.find({}).toArray();
  res.send(allCandidates);
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
// company comments for candice
app.post("/sendFeedback", async (req, res) => {
  const sendFeedback = req.body;
  try {
    const postJob = await companyCommentsCollection.insertOne(sendFeedback);
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


// Get matchingJobs data by candidate email
app.get('/matchingJobs', async (req, res) => {
  const email = req.query.email;
  try {
    const candidateSkills = await candidateCollection.findOne({ email }, { projection: { _id: 0, skills: 1 } });

    if (!candidateSkills) {
      return res.status(404).json({ message: 'Candidate not found with that email' });
    }

    const matchingJobs = await jobPostsCollection.find({
      requiredSkills: { $in: candidateSkills.skills }
    }).toArray();

    if (matchingJobs.length > 0) {
      res.json(matchingJobs);
    } else {
      res.status(404).json({ message: 'No Matching Jobs found for the candidate' });
    }
  } catch (error) {
    console.error('Error finding Matching Jobs:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});





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


// specific company by their id (used in company detail which will be open for all user)

app.get("/company-profile/:id", async (req, res) => {
  const id = req.params.id;
  // console.log("Received params:", req.params);
  const query = { _id: new ObjectId(id) };
  try {
    const result = await companyCollection.findOne(query);
    res.send(result);
  }
  catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});
// job post apply session
app.get("/jobInfo/:id", async (req, res) => {
  const id = req.params.id;
  console.log("Received params:", req.params.id);
  const query = { _id: new ObjectId(id) };
  try {
    const result = await jobPostsCollection.findOne(query);
    res.send(result);
  }
  catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

// company feedback get
app.get("/companyFeedback/:id", async (req, res) => {
  const id = req.params.id;
  //console.log("Received params:", req.params.id);
  const query = { jobId: id };
  try {
    const result = await companyCommentsCollection.findOne(query);
    res.send(result);
  }
  catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});


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
  const emails = req.body.candidate;
  const jobId = job.jobId;

  try {
    const user = await userCollection.findOne({ email: emails });
    const canUserApply = user ? user.canApply : 0;

    const applied = await applyJobsCollection.countDocuments({ candidate: emails });
    const alreadyExist = await applyJobsCollection.findOne({ candidate: emails, jobId: jobId });

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    } else if (applied >= canUserApply) {
      return res.status(200).send({ message: "Please update subscription" });
    } else if (alreadyExist) {
      return res.status(200).send({ message: "Already applied" });
    } else {

      const findJob = await jobPostsCollection.findOne({ _id: new ObjectId(jobId) })
      // console.log('job is found', findJob)

      if (!findJob.applicants) {
        findJob.applicants = [];
      }
      const alreadyApplied = findJob.applicants.some(applicant => applicant.email === emails);
      if (alreadyApplied) {
        return res.status(200).send({ message: "You have already applied for this job" });
      }
      console.log(alreadyApplied)

      const userDetails = await candidateCollection.findOne({ email: emails })
      const resume = userDetails?.resume

      if (!userDetails) {
        return res.send({ message: 'Please fill profile information' })
      } else if (!resume) {
        return res.send({ message: 'Please upload a resume' })
      }

      const id = userDetails?._id
      const email = userDetails?.email
      const name = userDetails?.name
      const profile = userDetails?.photo
      const city = userDetails?.city
      const country = userDetails?.country
      const position = userDetails?.position
      const premium = userDetails?.status
      const minSalary = userDetails?.salaryRangeMin
      const maxSalary = userDetails?.salaryRangeMax
      const appliedTime = new Date()
      const dndStats = 'applicant'

      findJob.applicants.push({ id, email, name, profile, city, country, position, premium, minSalary, maxSalary, appliedTime, dndStats, resume });

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

// get applied job data access from particular company 

app.get('/get-applied-jobs-com/:email', async (req, res) => {
  const email = req.params.email;
  const query = { email: email }
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
// company profile posted jobs
app.get(`/company-postedJobs/:email`, async (req, res) => {
  const email = req.params.email;
  const query = { email: email };
  try {
    const result = await jobPostsCollection.find(query).toArray();
    res.send(result);
  }
  catch (error) {
    res.status(404).send({ message: error })
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


//post the Seminar data
app.post("/post-the-seminar", async (req, res) => {
  const seminar = req.body;
  try {
    const postSeminar = await seminarsCollection.insertOne(seminar);
    res.send(postSeminar);
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

//get seminar by company 
app.get("/get-posted-Seminars/:email", async (req, res) => {
  const email = req.params.email;
  const query = { email: email };
  try {
    const result = await seminarsCollection.find(query).toArray();
    res.send(result);
  }
  catch (error) {
    res.send(error)
  }
})

//delete seminar
app.delete('/delete-seminar/:id', async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) }
  const result = await seminarsCollection.deleteOne(query);
  res.send(result);
})

//post blog data
app.post("/post-the-blog", async (req, res) => {
  const blog = req.body;
  try {
    const postBlog = await blogsCollection.insertOne(blog);
    res.send(postBlog);
  }
  catch (error) {
    res.send(error)
  }
})

//update blog data
app.patch('/update-blog/:id', async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) }
  const update = req.body;
  try {
    const result = await blogsCollection.findOneAndUpdate(query, { $set: update });
    res.send(result);
  }
  catch (error) {
    res.send(error)
  }
})
//get blog data
app.get("/blogs", async (req, res) => {
  const blogs = await blogsCollection.find({}).toArray();
  res.send(blogs);
});

//get blog by company
app.get("/get-posted-blogs/:email", async (req, res) => {
  const email = req.params.email;
  const query = { email: email };
  try {
    const result = await blogsCollection.find(query).toArray();
    res.send(result);
  }
  catch (error) {
    res.send(error)
  }
})

//delete blog
app.delete('/delete-blog/:id', async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) }
  const result = await blogsCollection.deleteOne(query);
  res.send(result);
})

//get single blog data
app.get("/single-blog/:id", async (req, res) => {
  const id = req.params.id;
  console.log("Received params:", req.params);
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


// findCandidate related works --------------------

app.get('/all-candidate-data', async (req, res) => {
  try {
    const result = (await candidateCollection.find({}).sort({ post_time: -1 }).toArray());
    res.send(result)
  }
  catch (error) {
    res.send({ message: 'Error fetching data' })
  }
})

app.get('/single-candidate/:id', async (req, res) => {
  const id = req.params.id
  const query = { _id: new ObjectId(id) }

  try {
    const result = await candidateCollection.findOne(query)
    res.send(result)
  }
  catch (error) {
    res.send({ message: 'Error fetching data' })
  }

})

// candidate search 

app.get("/candidate-Search", async (req, res) => {
  const filter = req.query;
  const searchRegex = new RegExp(filter.search, 'i');
  const query = {
    $or: [
      { name: { $regex: searchRegex } },
      { position: { $regex: searchRegex } },
      { skills: { $elemMatch: { $regex: searchRegex } } }
    ]
  };

  try {
    const userExist = await candidateCollection.findOne(query);
    if (!userExist) {
      return res.status(409).send({ message: "User not found" });
    }
    const cursor = candidateCollection.find(query);
    const result = await cursor.toArray();
    res.status(201).send(result);
  } catch (error) {
    res.status(500).send(error);
  }
});



// find candidate related code end -------------------



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

app.get('/company', async (req, res) => {
  const email = req.query.email;
  const query = { email: email }
  try {
    const result = await companyCollection.findOne(query)
    res.send(result)
    console.log("email", email)
  }
  catch (error) {
    res.send(error)
    console.log(error);
  }
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
  const canPost = req.body.canPost;
  const canApply = req.body.canApply;
  const email = req.body.email;
  const package = req.body.package;
  const status = req.body.userStatus
  const options = { upsert: true }
  const role = req.body.userRole
  try {
    const paymentResult = await subscriptionCollection.insertOne(payment);

    const del = await temporaryCollection.deleteOne({ user: email });


    if (role === 'company') {
      const updateUser = await userCollection.findOneAndUpdate(
        { email: email },
        { $set: { status, package, canPost } },
        options
      );
    }
    else {
      const updateUser = await userCollection.findOneAndUpdate(
        { email: email },
        { $set: { status, package, canApply } },
        options
      );
    }

    let update;
    if (role === 'company') {
      update = await companyCollection.findOneAndUpdate({ email: email }, { $set: { status, package } }, options);

    } else if (role === 'candidate') {
      update = await candidateCollection.findOneAndUpdate({ email: email }, { $set: { status, package } }, options);

    } else {
      console.log('not upgraded');
    }

    res.send({ paymentResult });
  }
  catch (error) {
    console.log(error)
    res.send(error)
  }
});



app.post('/subscription', async (req, res) => {
  const data = req.body;
  const email = req.body.user;
  const query = { user: email }
  try {

    const exist = await temporaryCollection.findOne(query)

    if (exist) {
      res.send({ message: 'already have selected plan' })
    }
    else {

      const store = await temporaryCollection.insertOne(data)
      res.send({ message: 'data inserted' })
      // console.log(store)
    }
  }
  catch (error) {
    res.send(error)
  }
})

// get subscription details in payment page
app.get('/get-subs-details/:email', async (req, res) => {
  const email = req.params.email;
  const query = { user: email }
  try {
    const result = await temporaryCollection.findOne(query)
    res.send(result)
    // console.log(result)
  }
  catch (error) {
    res.send(error)
  }
})

// recreating the whole payment info logic info (start)


app.get('/packages/company', async (req, res) => {
  const packages = await packageCollection.find({ role: "company" }).toArray();
  if (!packages || packages.length === 0) {
    return res.status(404).json({ error: 'Packages not found for companies' });
  }
  res.send(packages);
});

app.get('/packages/candidate', async (req, res) => {
  const packages = await packageCollection.find({ role: "candidate" }).toArray();
  if (!packages || packages.length === 0) {
    return res.status(404).json({ error: 'Packages not found for candidates' });
  }
  res.send(packages);
});

app.get('/subscriptions/:planId', async (req, res) => {
  const { planId } = req.params;
  const query = { _id: new ObjectId(planId) };
  const subscription = await packageCollection.findOne(query);
  res.send(subscription);
});


// ----
// ----
// recreating the whole payment info logic info (end)



app.get('/payment/:email', async (req, res) => {
  const email = req.params.email;
  try {
    const result = await subscriptionCollection.findOne({ email: email })
    res.status(200).send(result)
  }
  catch (error) {
    res.send({ message: 'Failed' })
  }
})


// get payment info

app.get('/payment', async (req, res) => {
  try {
    const result = await subscriptionCollection.find().toArray();
    res.send(result);
  }
  catch (error) {
    res.send(error)
  }
})



app.delete('/delete-subs-plan/:id', async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) }
  try {
    const result = await temporaryCollection.deleteOne(query)
    res.send(result)
    console.log(result)
  }
  catch (error) {
    res.send(error)
  }
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});


// Apis for dnd data fetching
app.get('/dnd-applicants/:id', async (req, res) => {
  const id = req.params.id;

  try {
    const job = await jobPostsCollection.findOne({ _id: new ObjectId(id) });

    if (job) {
      const applicants = job.applicants.filter(applicant => applicant.dndStats === 'applicant');
      res.send(applicants);
    } else {
      res.status(404).send('Job not found');
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
});


app.get('/dnd-pre-select/:id', async (req, res) => {
  const id = req.params.id;

  try {
    const job = await jobPostsCollection.findOne({ _id: new ObjectId(id) });

    if (job) {
      const preSelectedApplicants = job.applicants.filter(applicant => applicant.dndStats === 'pre-selected');
      res.send(preSelectedApplicants);
    } else {
      res.status(404).send('Job not found');
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
});


app.get('/dnd-interview/:id', async (req, res) => {
  const id = req.params.id;

  try {
    const job = await jobPostsCollection.findOne({ _id: new ObjectId(id) });

    if (job) {
      const interviewApplicants = job.applicants.filter(applicant => applicant.dndStats === 'interview');
      res.send(interviewApplicants);
    } else {
      res.status(404).send('Job not found');
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/dnd-selected/:id', async (req, res) => {
  const id = req.params.id;

  try {
    const job = await jobPostsCollection.findOne({ _id: new ObjectId(id) });

    if (job) {
      const selectedApplicants = job.applicants.filter(applicant => applicant.dndStats === 'selected');
      res.send(selectedApplicants);
    } else {
      res.status(404).send('Job not found');
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
});


app.get('/selectedApplicants', async (req, res) => {
  const { companiEmail } = req.query;
  try {
    const pipeline = [
      { $match: { email: companiEmail, "applicants.dndStats": "selected" } },
      { $unwind: "$applicants" },
      { $match: { "applicants.dndStats": "selected" } },
      {
        $group: {
          _id: "$applicants.id",
          email: { $first: "$applicants.email" },
          name: { $first: "$applicants.name" },
          profile: { $first: "$applicants.profile" },
          city: { $first: "$applicants.city" },
          country: { $first: "$applicants.country" },
          position: { $first: "$applicants.position" },
          premium: { $first: "$applicants.premium" },
          minSalary: { $first: "$applicants.minSalary" },
          maxSalary: { $first: "$applicants.maxSalary" },
          appliedTime: { $first: "$applicants.appliedTime" },
          dndStats: { $first: "$applicants.dndStats" }
        }
      }
    ];

    const selectedApplicants = await jobPostsCollection.aggregate(pipeline).toArray();
    res.send(selectedApplicants);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
});


// for changing status of dnd cards
app.put('/updateApplicantsStatus/:id', async (req, res) => {
  const { id } = req.params;
  const { dndStats, jobId } = req.body;
  console.log(id, jobId, dndStats);

  try {
    const findJob = await jobPostsCollection.findOne({ _id: new ObjectId(jobId) });

    if (!findJob) {
      return res.status(404).json({ error: 'Job not found' });
    }


    const applicantIndex = findJob.applicants.findIndex(applicant => applicant.id.toString() === id);


    if (applicantIndex === -1) {
      return res.status(404).json({ error: 'Applicant not found' });
    }


    findJob.applicants[applicantIndex].dndStats = dndStats;


    await jobPostsCollection.updateOne(
      { _id: new ObjectId(jobId), "applicants.id": new ObjectId(id) },
      { $set: { "applicants.$.dndStats": dndStats } }
    );

    const appliedJobsStats = await applyJobsCollection.findOneAndUpdate({ jobId: jobId }, { $set: { status: dndStats } })
    console.log(appliedJobsStats)

    return res.status(200).json({ message: 'Applicant status updated successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});



// Schedule interview
app.post('/schedule-interview', async (req, res) => {
  const data = req.body;
  const jobId = data.jobId;

  // for finding specific applied job of the user
  const applyJobQuery = { _id: jobId }
  const userQuery = { candidate: data.email }

  // for updating schedule interview data
  const interviewDate = data.date
  const interviewTime = data.time
  const googleMeet = data.googleMeetLink

  const scheduleInterview = {
    interviewDate, interviewTime, googleMeet
  }

  try {
    const job = await jobPostsCollection.findOne({ _id: new ObjectId(jobId) });

    if (!job) {
      console.log('Job not found');
      return res.status(404).json({ error: 'Job not found' });
    }

    const applicantIndex = job.applicants.findIndex(applicant => applicant.email === data.email);

    if (applicantIndex === -1) {
      console.log('Applicant not found');
      return res.status(404).json({ error: 'Applicant not found' });
    }

    console.log('Applicant found:', job.applicants[applicantIndex]);

    job.applicants[applicantIndex].scheduleInterview = {
      interviewDate: data.date,
      interviewTime: data.time,
      googleMeet: data.googleMeetLink
    };

    console.log('Updated applicant:', job.applicants[applicantIndex]);

    await jobPostsCollection.updateOne(
      { _id: new ObjectId(jobId) },
      { $set: job }
    );

    const appliedJob = await applyJobsCollection.findOneAndUpdate(
      { ...applyJobQuery, ...userQuery },
      { $set: { "scheduleInterview": scheduleInterview } },
      { new: true }
    );

    console.log(appliedJob)

    console.log('Interview scheduled successfully');
    res.status(200).json({ message: 'Interview scheduled successfully', appliedJob });
  }
  catch (error) {
    console.error('Error scheduling interview:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/delete-jobs-from-candidate', async (req, res) => {
  const data = req.body;
  const id = data.id
  const jobId = data.jobId;
  const user = data.userEmail;

  try {

    await applyJobsCollection.deleteOne({ _id: new ObjectId(id), candidate: user });



    await jobPostsCollection.updateOne(
      { _id: new ObjectId(jobId) },
      { $pull: { applicants: { email: user } } }
    );



    res.send({ message: "true" });
  } catch (error) {
    res.status(500).send(error.message);
  }
});


//job sector post
app.post("/add-job-sector", async (req, res) => {
  const jobSector = req.body;
  try {
    const postJobSector = await jobSectorCollection.insertOne(jobSector);
    res.send(postJobSector);
  }
  catch (error) {
    res.send
  }
});

app.get("/get-sectors", async (req, res) => {
  const sectors = await jobSectorCollection.find({}).toArray();
  res.send(sectors);
});

app.post("/add-skill", async (req, res) => {
  const skill = req.body;
  try {
    const postSkill = await skillSetsCollection.insertOne(skill);
    res.send(postSkill);
  }
  catch (error) {
    res.send
  }
});

app.get("/get-skills", async (req, res) => {
  const skills = await skillSetsCollection.find({}).toArray();
  res.send(skills);
});
app.post('/set-resume', async (req, res) => {
  const data = req.body;
  const user = data.user;
  const resume = data.resume;

  try {
    const result = await candidateCollection.findOneAndUpdate(
      { email: user },
      { $set: { resume: resume } },
      { upsert: true }
    );
    res.send({ message: 'true' });
    // console.log(result)
  } catch (error) {
    res.status(500).send(error);
  }
});