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
  allIcons = allIcons.slice(
    convertedPage * convertedPageSize,
    (convertedPage + 1) * convertedPageSize
  );
  return allIcons;
};

// defining an endpoint to return all ads
app.get("/", async (req, res) => {
  let { search, filter, page, pageSize } = req.query;
  let icons = await getFiles(search, filter, page, pageSize);
  res.send(icons);
});

// starting the server
const server = app.listen(3001, () => {
  const port = server.address().port;
  console.log(`Express is working on port ${port}`);
});
