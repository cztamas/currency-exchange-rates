"use strict";

const express = require("express");
const path = require("path");

const port = 9872;

const app = express();

app.use("/", express.static(path.join(__dirname, "public")));

app.listen(port, console.log(`Client is available at http://localhost:${port}`));