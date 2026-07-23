const express = require('express');
const app = express();

const port = process.argv.length > 2 ? process.argv[2] : 3000;

const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const uuid = require('uuid');

const authCookieName = "token";

app.use(express.json());
app.use(cookieParser());

let users = [];
let notes = [];
let axolotlStats = [];

let apiRouter = express.Router();
app.use('/api', apiRouter);

app.listen(port, () => {
    console.log(`Gedidone service listening on port ${port}`);
});

// CreateAuth creates a new user
apiRouter.post('/auth/create', async (req, res) => {
    if (await findUser('email', req.body.email)) {
        res.status(409).send({ msg: 'Existing user' });
    } else {
        const user = await createUser(req.body.email, req.body.password);
        createPetStats(user.id, req.body.petName);

        setAuthCookie(res, user.token);
        res.send({ email: user.email });
    }
});

// GetAuth login an existing user
apiRouter.post('/auth/login', async (req, res) => {
    const user = await findUser('email', req.body.email);
    if (user) {
        if (await bcrypt.compare(req.body.password, user.password)) {
            user.token = uuid.v4();
            setAuthCookie(res, user.token);
            res.send({ email: user.email });
            return;
        }
    }
    res.status(401).send({ msg: 'Unauthorized' });
});

// Logout removes the auth cookie and deletes the token from the user
apiRouter.delete('/auth/logout', async (req, res) => {
    const user = await findUser('token', req.cookies[authCookieName]);
    if (user) {
        delete user.token;
    }
    res.clearCookie(authCookieName);
    res.status(204).end();
});

// Middleware to verify authentication
const verifyAuth = async (req, res, next) => {
    const user = await findUser('token', req.cookies[authCookieName]);
    if (user) {
        req.user = user; // Attach user to request object for further use
        next();
    } else {
        res.status(401).send({ msg: 'Unauthorized' });
    }
};

// GetNotes returns all notes for the authenticated user
apiRouter.get('/notes', verifyAuth, async (req, res) => {
    const user = req.user;
    const userNotes = notes.filter(note => note.userId === user.id);
    if (userNotes.length > 0) {
        res.send(userNotes);
    } else {
        res.status(404).send({ msg: 'No notes found for user' });
    }
});

// GetPet returns the axolotl stats for the authenticated user
apiRouter.get('/pet', verifyAuth, async (req, res) => {
    const user = req.user;
    const userStats = axolotlStats.find(stats => stats.userId === user.id);
    if (userStats) {
        res.send(userStats);
    } else {
        res.status(404).send({ msg: 'No stats found for user' });
    }
});


// CreateNote creates a new note for the authenticated user
apiRouter.post('/notes', verifyAuth, async (req, res) => {
    const user = req.user;
    const note = {
        id: uuid.v4(),
        userId: user.id,
        reminder: req.body.reminder,
    };
    notes.push(note);
    res.status(201).send(note);
});

// CreatePet creates a new axolotl stats entry for the authenticated user
apiRouter.post('/pet', verifyAuth, async (req, res) => {
    const existingStats = axolotlStats.find(stats => stats.userId === req.user.id);
    if (existingStats) {
        return res.status(409).send({ msg: 'Pet stats already exist for user' });
    }
    const stats = createPetStats(req.user.id, req.body.petName);
    return res.status(201).send(stats);
});

// UpdatePet updates the axolotl stats for the authenticated user
apiRouter.put('/pet', verifyAuth, async (req, res) => {
    const user = req.user;
    let userStats = axolotlStats.find(stats => stats.userId === user.id);
    if (!userStats) {
        return res.status(404).send({ msg: 'No stats found for user' });
    }

    const allowedFields = ['petName', 'excitement', 'happiness'];
    for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
            userStats[field] = req.body[field];
        }
    }
    res.send(userStats);
});

apiRouter.get('/weather', async (req, res) => {
    const respone = await fetch('http://api.weatherstack.com/current?access_key=4ad0370b4fb950e762ecc3f9d85fe1df&query=Provo');
    const data = await respone.json();
    res.send({ description: data?.current?.weather_descriptions?.[0] || 'Unknown' });
});

// Default error handler
app.use(function (err, req, res, next) {
    res.status(500).send({ type: err.name, message: err.message });
});

// Return to default page if path is unknown
app.use((req, res) => {
    res.sendFile('index.html', { root: 'public' });
});

function createPetStats(userId, petName) {
    const stats = {
        userId: userId,
        petName: petName || 'Jimmy',
        excitement: 50,
        happiness: 50,
    };
    axolotlStats.push(stats);
    return stats;
}