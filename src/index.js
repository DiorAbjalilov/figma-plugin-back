// ./src/index.js
// importing the dependencies
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");
const fsp = require("fs/promises");
const res = require("express/lib/response");
const multer = require("multer");

// defining the Express app
const app = express();

app.use("/static", express.static("resources"));

// adding Helmet to enhance your Rest API's security
app.use(helmet());

// using bodyParser to parse JSON bodies into JS objects
app.use(bodyParser.json());

// enabling CORS for all requests
app.use(cors());

// adding morgan to log HTTP requests
app.use(morgan("combined"));

const RESOURSES_PATH = path.join(process.cwd(), "resources");

const getFiles = async (search = "", filter = "", page = 0, pageSize = 100) => {
  let convertedPage = parseInt(page),
    convertedPageSize = parseInt(pageSize);
  let allIcons = [];
  try {
    let categories = await fsp.readdir(RESOURSES_PATH);
    await Promise.all(
      categories.map(async (category) => {
        try {
          let categoryFolders = await fsp.readdir(
            path.join(RESOURSES_PATH, category)
          );
          return await Promise.all(
            categoryFolders
              .filter((e) => e.indexOf(filter) !== -1)
              .map(async (categoryFolder) => {
                try {
                  let icons = await fsp.readdir(
                    path.join(RESOURSES_PATH, category, categoryFolder)
                  );
                  icons
                    .filter((e) => e.indexOf(search) !== -1)
                    .forEach((icon) => {
                      console.log("Pushing ", icon);
                      allIcons.push({
                        name: icon,
                        path: `${category}/${categoryFolder}/${icon}`,
                      });
                    });
                } catch (error) {
                  console.log(
                    `Error in reading category folder: ${categoryFolder}`
                  );
                }
              })
          );
        } catch (error) {
          console.log(`Error in reading category: ${category}`);
        }
      })
    );
  } catch (error) {
    console.log("Error in reading categories");
  }
  let allCount = allIcons.length;
  allIcons = allIcons.slice(
    convertedPage * convertedPageSize,
    (convertedPage + 1) * convertedPageSize
  );
  return { allIcons, allCount };
};

// defining an endpoint to return all ads
app.get("/", async (req, res) => {
  let { search, filter, page, pageSize } = req.query;
  let icons = await getFiles(search, filter, page, pageSize);
  res.send({ icons: icons.allIcons, count: icons.allCount });
});

// get folders
app.get("/folders", async (req, res) => {
  try {
    let categories = await fsp.readdir(RESOURSES_PATH);
    res.send(categories);
  } catch (error) {
    res.send({ error });
  }
});

// get categores
app.get("/category", async (req, res) => {
  try {
    const { folder } = req.query;
    let categoriesFolder = await fsp.readdir(path.join(RESOURSES_PATH, folder));
    res.send(categoriesFolder);
  } catch (error) {
    res.send({ error });
  }
});

// get icons
app.get("/icons", async (req, res) => {
  try {
    let allIcons = [];
    const { folder, category } = req.query;
    let icons = await fsp.readdir(path.join(RESOURSES_PATH, folder, category));
    icons.forEach((item) => {
      allIcons.push({
        name: item,
        path: `${folder}/${category}/${item}`,
      });
    });
    res.send(allIcons);
  } catch (error) {
    res.send({ error });
  }
});
// delete icon
app.delete("/delete", async (req, res) => {
  let { path } = req.query;
  try {
    let pathRemove = RESOURSES_PATH + `/${path}`;
    fs.unlink(pathRemove, (err) => {
      if (err) {
        res.send({
          message: "Could not delete the file. " + err,
        });
      }
      res.send({
        message: "File is deleted.",
      });
    });
  } catch (error) {
    res.send(error);
  }
});

// post upload icon
// const upload = multer({ dest: "resources/arrows/bulk" });
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log(req.query);
    cb(null, `resources/${req.query.path}`);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname + "." + "svg");
  },
});

const upload = multer({ storage: storage });
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    res.send({ success: true, message: "file upload" });
  } catch (error) {
    res.send(error);
  }
});

// starting the server
app.listen(process.env.PORT || 3001, () => {
  console.log("listening on port 3001");
});
