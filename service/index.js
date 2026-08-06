const dns = require('dns');  // Use if mongo is having ECONNREFUSED issues
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config();

const port = process.argv.length > 2 ? process.argv[2] : 4000;

const cookieParser = require('cookie-parser');
const express = require('express');
const bcrypt = require('bcryptjs');
const uuid = require('uuid');
const DB = require('./database.js');
const app = express();
const { WebSocketServer } = require('ws');


const DECAY_RATES = {
    excitementPerHour: 2,
    happinessPerHour: 1,
};
const EXCITEMENT_BUMP = 5;

const authCookieName = "token";


app.use(express.static('public')); // Serve static files from the public directory
app.use(express.json());
app.use(cookieParser());


let apiRouter = express.Router();
app.use('/api', apiRouter);


const server = app.listen(port, () => {
    console.log(`Gedidone service listening on port ${port}`);
});


const wss = new WebSocketServer({ server, path: '/ws' });
const presence = new Map(); // socket -> { petName, mood }


function broadcast(message, exceptSocket = null) { // Tells everyone a message (join, leave) except the person joining/leaving
    const payload = JSON.stringify(message);
    wss.clients.forEach(client => {
        if (client !== exceptSocket && client.readyState === client.OPEN) {
            client.send(payload);
        }
    });
}

wss.on('connection', (socket) => {
    socket.on('message', (raw) => {
        let data;
        try {
            data = JSON.parse(raw);
        } catch {
            return; // Ignore invalid JSON
        }

        if (data.type === 'join') {
            const info = { id: data.id, petName: data.petName, mood: data.mood, excitement: data.excitement };

            for (const [existingSocket, existingInfo] of presence) {
                if (existingInfo.id === info.id && existingSocket !== socket) {
                    presence.delete(existingSocket);
                }
            }

            presence.set(socket, info);

            const others = [...presence.values()].filter((p) => p.id !== info.id);
            socket.send(JSON.stringify({ type: 'update', pets: others }));

            broadcast({ type: 'joined', pet: info }, socket);
        }
    });

    socket.on('close', () => {
        const info = presence.get(socket);
        presence.delete(socket);
        if (info) {
            broadcast({ type: 'left', id: info.id, petName: info.petName });
        }
    });
});

// CreateAuth creates a new user
apiRouter.post('/auth/create', async (req, res) => {
    try {
        if (await DB.getUser(req.body.email)) {
            res.status(409).send({ msg: 'Existing user' });
        } else {
            const user = await createUser(req.body.email, req.body.password);
            await createPetStats(user._id, req.body.petName);

            setAuthCookie(res, user.token);
            res.send({ email: user.email });
        }
    }
    catch (error) {
        console.error('Error creating user:', error);
        res.status(500).send({ msg: 'Error creating user' });
    }
});

// GetAuth login an existing user
apiRouter.post('/auth/login', async (req, res) => {
    try {
        const user = await DB.getUser(req.body.email);
        if (user) {
            if (await bcrypt.compare(req.body.password, user.password)) {
                user.token = uuid.v4();
                await DB.updateUser(user);
                setAuthCookie(res, user.token);
                res.send({ email: user.email });
                return;
            }
        }
        res.status(401).send({ msg: 'Unauthorized' });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).send({ msg: 'Error logging in' });
    }
});

// Logout removes the auth cookie and deletes the token from the user
apiRouter.delete('/auth/logout', async (req, res) => {
    try {
        const user = await DB.getUserByToken(req.cookies[authCookieName]);
        if (user) {
            await DB.updateUserRemoveAuth(user);
        }
        res.clearCookie(authCookieName);
        res.status(204).end();
    } catch (error) {
        console.error('Error logging out:', error);
        res.status(500).send({ msg: 'Error logging out' });
    }
});

// Middleware to verify authentication
const verifyAuth = async (req, res, next) => {
    try {
        const user = await DB.getUserByToken(req.cookies[authCookieName]);
        if (user) {
            req.user = user; // Attach user to request object for further use
            next();
        } else {
            res.status(401).send({ msg: 'Unauthorized' });
        }
    }
    catch (error) {
        console.error('Error verifying auth:', error);
        res.status(500).send({ msg: 'Error verifying auth' });
    };
};

// GetNotes returns all notes for the authenticated user
apiRouter.get('/notes', verifyAuth, async (req, res) => {
    try {
        const user = req.user;
        const userNotes = await DB.getNotesByUser(user);
        if (userNotes.length > 0) {
            res.send(userNotes);
        } else {
            res.status(404).send({ msg: 'No notes found for user' });
        }
    } catch (error) {
        console.error('Error fetching notes:', error);
        res.status(500).send({ msg: 'Error fetching notes' });
    }
});

