const express = require("express");

const db = require("./data/dbConfig.js");

const server = express();

server.use(express.json());

// GET all accounts
server.get("/", async (req, res) => {
  const { limit, sortby, sortdir } = req.query;

  if (limit && !sortby) {
    try {
      const accounts = await db("accounts").limit(limit);
      res.status(200).json(accounts);
    } catch (err) {
      res.status(500).json("Error", err);
    }
  } else if (!limit && sortby) {
    try {
      const accounts = await db("accounts").orderBy(sortby, sortdir);
      res.status(200).json(accounts);
    } catch (err) {
      res.status(500).json("Error", err);
    }
  } else if (limit && sortby) {
    try {
      const accounts = await db("accounts")
        .orderBy(sortby, sortdir)
        .limit(limit);
      res.status(200).json(accounts);
    } catch (err) {
      res.status(500).json("Error", err);
    }
  } else {
    try {
      const accounts = await db("accounts");
      res.status(200).json(accounts);
    } catch (err) {
      res.status(500).json("Error", err);
    }
  }
});

// GET account by ID
server.get("/:id", validateAccountId, (req, res) => {
  res.status(200).json(req.account);
});

// POST (Create) account
server.post("/", validateAccount, (req, res) => {
  const newAccount = { name: req.name, budget: req.budget };

  db("accounts")
    .insert(newAccount)
    .then(async ([id]) => {
      const account = await db("accounts")
        .where({ id })
        .first();

      res.status(200).json(account);
    })
    .catch(err => {
      console.log("Error: ", err);
      res.status(500).json({ message: "Exception", err });
    });
});

// PUT (Update) account
server.put("/:id", validateAccountId, validateAccount, (req, res) => {
  const changes = { name: req.name, budget: req.budget };
  const { id } = req.account;

  db("accounts")
    .where({ id })
    .update(changes)
    .then(async () => {
      const account = await db("accounts")
        .where({ id })
        .first();

      res.status(200).json(account);
    })
    .catch(err => {
      console.log("Error: ", err);
      res.status(500).json({ message: "Exception", err });
    });
});

// DELETE account
server.delete("/:id", validateAccountId, (req, res) => {
  const { account } = req;
  const { id } = account;

  db("accounts")
    .where({ id })
    .del()
    .then(async () => {
      const accounts = await db("accounts");

      res.status(200).json({ deletedAccount: account, accounts });
    })
    .catch(err => {
      console.log("Error: ", err);
      res.status(500).json({ message: "Exception", err });
    });
});

// custom middleware
function validateAccount(req, res, next) {
  const { body } = req;
  const { name, budget } = body;

  Object.keys(body).length !== 0
    ? !name || !budget
      ? res.status(400).json({ errorMessage: "Missing name or budget info" })
      : ((req.name = name), (req.budget = budget), next())
    : res.status(400).json({ message: "Missing user data." });
}

async function validateAccountId(req, res, next) {
  const { id } = req.params;
  const account = await db("accounts")
    .where({ id })
    .first();

  try {
    account
      ? ((req.account = account), next())
      : res.status(404).json({ message: "Account id does not exists." });
  } catch (err) {
    res.status(500).json({ message: "Exception", err });
  }
}

module.exports = server;
