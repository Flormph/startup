//const dns = require('dns');
//dns.setServers(['8.8.8.8', '8.8.4.4']);

const { MongoClient } = require('mongodb');
const config = require('./dbConfig.json');

const url =
    `mongodb+srv://${config.userName}:${config.password}@${config.hostname}/?appName=Gedidone`;

const client = new MongoClient(url);
const db = client.db('gedidone');
const userCollection = db.collection('user');
const noteCollection = db.collection('note');
const axolotlStatsCollection = db.collection('axolotlStats');

(async function testConnection() {
    try {
        await db.command({ ping: 1 });
        console.log(`DB connected to ${config.hostname} successfully.`);
    } catch (ex) {
        console.log(`Connection failed to ${url} because ${ex.message}.`);
        process.exit(1);
    }
})();

function getUser(email) {
    return userCollection.findOne({ email: email });
}

function getUserByToken(token) {
    return userCollection.findOne({ token: token });
}

function getNotesByUser(user) {
    return noteCollection.find({ userId: user._id }).toArray();
}

function getAxolotlStatsByUser(user) {
    return axolotlStatsCollection.findOne({ userId: user._id });
}

async function createUser(user) {
    await userCollection.insertOne(user);
    return user;
}

async function createNote(note) {
    await noteCollection.insertOne(note);
    return note;
}

async function createAxolotlStats(stats) {
    await axolotlStatsCollection.insertOne(stats);
    return stats;
}

async function updateUser(user) {
    await userCollection.updateOne({ email: user.email }, { $set: user });
}

async function updateUserRemoveAuth(user) {
    await userCollection.updateOne({ email: user.email }, { $unset: { token: 1 } });
}

async function updateNote(note) {
    await noteCollection.updateOne({ _id: note._id }, { $set: note });
}

async function removeNote(note) {
    await noteCollection.deleteOne({ _id: note._id });
}

async function updateAxolotlStats(stats) {
    await axolotlStatsCollection.updateOne({ userId: stats.userId }, { $set: stats });
}

async function removeAxolotlStats(stats) {
    await axolotlStatsCollection.deleteOne({ userId: stats.userId });
}

module.exports = {
    getUser,
    getUserByToken,
    getNotesByUser,
    getAxolotlStatsByUser,
    createUser,
    updateUser,
    updateUserRemoveAuth,
    createNote,
    createAxolotlStats,
    updateNote,
    removeNote,
    updateAxolotlStats,
    removeAxolotlStats
};