// GetPet returns the axolotl stats for the authenticated user
apiRouter.get('/pet', verifyAuth, async (req, res) => {
    try {
        let userStats = await DB.getAxolotlStatsByUser(req.user);
        if (userStats) {
            userStats = applyDecay(userStats);
            await DB.updateAxolotlStats(userStats);
            res.send(userStats);
        } else {
            res.status(404).send({ msg: 'No stats found for user' });
        }
    } catch (error) {
        console.error('Error fetching pet stats:', error);
        res.status(500).send({ msg: 'Error fetching pet stats' });
    }
});


// CreateNote creates a new note for the authenticated user
apiRouter.post('/notes', verifyAuth, async (req, res) => {
    try {
        const user = req.user;
        const note = {
            userId: user._id,
            reminder: req.body.reminder,
        };
        await DB.createNote(note);

        let stats = await DB.getAxolotlStatsByUser(user);
        if (stats) {
            stats = applyDecay(stats);
            stats.excitement = Math.min(100, stats.excitement + EXCITEMENT_BUMP);
            await DB.updateAxolotlStats(stats);
        } else {
            console.warn('No axolotl stats found for user when creating note');
        }

        res.status(201).send(note);
    } catch (error) {
        console.error('Error creating note:', error);
        res.status(500).send({ msg: 'Error creating note' });
    }
});

// CreatePet creates a new axolotl stats entry for the authenticated user
apiRouter.post('/pet', verifyAuth, async (req, res) => {
    try {
        const existingStats = await DB.getAxolotlStatsByUser(req.user);
        if (existingStats) {
            return res.status(409).send({ msg: 'Pet stats already exist for user' });
        }
        const stats = await createPetStats(req.user._id, req.body.petName);
        return res.status(201).send(stats);
    } catch (error) {
        console.error('Error creating pet stats:', error);
        res.status(500).send({ msg: 'Error creating pet stats' });
    }
});

// UpdatePet updates the axolotl stats for the authenticated user
apiRouter.put('/pet', verifyAuth, async (req, res) => {
    try {
        let userStats = await DB.getAxolotlStatsByUser(req.user);
        if (!userStats) {
            return res.status(404).send({ msg: 'No stats found for user' });
        }

        userStats = applyDecay(userStats);

        const allowedFields = ['petName', 'excitement', 'happiness'];
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                userStats[field] = req.body[field];
            }
        }
        await DB.updateAxolotlStats(userStats);
        res.send(userStats);
    } catch (error) {
        console.error('Error updating pet stats:', error);
        res.status(500).send({ msg: 'Error updating pet stats' });
    }
});

apiRouter.get('/weather', async (req, res) => {
    try {
        const response = await fetch(`http://api.weatherstack.com/current?access_key=${process.env.WEATHERSTACK_KEY}&query=Provo`);
        const data = await response.json();
        res.send({ description: data?.current?.weather_descriptions?.[0] || 'Unknown' });
    } catch (error) {
        console.error('Error fetching weather data:', error);
        res.status(500).send({ msg: 'Error fetching weather data' });
    }
});

apiRouter.get('/auth/me', verifyAuth, async (req, res) => {
    try {
        res.send({ email: req.user.email });
    } catch (error) {
        console.error('Error fetching auth me:', error);
        res.status(500).send({ msg: 'Error fetching auth me' });
    }
});

// Default error handler
app.use(function (err, req, res, next) {
    try {
        console.error('Unhandled error:', err);
    } catch (error) {
        console.error('Error in error handler:', error);
    }
    res.status(500).send({ type: err.name, message: err.message });
});

// Return to default page if path is unknown
app.use((req, res) => {
    try {
        res.sendFile('index.html', { root: 'public' });
    } catch (error) {
        console.error('Error sending default page:', error);
    }
});

async function createPetStats(userId, petName) {
    const stats = {
        userId: userId,
        petName: petName || 'Jimmy',
        excitement: 50,
        happiness: 50,
        lastUpdated: Date.now(),
    };
    await DB.createAxolotlStats(stats);
    return stats;
}

async function createUser(email, password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
        email: email,
        password: hashedPassword,
        token: uuid.v4(),
    };
    await DB.createUser(user);
    return user;
}

function setAuthCookie(res, authToken) {
    res.cookie(authCookieName, authToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
    });
}

function applyDecay(stats) {
    const now = Date.now();
    const lastUpdated = stats.lastUpdated || now;
    const hoursElapsed = (now - lastUpdated) / (1000 * 60 * 60);

    return {
        ...stats,
        excitement: Math.max(0, Math.round(stats.excitement - DECAY_RATES.excitementPerHour * hoursElapsed)),
        happiness: Math.max(0, Math.round(stats.happiness - DECAY_RATES.happinessPerHour * hoursElapsed)),
        lastUpdated: now,
    };
}
